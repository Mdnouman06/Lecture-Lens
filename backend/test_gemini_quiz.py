"""
Unit tests for Gemini Quiz Generation and Transcript Grounding Validation Service.
Verifies:
1. Transcript-supported question is accepted.
2. Question containing an absent fact is rejected (carvedilol, COPD, esmolol, labetalol).
3. Explanation containing an absent fact is rejected (rebound hypertension, myocardial infarction, 9-minute half-life).
4. Paraphrased but transcript-supported statement is accepted.
5. Maximum generation attempts remain 2 (bounded retry, zero infinite loops).
6. Invalid/ungrounded quizzes are never persisted.
7. MCQ quality rules (5 questions, 4 unique options, valid correctIndex, template leakage rejection, 503 error handling).

All tests use mocked responses and do not perform live generations or require active internet.
"""

import sys
import unittest
from unittest.mock import patch, MagicMock
from typing import Any, Dict

import backend.services.gemini_quiz
sys.modules["services.gemini_quiz"] = backend.services.gemini_quiz

from backend.services.gemini_quiz import (
    generate_lecture_quiz_gemini,
    validate_gemini_quiz_quality,
    verify_question_grounding,
    verify_quiz_grounding,
    call_gemini_api,
    GeminiConfigError,
    GeminiUnavailableError,
)



# Exact short Beta Blockers lecture transcript used for live testing
BETA_BLOCKERS_SHORT_TRANSCRIPT = (
    "Beta-1 receptors are predominantly located in the heart and cardiac tissue. "
    "Activation of beta-1 receptors increases heart rate and contractility. "
    "Beta blockers inhibit these effects, resulting in decreased heart rate and decreased contractility. "
    "In addition, beta-1 blockade in the kidneys leads to reduced renin release. "
    "Propranolol is a non-selective beta blocker that blocks both beta-1 and beta-2 receptors. "
    "Beta-2 blockade causes bronchoconstriction, which is dangerous in asthma. "
    "Metoprolol is a relatively beta-1 selective antagonist with less effect on the bronchi."
)


def make_clean_5_question_quiz() -> Dict[str, Any]:
    """Helper generating a pristine 5-question quiz 100% grounded in the short Beta Blockers transcript."""
    return {
        "id": "quiz-clean",
        "title": "Beta Blockers - Exam Drill",
        "courseCode": "PHARM 301",
        "timeLimitMinutes": 25,
        "questions": [
            {
                "id": "q-1",
                "problemStatement": "Which beta-adrenergic receptor is predominantly found in cardiac tissue and increases heart rate upon activation?",
                "topicTag": "Receptor Distribution",
                "difficulty": "Easy",
                "options": ["Beta-1 receptor", "Beta-2 receptor", "Alpha-1 receptor", "Alpha-2 receptor"],
                "correctIndex": 0,
                "explanation": "Beta-1 receptors are predominantly located in the heart and cardiac tissue, increasing heart rate and contractility upon activation.",
                "slideCitation": "Lecture Slide 2",
                "pyqReference": "Exam Drill",
            },
            {
                "id": "q-2",
                "problemStatement": "Why is propranolol considered dangerous in patients suffering from asthma?",
                "topicTag": "Contraindications",
                "difficulty": "Medium",
                "options": [
                    "Non-selective beta-2 antagonism causes bronchoconstriction in airway smooth muscle",
                    "Selective beta-1 blockade causes pulmonary edema",
                    "Stimulation of bronchial beta receptors decreases airway resistance",
                    "Decreased renin release triggers acute bronchospasm",
                ],
                "correctIndex": 0,
                "explanation": "Propranolol is a non-selective antagonist that blocks beta-2 receptors in bronchial smooth muscle, precipitating bronchoconstriction.",
                "slideCitation": "Lecture Slide 5",
                "pyqReference": "Exam Drill",
            },
            {
                "id": "q-3",
                "problemStatement": "What distinguishes metoprolol from propranolol regarding bronchial airway resistance?",
                "topicTag": "Cardioselectivity",
                "difficulty": "Medium",
                "options": [
                    "Metoprolol is relatively beta-1 selective with less effect on the bronchi",
                    "Metoprolol is non-selective with identical bronchial effects",
                    "Metoprolol exclusively targets peripheral vascular smooth muscle",
                    "Metoprolol selectively activates beta-2 receptors in the airway",
                ],
                "correctIndex": 0,
                "explanation": "Metoprolol is a relatively beta-1 selective antagonist, producing less effect on the bronchi than non-selective propranolol.",
                "slideCitation": "Lecture Slide 7",
                "pyqReference": "Exam Drill",
            },
            {
                "id": "q-4",
                "problemStatement": "What physiological change occurs in the kidneys following beta-1 receptor blockade?",
                "topicTag": "Renal Effects",
                "difficulty": "Hard",
                "options": [
                    "Reduced renin release",
                    "Increased renin secretion",
                    "Stimulation of juxtaglomerular contractility",
                    "Bronchial airway constriction",
                ],
                "correctIndex": 0,
                "explanation": "Beta-1 receptor blockade in the kidneys leads directly to reduced renin release.",
                "slideCitation": "Lecture Slide 4",
                "pyqReference": "Exam Drill",
            },
            {
                "id": "q-5",
                "problemStatement": "What are the primary cardiac consequences of inhibiting beta-1 adrenergic receptors?",
                "topicTag": "Hemodynamics",
                "difficulty": "Medium",
                "options": [
                    "Decreased heart rate and decreased contractility",
                    "Increased heart rate and increased contractility",
                    "Selective bronchodilation and tachycardia",
                    "Excessive renin release and vasoconstriction",
                ],
                "correctIndex": 0,
                "explanation": "Inhibiting beta-1 stimulation results in decreased heart rate and decreased cardiac contractility.",
                "slideCitation": "Lecture Slide 3",
                "pyqReference": "Exam Drill",
            },
        ],
    }


