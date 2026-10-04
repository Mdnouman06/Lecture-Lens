"""
Full Integration Test Matrix for LectureLens FastAPI Endpoints
Tests all 18 implemented routes across ingest, synthesis, tutor, recall, pyq, and planner.
"""

import io
import sys
import unittest
from unittest.mock import patch, MagicMock

try:
    try:
        from backend.main import app
    except ImportError:
        from main import app
    from fastapi.testclient import TestClient
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    TestClient = None


class TestEndpointIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not HAS_FASTAPI:
            raise unittest.SkipTest("FastAPI not installed in test environment")
        cls.client = TestClient(app)

    def _clear_pyq_sqlite(self):
        try:
            try:
                from backend.services.storage import _get_connection
            except ImportError:
                from services.storage import _get_connection
            with _get_connection() as conn:
                conn.execute("DELETE FROM pyq_papers")
                conn.commit()
        except Exception:
            pass

    def setUp(self):
        self._clear_pyq_sqlite()

    def tearDown(self):
        self._clear_pyq_sqlite()

    # --------------------------------------------------------------------------
    # 1. Health Beacon
    # --------------------------------------------------------------------------
    def test_health_beacon(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("model", data)
        self.assertIn("whisperEngine", data)
        self.assertIn("version", data)

    # --------------------------------------------------------------------------
    # 2. Ingestion: PDF
    # --------------------------------------------------------------------------
    def test_ingest_pdf_valid(self):
        try:
            import pypdf
            writer = pypdf.PdfWriter()
            writer.add_blank_page(width=100, height=100)
            writer.add_blank_page(width=100, height=100)
            pdf_bytes = io.BytesIO()
            writer.write(pdf_bytes)
            pdf_bytes.seek(0)

            files = {"file": ("biology_slides.pdf", pdf_bytes, "application/pdf")}
            resp = self.client.post("/ingest/pdf", files=files, data={"course_code": "BIO 101"})
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["pageCount"], 2)
            self.assertEqual(data["courseCode"], "BIO 101")
            self.assertEqual(data["sourceType"], "pdf")
            self.assertIn("notesMarkdown", data)
        except ImportError:
            self.skipTest("pypdf not installed")

    def test_ingest_pdf_empty_file_fails(self):
        empty_bytes = io.BytesIO(b"")
        files = {"file": ("empty.pdf", empty_bytes, "application/pdf")}
        resp = self.client.post("/ingest/pdf", files=files)
        # Should return 400 or 500 error for corrupted/empty PDF
        self.assertIn(resp.status_code, [400, 500])

    def test_ingest_pdf_invalid_extension_fails(self):
        files = {"file": ("malicious.exe", io.BytesIO(b"malware"), "application/octet-stream")}
        resp = self.client.post("/ingest/pdf", files=files)
        self.assertEqual(resp.status_code, 400)

    # --------------------------------------------------------------------------
    # 3. Ingestion: Audio
    # --------------------------------------------------------------------------
    def test_ingest_audio_invalid_extension(self):
        files = {"file": ("notes.txt", io.BytesIO(b"not an audio"), "text/plain")}
        resp = self.client.post("/ingest/audio", files=files)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Unsupported audio format", resp.json()["detail"])

    @patch("backend.main.transcribe_audio")
    def test_ingest_audio_success(self, mock_transcribe):
        mock_transcribe.return_value = {
            "durationSeconds": 120.5,
            "wordCount": 180,
            "segments": [
                {"id": "seg-1", "startSeconds": 0.0, "endSeconds": 60.0, "speaker": "Speaker 1", "text": "First part."},
                {"id": "seg-2", "startSeconds": 60.0, "endSeconds": 120.5, "speaker": "Speaker 1", "text": "Second part."},
            ],
            "fullText": "First part. Second part.",
        }
        fake_audio = io.BytesIO(b"dummy audio content bytes")
        files = {"file": ("lecture.mp3", fake_audio, "audio/mpeg")}
        resp = self.client.post("/ingest/audio", files=files, data={"course_code": "CS 106B"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["courseCode"], "CS 106B")
        self.assertEqual(data["sourceType"], "audio")
        self.assertEqual(len(data["segments"]), 2)
        self.assertEqual(data["durationSeconds"], 120.5)

    # --------------------------------------------------------------------------
    # 4. Ingestion: YouTube
    # --------------------------------------------------------------------------
    def test_ingest_youtube_invalid_url(self):
        resp = self.client.post("/ingest/youtube", json={"url": "not-a-youtube-url"})
        self.assertEqual(resp.status_code, 400)

    @patch("backend.main.fetch_youtube_captions")
    def test_ingest_youtube_success(self, mock_fetch):
        mock_fetch.return_value = {
            "success": True,
            "durationSeconds": 300.0,
            "wordCount": 450,
            "segments": [
                {"id": "yt-1", "startSeconds": 0.0, "endSeconds": 30.0, "text": "Welcome to CS50."}
            ],
            "fullText": "Welcome to CS50.",
        }
        resp = self.client.post("/ingest/youtube", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["sourceType"], "youtube")
        self.assertEqual(data["videoId"], "dQw4w9WgXcQ")
        self.assertFalse(data.get("fallbackRequired", False))

    @patch("backend.main.fetch_youtube_captions")
    def test_ingest_youtube_fallback_signal(self, mock_fetch):
        mock_fetch.return_value = {
            "success": False,
            "error": "TranscriptsDisabled",
        }
        resp = self.client.post("/ingest/youtube", json={"url": "https://youtu.be/00000000000"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("fallbackRequired"))
        self.assertIn("message", data)

    # --------------------------------------------------------------------------
    # 5. Ingestion: Manual
    # --------------------------------------------------------------------------
    def test_ingest_manual_empty_fails(self):
        resp = self.client.post("/ingest/manual", json={"title": "Test", "text": "   "})
        self.assertEqual(resp.status_code, 400)

    def test_ingest_manual_paragraphs(self):
        text = "Paragraph one on calculus limits.\n\nParagraph two on derivatives and differentials."
        resp = self.client.post("/ingest/manual", json={"title": "Math Notes", "text": text, "courseCode": "MATH 51"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["title"], "Math Notes")
        self.assertEqual(data["courseCode"], "MATH 51")
        self.assertEqual(len(data["segments"]), 2)
        self.assertEqual(data["sourceType"], "transcript")

    # --------------------------------------------------------------------------
    # 6. Notes Synthesis & Persistence
    # --------------------------------------------------------------------------
    def test_synthesize_notes_empty_fails(self):
        resp = self.client.post("/synthesize/notes", json={"transcript": "", "title": "Test"})
        self.assertEqual(resp.status_code, 400)

    @patch("backend.main.generate_notes")
    def test_synthesize_notes_success(self, mock_gen):
        mock_gen.return_value = {
            "executiveSummary": "Concise summary.",
            "keyConcepts": [{"term": "Plasticity", "definition": "Synaptic adaptation", "examRelevance": "High"}],
            "structuredNotes": "## 1. Intro\nDetails...",
            "markdown": "# Study Notes\nContent",
            "formulaDerivations": ["ΔV = IR"],
        }
        resp = self.client.post(
            "/synthesize/notes",
            json={"transcript": "Valid academic lecture text on neuroscience.", "title": "Neuro lecture", "courseCode": "NEURO 301"}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["title"], "Neuro lecture")
        self.assertIn("executiveSummary", data)
        self.assertIn("keyConcepts", data)
        self.assertIn("formulaDerivations", data)

    def test_save_lecture_notes_put(self):
        resp = self.client.put(
            "/lectures/lec-test-1/notes",
            json={
                "notes": {"markdown": "# Edited Notes"},
                "marginNotes": "Student personal reminder",
                "highlights": [{"text": "key insight", "color": "#ff0"}],
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "saved")
        self.assertEqual(data["lectureId"], "lec-test-1")

    # --------------------------------------------------------------------------
    # 7. AI Tutor & Semantic Search
    # --------------------------------------------------------------------------
    def test_tutor_ask_empty_question_fails(self):
        resp = self.client.post("/tutor/ask", json={"question": "   "})
        self.assertEqual(resp.status_code, 400)

    @patch("backend.main.answer_tutor_question")
    def test_tutor_ask_grounded_response(self, mock_answer):
        mock_answer.return_value = {
            "text": "The NMDA receptor requires both glutamate binding and membrane depolarization.",
            "topicBadge": "NMDA Receptor Kinetics",
            "isGrounded": True,
            "sequenceSteps": [
                {"stepNumber": 1, "title": "Glutamate Release", "description": "Presynaptic release.", "iconType": "presynaptic"}
            ],
            "citations": [
                {"timecodeDisplay": "02:15 - 02:45", "quote": "magnesium block unbinds", "relevanceScore": 0.95}
            ],
            "examAlert": {"title": "Exam Focus", "description": "Crucial Midterm topic"},
            "followUps": ["What ion passes through the channel?"],
        }
        resp = self.client.post(
            "/tutor/ask",
            json={"question": "How does the NMDA receptor activate?", "courseCode": "NEURO 301"}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["isGrounded"])
        self.assertEqual(len(data["citations"]), 1)
        self.assertEqual(data["citations"][0]["timecodeDisplay"], "02:15 - 02:45")

    def test_semantic_search_empty_query_fails(self):
        resp = self.client.post("/search/semantic", json={"query": ""})
        self.assertEqual(resp.status_code, 400)

    @patch("backend.main.semantic_search_corpus")
    def test_semantic_search_success(self, mock_search):
        mock_search.return_value = [
            {"id": "res-1", "title": "Lecture 1", "snippet": "Action potential dynamics"}
        ]
        resp = self.client.post("/search/semantic", json={"query": "action potential"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["query"], "action potential")
        self.assertEqual(len(data["results"]), 1)

    # --------------------------------------------------------------------------
    # 8. Active Recall: Flashcards & Quizzes
    # --------------------------------------------------------------------------
    def test_generate_flashcards_empty_fails(self):
        resp = self.client.post("/generate/flashcards", json={"text": ""})
        self.assertEqual(resp.status_code, 400)

    @patch("backend.main.generate_lecture_flashcards")
    def test_generate_flashcards_success(self, mock_gen):
        mock_gen.return_value = [
            {
                "id": "fc-1",
                "lectureId": "lec-1",
                "source": "Lecture 1 • NMDA",
                "subtopic": "NMDA",
                "question": "What relieves the magnesium block?",
                "answerLead": "Membrane depolarization.",
                "answerBody": "Electrostatic repulsion unblocks the pore.",
                "difficulty": "good",
                "mastered": False,
            }
        ]
        resp = self.client.post(
            "/generate/flashcards",
            json={"text": "Lecture text regarding NMDA receptor channel properties.", "title": "NMDA lecture"}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("cards", data)
        self.assertEqual(len(data["cards"]), 1)
        self.assertEqual(data["cards"][0]["question"], "What relieves the magnesium block?")

    def test_generate_quiz_empty_fails(self):
        resp = self.client.post("/generate/quiz", json={"text": ""})
        self.assertEqual(resp.status_code, 400)

    @patch("backend.main.generate_lecture_quiz")
    def test_generate_quiz_success(self, mock_quiz):
        mock_quiz.return_value = {
            "id": "quiz-1",
            "title": "NMDA Quiz",
            "courseCode": "NEURO 301",
            "timeLimitMinutes": 25,
            "questions": [
                {
                    "id": "q-1",
                    "problemStatement": "Which ion primarily blocks the NMDA channel at resting potential?",
                    "topicTag": "Biophysics",
                    "difficulty": "Exam Level",
                    "options": ["A) Ca2+", "B) Mg2+", "C) Na+", "D) K+"],
                    "correctIndex": 1,
                    "explanation": "Magnesium blocks the pore at negative membrane potentials.",
                    "citationTime": "04:12",
                }
            ],
        }
        resp = self.client.post(
            "/generate/quiz",
            json={"text": "Detailed lecture text on NMDA receptor kinetics.", "courseCode": "NEURO 301"}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], "quiz-1")
        self.assertEqual(len(data["questions"]), 1)
        self.assertEqual(len(data["questions"][0]["options"]), 4)
        self.assertEqual(data["questions"][0]["correctIndex"], 1)

    def test_quiz_submit_scoring(self):
        resp = self.client.post(
            "/quiz/submit",
            json={
                "quizId": "quiz-test-1",
                "answers": {"0": 1, "1": 1, "2": 2, "3": 0, "4": 1},
                "timeSpentSeconds": 180,
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["quizId"], "quiz-test-1")
        self.assertEqual(data["score"], 5)
        self.assertEqual(data["percentage"], 100)
        self.assertIn("completedAt", data)

    def test_quiz_submit_scoring_regression_lost_lecture(self):
        """
        Regression test: Verify scoring when student answers B, B, B, C, B
        on a quiz where correct answers are B, B, B, B, B.
        Answers: [1, 1, 1, 2, 1]
        Correct: [1, 1, 1, 1, 1]
        Expected: 4 correct of 5 (80%).
        """
        resp = self.client.post(
            "/quiz/submit",
            json={
                "quizId": "quiz-lost-3min",
                "answers": {"0": 1, "1": 1, "2": 1, "3": 2, "4": 1},
                "correctAnswers": {"0": 1, "1": 1, "2": 1, "3": 1, "4": 1},
                "timeSpentSeconds": 180,
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["quizId"], "quiz-lost-3min")
        self.assertEqual(data["score"], 4)
        self.assertEqual(data["totalQuestions"], 5)
        self.assertEqual(data["percentage"], 80)
        self.assertTrue(data["answers"]["0"]["isCorrect"])
        self.assertTrue(data["answers"]["1"]["isCorrect"])
        self.assertTrue(data["answers"]["2"]["isCorrect"])
        self.assertFalse(data["answers"]["3"]["isCorrect"])
        self.assertTrue(data["answers"]["4"]["isCorrect"])

    # --------------------------------------------------------------------------
    # 9. PYQ Intelligence Endpoints
    # --------------------------------------------------------------------------
    def test_pyq_papers_get(self):
        # Default workflow: returns empty list when no papers uploaded
        resp = self.client.get("/pyq/papers?courseCode=ALL")
        self.assertEqual(resp.status_code, 200)
        papers = resp.json()
        self.assertIsInstance(papers, list)
        self.assertEqual(len(papers), 0)

        # Explicit demo mode: returns mock archive
        demo_resp = self.client.get("/pyq/papers?courseCode=ALL&demo=true")
        self.assertEqual(demo_resp.status_code, 200)
        demo_papers = demo_resp.json()
        self.assertTrue(len(demo_papers) > 0)
        self.assertIn("title", demo_papers[0])
        self.assertIn("questions", demo_papers[0])

    def test_pyq_topics_get(self):
        # Default workflow: returns empty list when no papers uploaded
        resp = self.client.get("/pyq/topics?courseCode=ALL")
        self.assertEqual(resp.status_code, 200)
        topics = resp.json()
        self.assertIsInstance(topics, list)
        self.assertEqual(len(topics), 0)

        # Explicit demo mode: returns topic weights
        demo_resp = self.client.get("/pyq/topics?courseCode=ALL&demo=true")
        self.assertEqual(demo_resp.status_code, 200)
        demo_topics = demo_resp.json()
        self.assertTrue(len(demo_topics) > 0)
        self.assertIn("name", demo_topics[0])
        self.assertIn("weightPercent", demo_topics[0])

    def test_pyq_weights_get(self):
        # Default workflow: returns empty list when no papers uploaded
        resp = self.client.get("/pyq/weights?courseCode=ALL")
        self.assertEqual(resp.status_code, 200)
        weights = resp.json()
        self.assertIsInstance(weights, list)
        self.assertEqual(len(weights), 0)

        # Explicit demo mode
        demo_resp = self.client.get("/pyq/weights?courseCode=ALL&demo=true")
        self.assertEqual(demo_resp.status_code, 200)
        demo_weights = demo_resp.json()
        self.assertTrue(len(demo_weights) > 0)

    def test_pyq_match_post(self):
        resp = self.client.post(
            "/pyq/match",
            json={
                "questionText": "Explain the role of NMDA receptors in LTP.",
                "lectures": [
                    {
                        "id": "lec-1",
                        "title": "Synaptic Plasticity",
                        "summary": "NMDA receptors play a crucial role in LTP induction.",
                    }
                ],
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("lectureId", data)
        self.assertIn("timecodeDisplay", data)

    # --------------------------------------------------------------------------
    # 10. Study Planner & Schedule Endpoints
    # --------------------------------------------------------------------------
    def test_planner_schedule_get(self):
        resp = self.client.get("/planner/schedule")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("weekLabel", data)
        self.assertIn("examAlert", data)
        self.assertIn("dailyTarget", data)
        self.assertIn("blocks", data)
        self.assertIsInstance(data["blocks"], list)

    def test_planner_schedule_post(self):
        resp = self.client.post(
            "/planner/schedule",
            json={
                "blocks": [],
                "examDeadlines": [{"id": "ex-1", "courseCode": "NEURO 301", "prepHoursNeeded": 14.0}],
                "dueFlashcards": 28,
                "weekLabel": "Nov 03 – Nov 09",
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["weekLabel"], "Nov 03 – Nov 09")
        self.assertEqual(data["examAlert"]["coverageDeficit"], -14.0)

    def test_planner_autofill_post(self):
        resp = self.client.post(
            "/planner/autofill",
            json={
                "blocks": [],
                "targetHours": 14.0,
                "courseCode": "NEURO 301",
                "dueFlashcards": 28,
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["examAlert"]["coverageDeficit"], 0.0)
        self.assertTrue(data["examAlert"]["prepHoursScheduled"] >= 14.0)
        self.assertTrue(len(data["blocks"]) > 0)


if __name__ == "__main__":
    unittest.main()
