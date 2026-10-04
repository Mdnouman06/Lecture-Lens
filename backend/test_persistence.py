"""
Unit Tests for LectureLens Durable Storage and Persistence.
Tests Flashcard and Quiz persistence, FSRS telemetry retention,
option ordering preservation, and summary counts without invoking live LLMs.
"""

import unittest
import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.storage import (
    save_lecture_flashcards,
    get_lecture_flashcards,
    update_flashcard_fsrs_review,
    save_lecture_quiz,
    get_lecture_quiz,
    save_quiz_submission,
    get_quiz_submissions,
    get_latest_quiz_result,
    get_recall_summary,
    save_lecture_notes,
    get_lecture_notes,
    save_lecture_transcripts,
    get_lecture_transcripts,
    save_lecture_progress,
    get_lecture_progress,
    save_pyq_paper,
    get_all_pyq_papers,
    delete_pyq_paper,
)


class TestLecturePersistence(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.lecture_id = "test-lec-durability-101"

    def test_01_flashcard_save_and_retrieve(self):
        """Verify flashcards can be saved and retrieved accurately."""
        sample_cards = [
            {
                "id": "card-1",
                "question": "What is long-term potentiation?",
                "answerLead": "LTP is persistent strengthening of synapses.",
                "answerBody": "It is based on recent patterns of activity.",
                "mastered": False,
                "difficulty": "good",
                "stability": 1.5,
                "intervalDisplay": "1.5d",
            },
            {
                "id": "card-2",
                "question": "What role does NMDA play in synaptic plasticity?",
                "answerLead": "NMDA acts as a coincidence detector.",
                "answerBody": "It requires both glutamate binding and membrane depolarization.",
                "mastered": False,
                "difficulty": "hard",
                "stability": 0.5,
                "intervalDisplay": "0.5d",
            },
        ]

        saved = save_lecture_flashcards(self.lecture_id, sample_cards)
        self.assertEqual(len(saved), 2)
        self.assertEqual(saved[0]["lectureId"], self.lecture_id)

        # Retrieve and verify contents
        retrieved = get_lecture_flashcards(self.lecture_id)
        self.assertEqual(len(retrieved), 2)
        self.assertEqual(retrieved[0]["question"], "What is long-term potentiation?")
        self.assertEqual(retrieved[1]["id"], "card-2")

    def test_02_flashcard_replacement_prevents_duplicates(self):
        """Generating a new deck replaces the old deck cleanly."""
        new_cards = [
            {
                "id": "card-fresh-1",
                "question": "Updated Question 1?",
                "answerLead": "Updated Answer 1",
                "answerBody": "Details 1",
            }
        ]
        save_lecture_flashcards(self.lecture_id, new_cards)
        retrieved = get_lecture_flashcards(self.lecture_id)
        self.assertEqual(len(retrieved), 1)
        self.assertEqual(retrieved[0]["id"], "card-fresh-1")

    def test_03_fsrs_telemetry_update(self):
        """Updating FSRS mastery updates difficulty and stability permanently."""
        cards = [
            {
                "id": "card-fsrs-test",
                "question": "Action Potential threshold?",
                "answerLead": "-55 mV",
                "answerBody": "Voltage-gated sodium channels open rapidly.",
                "mastered": False,
                "difficulty": "hard",
                "stability": 0.5,
            }
        ]
        save_lecture_flashcards(self.lecture_id, cards)

        # User rates card as 'easy'
        success = update_flashcard_fsrs_review(
            self.lecture_id,
            card_id="card-fsrs-test",
            rating="easy",
            mastered=True,
            difficulty=0.1,
            stability=3.0,
        )
        self.assertTrue(success)

        # Verify persisted state
        updated_cards = get_lecture_flashcards(self.lecture_id)
        self.assertEqual(len(updated_cards), 1)
        target = updated_cards[0]
        self.assertTrue(target["mastered"])
        self.assertEqual(target["difficulty"], "easy")
        self.assertEqual(target["stability"], 3.0)
        self.assertEqual(target["intervalDisplay"], "3.0d")

    def test_04_quiz_save_preserves_option_order_and_correct_index(self):
        """
        Verify quiz options ordering and randomized correctIndex are strictly preserved
        without accidental re-sorting.
        """
        sample_quiz = {
            "id": f"quiz-{self.lecture_id}",
            "lectureId": self.lecture_id,
            "title": "Cellular Neuroscience Drill",
            "courseCode": "NEURO 301",
            "timeLimitMinutes": 25,
            "questions": [
                {
                    "id": "q-1",
                    "question": "Where does sodium influx occur during action potential?",
                    "options": [
                        "Myelin sheath",
                        "Nodes of Ranvier",
                        "Soma cytoplasm",
                        "Synaptic vesicles",
                    ],
                    "correctIndex": 1,  # B
                    "correctAnswer": "Nodes of Ranvier",
                    "explanation": "Saltatory conduction occurs at the Nodes of Ranvier.",
                },
                {
                    "id": "q-2",
                    "question": "What ion triggers neurotransmitter exocytosis?",
                    "options": [
                        "Potassium (K+)",
                        "Chloride (Cl-)",
                        "Magnesium (Mg2+)",
                        "Calcium (Ca2+)",
                    ],
                    "correctIndex": 3,  # D
                    "correctAnswer": "Calcium (Ca2+)",
                    "explanation": "Voltage-gated Ca2+ channels trigger vesicle fusion.",
                },
            ],
        }

        save_lecture_quiz(self.lecture_id, sample_quiz)

        # Retrieve and verify
        retrieved_quiz = get_lecture_quiz(self.lecture_id)
        self.assertIsNotNone(retrieved_quiz)
        self.assertEqual(retrieved_quiz["title"], "Cellular Neuroscience Drill")
        self.assertEqual(len(retrieved_quiz["questions"]), 2)

        q1 = retrieved_quiz["questions"][0]
        self.assertEqual(q1["correctIndex"], 1)
        self.assertEqual(q1["options"][1], "Nodes of Ranvier")
        self.assertEqual(q1["options"], [
            "Myelin sheath",
            "Nodes of Ranvier",
            "Soma cytoplasm",
            "Synaptic vesicles",
        ])

        q2 = retrieved_quiz["questions"][1]
        self.assertEqual(q2["correctIndex"], 3)
        self.assertEqual(q2["options"][3], "Calcium (Ca2+)")
        self.assertEqual(q2["options"], [
            "Potassium (K+)",
            "Chloride (Cl-)",
            "Magnesium (Mg2+)",
            "Calcium (Ca2+)",
        ])

    def test_05_quiz_submission_history_and_scoring(self):
        """Verify quiz results are saved and retrievable."""
        quiz_id = f"quiz-{self.lecture_id}"
        answers = {
            "0": {"selected": 1, "correct": 1, "isCorrect": True},
            "1": {"selected": 3, "correct": 3, "isCorrect": True},
        }

        submission = save_quiz_submission(
            lecture_id=self.lecture_id,
            quiz_id=quiz_id,
            score=2,
            total_questions=2,
            answers=answers,
            time_spent_seconds=120,
        )
        self.assertEqual(submission["percentage"], 100)
        self.assertEqual(submission["score"], 2)

        # Retrieve submissions
        history = get_quiz_submissions(self.lecture_id)
        self.assertGreaterEqual(len(history), 1)
        self.assertEqual(history[0]["score"], 2)
        self.assertEqual(history[0]["percentage"], 100)

        # Check latest quiz result
        latest = get_latest_quiz_result(self.lecture_id)
        self.assertIsNotNone(latest)
        self.assertEqual(latest["score"], 2)

    def test_06_recall_summary_truthful_counts(self):
        """Verify summary endpoint returns real counts without fake data."""
        summary = get_recall_summary()
        self.assertIn(self.lecture_id, summary)
        lec_summary = summary[self.lecture_id]
        self.assertEqual(lec_summary["flashcardCount"], 1)  # from test_02 / test_03
        self.assertEqual(lec_summary["quizQuestionCount"], 2)  # from test_04
        self.assertTrue(lec_summary["hasQuiz"])

    def test_07_rest_api_endpoints(self):
        """Verify REST API routes for persistence."""
        # 1. GET /lectures/{id}/flashcards
        res = self.client.get(f"/lectures/{self.lecture_id}/flashcards")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("cards", data)
        self.assertEqual(len(data["cards"]), 1)

        # 2. PATCH /lectures/{id}/flashcards/{card_id}/mastery
        card_id = data["cards"][0]["id"]
        res = self.client.patch(
            f"/lectures/{self.lecture_id}/flashcards/{card_id}/mastery",
            json={"rating": "good", "mastered": True, "stability": 2.0},
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])

        # 3. GET /lectures/{id}/quiz
        res = self.client.get(f"/lectures/{self.lecture_id}/quiz")
        self.assertEqual(res.status_code, 200)
        q_data = res.json()
        self.assertIn("quiz", q_data)
        self.assertIsNotNone(q_data["quiz"])
        self.assertEqual(len(q_data["quiz"]["questions"]), 2)

        # 4. POST /quiz/submit
        res = self.client.post(
            "/quiz/submit",
            json={
                "quizId": f"quiz-{self.lecture_id}",
                "lectureId": self.lecture_id,
                "answers": {"0": 1, "1": 3},
                "correctAnswers": {"0": 1, "1": 3},
                "timeSpentSeconds": 95,
            },
        )
        self.assertEqual(res.status_code, 200)
        submit_res = res.json()
        self.assertEqual(submit_res["score"], 2)
        self.assertEqual(submit_res["percentage"], 100)

        # 5. GET /lectures/summary/recall
        res = self.client.get("/lectures/summary/recall")
        self.assertEqual(res.status_code, 200)
        sum_data = res.json()
        self.assertIn("summary", sum_data)
        self.assertIn(self.lecture_id, sum_data["summary"])

    def test_08_flashcard_review_state_roundtrip_and_resume(self):
        """
        Verify that review rating preserves FSRS telemetry, reviewed flag, reps,
        lastReviewed timestamp, and allows computing the correct resume index.
        """
        lec_a = f"test-lec-fsrs-resume-a-{uuid.uuid4().hex[:8]}"
        initial_cards = [
            {"id": "card-a-1", "question": "Q1?", "answerLead": "A1", "answerBody": "B1"},
            {"id": "card-a-2", "question": "Q2?", "answerLead": "A2", "answerBody": "B2"},
            {"id": "card-a-3", "question": "Q3?", "answerLead": "A3", "answerBody": "B3"},
        ]
        save_lecture_flashcards(lec_a, initial_cards)

        # 1. Initially all cards are unreviewed
        cards = get_lecture_flashcards(lec_a)
        for c in cards:
            self.assertFalse(c.get("reviewed", False))
            self.assertIsNone(c.get("lastReviewed"))
            self.assertEqual(c.get("reps", 0), 0)

        # 2. Rate Card 1 as 'good'
        res1 = self.client.patch(
            f"/lectures/{lec_a}/flashcards/card-a-1/mastery",
            json={
                "rating": "good",
                "mastered": True,
                "difficulty": "good",
                "stability": 1.5,
                "reviewed": True,
                "reps": 1,
            },
        )
        self.assertEqual(res1.status_code, 200)

        # 3. Rate Card 2 as 'again'
        res2 = self.client.patch(
            f"/lectures/{lec_a}/flashcards/card-a-2/mastery",
            json={
                "rating": "again",
                "mastered": False,
                "difficulty": "again",
                "stability": 0.5,
                "reviewed": True,
                "reps": 1,
            },
        )
        self.assertEqual(res2.status_code, 200)

        # 4. Simulate reopening Lecture A (fetch persisted flashcards)
        reopened_cards = get_lecture_flashcards(lec_a)
        self.assertEqual(len(reopened_cards), 3)

        # Card 1 verification
        c1 = next(c for c in reopened_cards if c["id"] == "card-a-1")
        self.assertTrue(c1["reviewed"])
        self.assertEqual(c1["rating"], "good")
        self.assertEqual(c1["difficulty"], "good")
        self.assertEqual(c1["stability"], 1.5)
        self.assertTrue(c1["mastered"])
        self.assertIsNotNone(c1["lastReviewed"])
        self.assertEqual(c1["reps"], 1)

        # Card 2 verification
        c2 = next(c for c in reopened_cards if c["id"] == "card-a-2")
        self.assertTrue(c2["reviewed"])
        self.assertEqual(c2["rating"], "again")
        self.assertEqual(c2["difficulty"], "again")
        self.assertEqual(c2["stability"], 0.5)
        self.assertFalse(c2["mastered"])
        self.assertIsNotNone(c2["lastReviewed"])
        self.assertEqual(c2["reps"], 1)

        # Card 3 verification (remains brand new / unreviewed)
        c3 = next(c for c in reopened_cards if c["id"] == "card-a-3")
        self.assertFalse(c3.get("reviewed", False))
        self.assertIsNone(c3.get("rating"))
        self.assertEqual(c3.get("reps", 0), 0)

        # 5. Compute resume index: should be index 2 (Card 3)
        unreviewed_idx = next(
            (idx for idx, c in enumerate(reopened_cards) if not c.get("reviewed")),
            len(reopened_cards),
        )
        self.assertEqual(unreviewed_idx, 2)

    def test_09_completed_quiz_resume_exact_order_and_answers(self):
        """
        Verify that a completed quiz drill restores the exact questions,
        exact option ordering, exact correct answers, and user selections.
        """
        lec_id = f"test-lec-quiz-resume-{uuid.uuid4().hex[:8]}"
        quiz = {
            "id": f"quiz-{lec_id}",
            "title": "Synaptic Transmission Drill",
            "courseCode": "BIO 210",
            "timeLimitMinutes": 25,
            "questions": [
                {
                    "id": "q-1",
                    "problemStatement": "What is the primary excitatory neurotransmitter in the CNS?",
                    "options": ["GABA", "Glycine", "Glutamate", "Dopamine"],
                    "correctIndex": 2,  # Glutamate (C)
                    "explanation": "Glutamate is the major excitatory neurotransmitter.",
                    "topicTag": "Neurochemistry",
                    "difficulty": "Standard",
                },
                {
                    "id": "q-2",
                    "problemStatement": "Which ion mediates IPSPs via GABAA receptors?",
                    "options": ["Sodium", "Chloride", "Calcium", "Potassium"],
                    "correctIndex": 1,  # Chloride (B)
                    "explanation": "Chloride influx hyperpolarizes the membrane.",
                    "topicTag": "Synaptic Plasticity",
                    "difficulty": "Hard",
                },
            ],
        }
        save_lecture_quiz(lec_id, quiz)

        # Submit user answers: Q1 -> 2 (correct), Q2 -> 0 (incorrect, picked Sodium instead of Chloride)
        # Score = 1/2 (50%)
        submit_res = self.client.post(
            "/quiz/submit",
            json={
                "quizId": f"quiz-{lec_id}",
                "lectureId": lec_id,
                "answers": {"0": 2, "1": 0},
                "correctAnswers": {"0": 2, "1": 1},
                "timeSpentSeconds": 140,
            },
        )
        self.assertEqual(submit_res.status_code, 200)
        sub_data = submit_res.json()
        self.assertEqual(sub_data["score"], 1)
        self.assertEqual(sub_data["totalQuestions"], 2)
        self.assertEqual(sub_data["percentage"], 50)

        # Fetch persisted quiz results (simulating reopening the lecture)
        results_res = self.client.get(f"/lectures/{lec_id}/quiz/results")
        self.assertEqual(results_res.status_code, 200)
        results = results_res.json()["results"]
        self.assertEqual(len(results), 1)

        restored_res = results[0]
        self.assertEqual(restored_res["score"], 1)
        self.assertEqual(restored_res["totalQuestions"], 2)
        self.assertEqual(restored_res["percentage"], 50)
        self.assertIn("0", restored_res["answers"])
        self.assertIn("1", restored_res["answers"])

        # Fetch persisted active quiz (ensuring option order and correctIndex didn't shift)
        quiz_res = self.client.get(f"/lectures/{lec_id}/quiz")
        self.assertEqual(quiz_res.status_code, 200)
        restored_quiz = quiz_res.json()["quiz"]
        self.assertEqual(restored_quiz["questions"][0]["options"], ["GABA", "Glycine", "Glutamate", "Dopamine"])
        self.assertEqual(restored_quiz["questions"][0]["correctIndex"], 2)
        self.assertEqual(restored_quiz["questions"][1]["options"], ["Sodium", "Chloride", "Calcium", "Potassium"])
        self.assertEqual(restored_quiz["questions"][1]["correctIndex"], 1)

    def test_10_lecture_state_isolation(self):
        """Verify strict isolation across different lecture IDs."""
        lec_1 = f"test-isolation-lec-1-{uuid.uuid4().hex[:8]}"
        lec_2 = f"test-isolation-lec-2-{uuid.uuid4().hex[:8]}"

        # Save flashcards for Lec 1
        save_lecture_flashcards(lec_1, [{"id": "c1", "question": "Lec 1 Q"}])
        # Save flashcards for Lec 2
        save_lecture_flashcards(lec_2, [{"id": "c2", "question": "Lec 2 Q"}])

        cards_1 = get_lecture_flashcards(lec_1)
        cards_2 = get_lecture_flashcards(lec_2)
        self.assertEqual(len(cards_1), 1)
        self.assertEqual(cards_1[0]["id"], "c1")
        self.assertEqual(len(cards_2), 1)
        self.assertEqual(cards_2[0]["id"], "c2")

        # Rate c1 in Lec 1
        update_flashcard_fsrs_review(lec_1, "c1", "good", reviewed=True)
        # Check c2 in Lec 2 remains unreviewed
        cards_2_rechecked = get_lecture_flashcards(lec_2)
        self.assertFalse(cards_2_rechecked[0].get("reviewed", False))

    def test_11_lecture_notes_persistence(self):
        """Verify saving and fetching study notes via SQLite and REST API."""
        lec_id = f"test-notes-{uuid.uuid4().hex[:8]}"
        notes_data = {
            "summary": "Mechanics of Synaptic Plasticity",
            "markdown": "# Synaptic Plasticity\n\nNotes content with $E = mc^2$",
            "keyConcepts": [{"id": "kc1", "term": "LTP", "definition": "Long Term Potentiation"}],
        }

        # Put via API
        put_res = self.client.put(
            f"/lectures/{lec_id}/notes",
            json={
                "notes": notes_data,
                "marginNotes": "Student personal note on margin",
                "highlights": [{"id": "h1", "text": "LTP"}],
            },
        )
        self.assertEqual(put_res.status_code, 200)

        # Get via API
        get_res = self.client.get(f"/lectures/{lec_id}/notes")
        self.assertEqual(get_res.status_code, 200)
        retrieved = get_res.json()
        self.assertEqual(retrieved["notes"]["summary"], "Mechanics of Synaptic Plasticity")
        self.assertEqual(retrieved["marginNotes"], "Student personal note on margin")
        self.assertEqual(len(retrieved["highlights"]), 1)

        # Directly verify SQLite
        db_notes = get_lecture_notes(lec_id)
        self.assertIsNotNone(db_notes)
        self.assertEqual(db_notes["notes"]["summary"], "Mechanics of Synaptic Plasticity")

    def test_12_lecture_transcript_persistence(self):
        """Verify saving and fetching transcript segments via SQLite and REST API."""
        lec_id = f"test-trans-{uuid.uuid4().hex[:8]}"
        segments = [
            {"id": "s1", "startSeconds": 0, "endSeconds": 30, "speaker": "Prof. Smith", "text": "Welcome to class."},
            {"id": "s2", "startSeconds": 30, "endSeconds": 60, "speaker": "Prof. Smith", "text": "Today we cover axons."},
        ]

        # Put via API
        put_res = self.client.put(
            f"/lectures/{lec_id}/transcript",
            json={"segments": segments, "fullText": "Welcome to class. Today we cover axons."},
        )
        self.assertEqual(put_res.status_code, 200)

        # Get via API
        get_res = self.client.get(f"/lectures/{lec_id}/transcript")
        self.assertEqual(get_res.status_code, 200)
        data = get_res.json()
        self.assertEqual(len(data["segments"]), 2)
        self.assertEqual(data["segments"][0]["text"], "Welcome to class.")

        # Directly verify SQLite
        db_trans = get_lecture_transcripts(lec_id)
        self.assertIsNotNone(db_trans)
        self.assertEqual(len(db_trans["segments"]), 2)

    def test_13_lecture_progress_persistence(self):
        """Verify audio scrubber position persistence."""
        lec_id = f"test-prog-{uuid.uuid4().hex[:8]}"

        # Initially 0
        get_init = self.client.get(f"/lectures/{lec_id}/progress")
        self.assertEqual(get_init.status_code, 200)
        self.assertEqual(get_init.json()["progressSeconds"], 0.0)

        # Save progress at 345.5s
        put_res = self.client.put(
            f"/lectures/{lec_id}/progress",
            json={"progressSeconds": 345.5, "completed": False},
        )
        self.assertEqual(put_res.status_code, 200)

        # Retrieve and verify
        get_res = self.client.get(f"/lectures/{lec_id}/progress")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["progressSeconds"], 345.5)

    def test_14_pyq_paper_persistence(self):
        """Verify PYQ paper persistence in SQLite."""
        paper_id = f"pyq-test-{uuid.uuid4().hex[:8]}"
        paper = {
            "id": paper_id,
            "title": "2024 Operating Systems Midterm",
            "courseCode": "CS 106B",
            "year": 2024,
            "questions": [{"id": "q1", "problemStatement": "Explain paging"}],
        }

        save_pyq_paper(paper)
        papers = get_all_pyq_papers("CS 106B")
        matched = next((p for p in papers if p["id"] == paper_id), None)
        self.assertIsNotNone(matched)
        self.assertEqual(matched["title"], "2024 Operating Systems Midterm")

        # Delete
        deleted = delete_pyq_paper(paper_id)
        self.assertTrue(deleted)
        papers_after = get_all_pyq_papers("CS 106B")
        self.assertIsNone(next((p for p in papers_after if p["id"] == paper_id), None))


if __name__ == "__main__":
    unittest.main()