class TestGeminiQuizGroundingAndQuality(unittest.TestCase):
    def setUp(self):
        self.sample_transcript = BETA_BLOCKERS_SHORT_TRANSCRIPT
        # Mock the second-stage grounding verifier by default so unit tests do not
        # consume external network or exhaust free-tier Gemini API quotas.
        self.verifier_patcher = patch(
            "backend.services.gemini_quiz.call_gemini_grounding_verifier",
            return_value={
                "isGrounded": True,
                "unsupportedFacts": [],
                "reason": "All claims supported by lecture transcript.",
                "validatedComponents": {
                    "problemStatementSupported": True,
                    "optionsSupported": True,
                    "correctAnswerSupported": True,
                    "explanationSupported": True,
                },
            },
        )
        self.mock_verifier = self.verifier_patcher.start()
        self.addCleanup(self.verifier_patcher.stop)


    # =========================================================================
    # FOCUSED TEST 1: A transcript-supported question is accepted
    # =========================================================================
    def test_1_transcript_supported_question_accepted(self):
        """1. A transcript-supported question is accepted."""
        q = {
            "id": "q-1",
            "problemStatement": "Which beta-adrenergic receptor is predominantly found in cardiac tissue and increases heart rate upon activation?",
            "topicTag": "Receptor Distribution",
            "difficulty": "Easy",
            "options": ["Beta-1 receptor", "Beta-2 receptor", "Alpha-1 receptor", "Alpha-2 receptor"],
            "correctIndex": 0,
            "explanation": "Beta-1 receptors are predominantly located in the heart and cardiac tissue, increasing heart rate and contractility upon activation.",
        }
        verdict = verify_question_grounding(q, self.sample_transcript)
        self.assertTrue(verdict["isGrounded"])
        self.assertEqual(len(verdict["unsupportedFacts"]), 0)
        self.assertTrue(verdict["validatedComponents"]["problemStatementSupported"])
        self.assertTrue(verdict["validatedComponents"]["optionsSupported"])
        self.assertTrue(verdict["validatedComponents"]["correctAnswerSupported"])
        self.assertTrue(verdict["validatedComponents"]["explanationSupported"])

    # =========================================================================
    # FOCUSED TEST 2: A question containing an absent fact is rejected
    # =========================================================================
    def test_2_question_containing_absent_fact_rejected(self):
        """2. A question containing an absent fact (e.g. carvedilol, COPD, esmolol, labetalol) is rejected."""
        # 2a. Question with absent drug (carvedilol)
        q_carvedilol = {
            "id": "q-2a",
            "problemStatement": "Which drug acts as a non-selective beta blocker with vasodilating properties?",
            "options": ["Carvedilol", "Metoprolol", "Propranolol", "Beta blocker"],
            "correctIndex": 0,
            "explanation": "Carvedilol provides dual non-selective beta and alpha-1 blockade.",
        }
        verdict_c = verify_question_grounding(q_carvedilol, self.sample_transcript)
        self.assertFalse(verdict_c["isGrounded"])
        self.assertTrue(any("carvedilol" in f.lower() for f in verdict_c["unsupportedFacts"]))

        # 2b. Question with absent condition (COPD) in problem statement
        q_copd = {
            "id": "q-2b",
            "problemStatement": "Why is propranolol contraindicated in patients with severe COPD?",
            "options": ["Causes bronchoconstriction", "Decreases renal flow", "Increases heart rate", "Decreases contractility"],
            "correctIndex": 0,
            "explanation": "Propranolol blocks beta-2 receptors, causing dangerous airway constriction in lung diseases.",
        }
        verdict_copd = verify_question_grounding(q_copd, self.sample_transcript)
        self.assertFalse(verdict_copd["isGrounded"])
        self.assertFalse(verdict_copd["validatedComponents"]["problemStatementSupported"])
        self.assertTrue(any("copd" in f.lower() for f in verdict_copd["unsupportedFacts"]))

        # 2c. Question with absent drug in distractors (esmolol / labetalol)
        q_esmolol = {
            "id": "q-2c",
            "problemStatement": "Which cardioselective beta blocker has less effect on bronchial airway resistance?",
            "options": ["Metoprolol", "Esmolol", "Labetalol", "Propranolol"],
            "correctIndex": 0,
            "explanation": "Metoprolol is relatively beta-1 selective with minimal bronchial resistance effects.",
        }
        verdict_e = verify_question_grounding(q_esmolol, self.sample_transcript)
        self.assertFalse(verdict_e["isGrounded"])
        self.assertFalse(verdict_e["validatedComponents"]["optionsSupported"])
        self.assertTrue(any("esmolol" in f.lower() or "labetalol" in f.lower() for f in verdict_e["unsupportedFacts"]))

    # =========================================================================
    # FOCUSED TEST 3: An explanation containing an absent fact is rejected
    # =========================================================================
    def test_3_explanation_containing_absent_fact_rejected(self):
        """3. An explanation containing an absent fact (e.g. 9-minute half-life, rebound hypertension, myocardial infarction) is rejected."""
        q_bad_expl = {
            "id": "q-3",
            "problemStatement": "What is the primary cardiac consequence of inhibiting beta-1 receptors?",
            "options": [
                "Decreased heart rate and decreased contractility",
                "Increased heart rate and contractility",
                "Bronchoconstriction in airway tissue",
                "Increased renin secretion in kidney cells",
            ],
            "correctIndex": 0,
            "explanation": "Inhibiting beta-1 receptors reduces heart rate, but abrupt cessation precipitates rebound hypertension and myocardial infarction.",
        }
        verdict = verify_question_grounding(q_bad_expl, self.sample_transcript)
        self.assertFalse(verdict["isGrounded"])
        self.assertTrue(verdict["validatedComponents"]["problemStatementSupported"])
        self.assertTrue(verdict["validatedComponents"]["optionsSupported"])
        self.assertTrue(verdict["validatedComponents"]["correctAnswerSupported"])
        self.assertFalse(verdict["validatedComponents"]["explanationSupported"])
        self.assertTrue(any("rebound hypertension" in f.lower() or "myocardial infarction" in f.lower() for f in verdict["unsupportedFacts"]))

    # =========================================================================
    # FOCUSED TEST 4: A paraphrased but transcript-supported statement is accepted
    # =========================================================================
    def test_4_paraphrased_but_transcript_supported_statement_accepted(self):
        """4. A paraphrased but transcript-supported statement is accepted."""
        q_paraphrase = {
            "id": "q-4",
            "problemStatement": "How does metoprolol differ from propranolol regarding bronchial airway resistance?",
            "options": [
                "Metoprolol is relatively beta-1 selective with less effect on the bronchi",
                "Metoprolol is non-selective with identical bronchial effects",
                "Metoprolol exclusively targets peripheral vascular smooth muscle",
                "Metoprolol selectively activates beta-2 receptors in the airway",
            ],
            "correctIndex": 0,
            "explanation": "Metoprolol is a relatively beta-1 selective antagonist, producing less effect on the bronchi than non-selective propranolol.",
        }
        verdict = verify_question_grounding(q_paraphrase, self.sample_transcript)
        self.assertTrue(verdict["isGrounded"])
        self.assertEqual(len(verdict["unsupportedFacts"]), 0)
        self.assertTrue(verdict["validatedComponents"]["problemStatementSupported"])
        self.assertTrue(verdict["validatedComponents"]["explanationSupported"])

    # =========================================================================
    # FOCUSED TEST 5: Maximum generation attempts remain 2
    # =========================================================================
    def test_5_maximum_generation_attempts_remain_two(self):
        """5. Maximum generation attempts remain 2 (at most 1 retry, no infinite loop)."""
        invalid_ungrounded_quiz = make_clean_5_question_quiz()
        invalid_ungrounded_quiz["questions"][0]["problemStatement"] = "Why is carvedilol contraindicated in severe COPD?"
        invalid_ungrounded_quiz["questions"][0]["options"] = ["Carvedilol", "Labetalol", "Esmolol", "COPD"]

        clean_quiz = make_clean_5_question_quiz()

        # Case 5a: Attempt 1 fails grounding, Attempt 2 succeeds -> exactly 2 calls
        with patch("backend.services.gemini_quiz.call_gemini_api", side_effect=[invalid_ungrounded_quiz, clean_quiz]) as mock_call:
            quiz = generate_lecture_quiz_gemini(
                transcript_text=self.sample_transcript,
                title="Beta Blockers",
                course_code="PHARM 301",
            )
            self.assertEqual(mock_call.call_count, 2)
            self.assertEqual(len(quiz["questions"]), 5)
            # Verify retry prompt includes critical correction instruction
            retry_prompt = mock_call.call_args_list[1][1].get("prompt") or mock_call.call_args_list[1][0][0]
            self.assertIn("CRITICAL CORRECTION REQUIRED", retry_prompt)

        # Case 5b: Attempt 1 and Attempt 2 both fail grounding -> exactly 2 calls, raises RuntimeError (no infinite loop)
        with patch("backend.services.gemini_quiz.call_gemini_api", side_effect=[invalid_ungrounded_quiz, invalid_ungrounded_quiz]) as mock_call:
            with self.assertRaises(RuntimeError) as ctx:
                generate_lecture_quiz_gemini(
                    transcript_text=self.sample_transcript,
                    title="Beta Blockers",
                    course_code="PHARM 301",
                )
            self.assertEqual(mock_call.call_count, 2)
            self.assertIn("grounding violation", str(ctx.exception).lower())

    # =========================================================================
    # FOCUSED TEST 6: Invalid/ungrounded quizzes are never persisted
    # =========================================================================
    def test_6_invalid_ungrounded_quizzes_never_persisted(self):
        """6. Invalid/ungrounded quizzes are never persisted."""
        from backend.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)
        ungrounded_quiz = make_clean_5_question_quiz()
        ungrounded_quiz["questions"][0]["options"] = ["Carvedilol", "Esmolol", "Labetalol", "Propranolol"]

        with patch("backend.services.gemini_quiz.call_gemini_api", return_value=ungrounded_quiz), \
             patch("backend.main.save_lecture_quiz") as mock_save:
            response = client.post(
                "/generate/quiz",
                json={
                    "text": self.sample_transcript,
                    "title": "Beta Blockers",
                    "courseCode": "PHARM 301",
                    "lectureId": "lec-unpersisted-test",
                },
            )
            # Request fails with 500
            self.assertEqual(response.status_code, 500)
            self.assertIn("Quiz generation failed", response.json()["detail"])
            # save_lecture_quiz MUST NOT have been called
            mock_save.assert_not_called()

    # =========================================================================
    # MCQ QUALITY & STRUCTURAL INTEGRITY TESTS
    # =========================================================================
    def test_valid_response_accepted(self):
        """Gemini returns a valid 5-question quiz. Expected: accepted."""
        mock_quiz = make_clean_5_question_quiz()
        with patch("backend.services.gemini_quiz.call_gemini_api", return_value=mock_quiz) as mock_call:
            quiz = generate_lecture_quiz_gemini(
                transcript_text=self.sample_transcript,
                title="Beta Blockers",
                course_code="PHARM 301",
                lecture_id="lec-pharm-01",
            )
            self.assertEqual(len(quiz["questions"]), 5)
            self.assertEqual(quiz["lectureId"], "lec-pharm-01")
            for q in quiz["questions"]:
                self.assertEqual(len(q["options"]), 4)
                self.assertIn(q["correctIndex"], [0, 1, 2, 3])
                self.assertTrue(len(q["problemStatement"]) >= 10)
                self.assertTrue(len(q["explanation"]) >= 10)
            mock_call.assert_called_once()

    def test_duplicate_options_rejected(self):
        """Duplicate options in question choices. Expected: rejected."""
        mock_quiz = make_clean_5_question_quiz()
        # Introduce duplicate option in Question 1
        mock_quiz["questions"][0]["options"] = [
            "Beta-1 receptor",
            "Beta-1 receptor",  # Duplicate!
            "Alpha-1 receptor",
            "Alpha-2 receptor",
        ]
        with patch("backend.services.gemini_quiz.call_gemini_api", return_value=mock_quiz):
            with self.assertRaises(RuntimeError) as ctx:
                generate_lecture_quiz_gemini(
                    transcript_text=self.sample_transcript,
                    title="Beta Blockers",
                    course_code="PHARM 301",
                )
            self.assertIn("duplicate options", str(ctx.exception).lower())

    def test_invalid_correct_index_rejected(self):
        """Invalid correctIndex (e.g. 4 or 5). Expected: rejected."""
        mock_quiz = make_clean_5_question_quiz()
        mock_quiz["questions"][1]["correctIndex"] = 4  # Out of range 0-3
        with patch("backend.services.gemini_quiz.call_gemini_api", return_value=mock_quiz):
            with self.assertRaises(RuntimeError) as ctx:
                generate_lecture_quiz_gemini(
                    transcript_text=self.sample_transcript,
                    title="Beta Blockers",
                    course_code="PHARM 301",
                )
            self.assertIn("invalid correctindex", str(ctx.exception).lower())

    def test_template_leakage_rejected(self):
        """Placeholder/template leakage strings present. Expected: rejected."""
        mock_quiz = make_clean_5_question_quiz()
        mock_quiz["questions"][0]["options"][1] = "First plausible option"  # Known placeholder
        with patch("backend.services.gemini_quiz.call_gemini_api", return_value=mock_quiz):
            with self.assertRaises(RuntimeError) as ctx:
                generate_lecture_quiz_gemini(
                    transcript_text=self.sample_transcript,
                    title="Beta Blockers",
                    course_code="PHARM 301",
                )
            self.assertIn("template leakage", str(ctx.exception).lower())

    def test_ungrounded_content_rejected(self):
        """Ungrounded domain content (e.g. NMDA receptors in Operating Systems). Expected: rejected."""
        os_transcript = (
            "An operating system manages hardware and memory resources. "
            "Processes run in user mode and switch to kernel mode via system calls. "
            "Page tables translate virtual addresses to physical page frames."
        )
        mock_quiz = make_clean_5_question_quiz()
        # Question 1 asks about NMDA on an OS lecture
        mock_quiz["questions"][0]["problemStatement"] = "How does the NMDA receptor magnesium block release during depolarization?"
        mock_quiz["questions"][0]["options"] = ["Membrane depolarization", "Hyperpolarization", "Chloride influx", "Sodium pump"]

        with patch("backend.services.gemini_quiz.call_gemini_api", return_value=mock_quiz):
            with self.assertRaises(RuntimeError) as ctx:
                generate_lecture_quiz_gemini(
                    transcript_text=os_transcript,
                    title="Operating Systems Fundamentals",
                    course_code="General",
                )
            self.assertIn("grounding violation", str(ctx.exception).lower())

    def test_gemini_unavailable_clear_error(self):
        """Missing API key or API failure returns clear configuration/provider error."""
        # Missing API key
        with patch.dict("os.environ", {"GEMINI_API_KEY": ""}):
            with self.assertRaises(GeminiConfigError) as ctx:
                generate_lecture_quiz_gemini(
                    transcript_text=self.sample_transcript,
                    title="Beta Blockers",
                    course_code="PHARM 301",
                    api_key="",
                )
            self.assertIn("GEMINI_API_KEY", str(ctx.exception))
            self.assertIn("GEMINI_MODEL", str(ctx.exception))

        # API unavailable (HTTP 503 / network failure)
        with patch("backend.services.gemini_quiz.requests.post") as mock_post:
            mock_post.return_value = MagicMock(status_code=503, text="Service Unavailable")
            with self.assertRaises(GeminiUnavailableError) as ctx:
                call_gemini_api(
                    prompt="test",
                    api_key="mock_key",
                    model="gemini-3.5-flash-lite",
                )
            self.assertIn("GEMINI_API_KEY", str(ctx.exception))
            self.assertIn("GEMINI_MODEL", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
