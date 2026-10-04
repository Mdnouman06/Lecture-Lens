"""
Unit and Contract Tests for LectureLens FastAPI Endpoints
"""

import sys
import unittest

# Check basic syntax and imports
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


class TestFastApiContracts(unittest.TestCase):
    def test_app_configured(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        self.assertEqual(app.title, "LectureLens AI Engine")

    def test_routes_exist(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        routes = [route.path for route in app.routes]
        self.assertIn("/health", routes)
        self.assertIn("/ingest/pdf", routes)
        self.assertIn("/ingest/audio", routes)
        self.assertIn("/ingest/youtube", routes)
        self.assertIn("/synthesize/notes", routes)
        self.assertIn("/tutor/ask", routes)
        self.assertIn("/generate/flashcards", routes)
        self.assertIn("/generate/quiz", routes)

    def test_ollama_client_defaults(self):
        try:
            try:
                from backend.services.ollama import OllamaClient, DEFAULT_MODEL
            except ImportError:
                from services.ollama import OllamaClient, DEFAULT_MODEL
            client = OllamaClient()
            self.assertIn(client.model, ["qwen3:0.6b", "qwen3:4b"])
            self.assertIn(DEFAULT_MODEL, ["qwen3:0.6b", "qwen3:4b"])
            import inspect
            sig = inspect.signature(client.generate)
            self.assertEqual(sig.parameters["timeout"].default, 300.0)
        except ImportError:
            self.skipTest("Ollama service dependencies not installed in test environment")

    def test_synthesize_notes_empty_transcript_validation(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        try:
            try:
                from backend.main import synthesize_notes_endpoint, NoteSynthesisRequest
            except ImportError:
                from main import synthesize_notes_endpoint, NoteSynthesisRequest
            import asyncio
            from fastapi import HTTPException

            req = NoteSynthesisRequest(transcript="", title="Empty Lecture")
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(synthesize_notes_endpoint(req))
            self.assertEqual(ctx.exception.status_code, 400)
            self.assertIn("required", ctx.exception.detail.lower())
        except ImportError:
            self.skipTest("FastAPI or dependencies not installed")

    def test_tutor_ask_empty_question(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        try:
            try:
                from backend.main import tutor_ask_endpoint, TutorQuestionRequest
            except ImportError:
                from main import tutor_ask_endpoint, TutorQuestionRequest
            import asyncio
            from fastapi import HTTPException

            req = TutorQuestionRequest(question="   ", lectureId="lec-1")
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(tutor_ask_endpoint(req))
            self.assertEqual(ctx.exception.status_code, 400)
            self.assertIn("empty", ctx.exception.detail.lower())
        except ImportError:
            self.skipTest("FastAPI or dependencies not installed")

    def test_tutor_context_formatting(self):
        try:
            try:
                from backend.services.ollama import format_timecode
            except ImportError:
                from services.ollama import format_timecode
            self.assertEqual(format_timecode(0.0), "00:00")
            self.assertEqual(format_timecode(65.4), "01:05")
            self.assertEqual(format_timecode(252.0), "04:12")
            self.assertEqual(format_timecode(3665.0), "61:05")
        except ImportError:
            self.skipTest("Ollama service dependencies not installed")

    def test_ollama_offline_error_handling(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        try:
            try:
                from backend.services.ollama import OllamaClient, OllamaOfflineError
            except ImportError:
                from services.ollama import OllamaClient, OllamaOfflineError
            # Point to non-existent local port to guarantee offline detection
            client = OllamaClient(base_url="http://127.0.0.1:59999")
            self.assertFalse(client.is_available())
        except ImportError:
            self.skipTest("Ollama service dependencies not installed")

    def test_generate_flashcards_empty_validation(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        try:
            try:
                from backend.main import generate_flashcards_endpoint, GenerateFlashcardsRequest
            except ImportError:
                from main import generate_flashcards_endpoint, GenerateFlashcardsRequest
            import asyncio
            from fastapi import HTTPException

            req = GenerateFlashcardsRequest(text="   ", title="Empty Test")
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(generate_flashcards_endpoint(req))
            self.assertEqual(ctx.exception.status_code, 400)
            self.assertIn("required", ctx.exception.detail.lower())
        except ImportError:
            self.skipTest("FastAPI or dependencies not installed")

    def test_generate_quiz_empty_validation(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        try:
            try:
                from backend.main import generate_quiz_endpoint, GenerateQuizRequest
            except ImportError:
                from main import generate_quiz_endpoint, GenerateQuizRequest
            import asyncio
            from fastapi import HTTPException

            req = GenerateQuizRequest(text="   ", title="Empty Test")
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(generate_quiz_endpoint(req))
            self.assertEqual(ctx.exception.status_code, 400)
            self.assertIn("required", ctx.exception.detail.lower())
        except ImportError:
            self.skipTest("FastAPI or dependencies not installed")

    def test_pyq_routes_exist(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        routes = [route.path for route in app.routes]
        self.assertIn("/pyq/upload", routes)
        self.assertIn("/pyq/topics", routes)
        self.assertIn("/pyq/match", routes)

    def test_pyq_topic_weighting_calculation(self):
        try:
            try:
                from backend.services.pyq import generate_topic_weighting_matrix
            except ImportError:
                from services.pyq import generate_topic_weighting_matrix

            sample_questions = [
                {"topicTag": "Biophysics • Action Potential", "marks": 10},
                {"topicTag": "Biophysics • Action Potential", "marks": 10},
                {"topicTag": "Neurotransmission • Vesicles", "marks": 5},
                {"topicTag": "Glial Transport", "marks": 5},
            ]
            weights = generate_topic_weighting_matrix(sample_questions, course_code="NEURO 301")
            self.assertTrue(len(weights) >= 3)
            self.assertEqual(weights[0]["category"], "critical")
            self.assertTrue(any(w["name"] == "Biophysics" for w in weights))
        except ImportError:
            self.skipTest("PYQ service dependencies not installed")

    def test_pyq_match_logic(self):
        try:
            try:
                from backend.services.pyq import correlate_question_to_lectures
            except ImportError:
                from services.pyq import correlate_question_to_lectures

            lectures = [
                {
                    "id": "lec-1",
                    "title": "Action Potential and Membrane Channels",
                    "summary": "Voltage-gated sodium and potassium channels driving depolarisation.",
                    "keyConcepts": [{"term": "Depolarization"}, {"term": "Refractory Period"}]
                },
                {
                    "id": "lec-2",
                    "title": "Synaptic Plasticity and LTP",
                    "summary": "NMDA receptor magnesium expulsion and calcium influx.",
                    "keyConcepts": [{"term": "NMDA Receptor"}, {"term": "LTP"}]
                }
            ]

            match = correlate_question_to_lectures("Explain voltage-gated sodium channel depolarization.", lectures)
            self.assertEqual(match["lectureId"], "lec-1")
            self.assertIn("Action Potential", match["title"])
        except ImportError:
            self.skipTest("PYQ service dependencies not installed")

    def test_planner_routes_exist(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        routes = [route.path for route in app.routes]
        self.assertIn("/planner/schedule", routes)
        self.assertIn("/planner/autofill", routes)

    def test_planner_schedule_deficit_calculation(self):
        try:
            try:
                from backend.services.planner import generate_study_schedule, find_open_time_slots
            except ImportError:
                from services.planner import generate_study_schedule, find_open_time_slots

            # Baseline schedule with no data is clean/empty
            baseline = generate_study_schedule()
            self.assertEqual(len(baseline["blocks"]), 0)
            self.assertIsNone(baseline["examAlert"]["title"])
            self.assertEqual(baseline["examAlert"]["coverageDeficit"], 0.0)

            # Test with custom blocks that eliminate deficit against a real exam deadline
            test_deadline = [{"id": "ex-1", "courseCode": "CS 101", "prepHoursNeeded": 14.0, "examDate": "2026-10-15"}]
            custom_blocks = [
                {"id": "b1", "dayIndex": 0, "startHour": 10.0, "durationHours": 7.0, "category": "deep"},
                {"id": "b2", "dayIndex": 1, "startHour": 10.0, "durationHours": 7.0, "category": "fsrs"},
            ]
            custom_schedule = generate_study_schedule(blocks=custom_blocks, deadlines=test_deadline)
            self.assertEqual(custom_schedule["examAlert"]["prepHoursScheduled"], 14.0)
            self.assertEqual(custom_schedule["examAlert"]["coverageDeficit"], 0.0)

            # Test open time slots
            day_blocks = [
                {"dayIndex": 1, "startHour": 9.0, "durationHours": 2.0},
                {"dayIndex": 1, "startHour": 13.0, "durationHours": 1.5},
            ]
            open_slots = find_open_time_slots(day_blocks, day_index=1, start_window=8.0, end_window=18.0)
            # Slot 1: 8.0 - 9.0 (1.0h), Slot 2: 11.0 - 13.0 (2.0h), Slot 3: 14.5 - 18.0 (3.5h)
            self.assertEqual(len(open_slots), 3)
            self.assertEqual(open_slots[0], (8.0, 1.0))
            self.assertEqual(open_slots[1], (11.0, 2.0))
        except ImportError:
            self.skipTest("Planner service dependencies not installed")

    def test_planner_autofill_algorithm(self):
        try:
            try:
                from backend.services.planner import autofill_schedule_deficit
            except ImportError:
                from services.planner import autofill_schedule_deficit

            filled = autofill_schedule_deficit(target_hours=14.0)
            self.assertEqual(filled["examAlert"]["coverageDeficit"], 0.0)
            self.assertTrue(filled["examAlert"]["prepHoursScheduled"] >= 14.0)
            self.assertIn("percentComplete", filled["dailyTarget"])

            autofilled_blocks = [b for b in filled["blocks"] if b.get("isAutofilled")]
            self.assertTrue(len(autofilled_blocks) >= 3)
            self.assertTrue(any(b["category"] == "deep" for b in autofilled_blocks))
            self.assertTrue(any(b["category"] == "fsrs" for b in autofilled_blocks))
            self.assertTrue(any(b["category"] == "tutor" for b in autofilled_blocks))
        except ImportError:
            self.skipTest("Planner service dependencies not installed")

    def test_ingest_pdf_endpoint(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        try:
            import io
            import pypdf
            writer = pypdf.PdfWriter()
            writer.add_blank_page(width=200, height=200)
            writer.add_blank_page(width=200, height=200)
            pdf_bytes = io.BytesIO()
            writer.write(pdf_bytes)
            pdf_bytes.seek(0)

            client = TestClient(app)
            files = {"file": ("test_lecture.pdf", pdf_bytes, "application/pdf")}
            response = client.post("/ingest/pdf", files=files, data={"course_code": "PHYS 402"})
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["pageCount"], 2)
            self.assertEqual(data["sourceType"], "pdf")
            self.assertEqual(data["courseCode"], "PHYS 402")
            self.assertIn("notesMarkdown", data)
            self.assertIn("Slide Deck", data["notesMarkdown"])
        except ImportError:
            self.skipTest("pypdf or TestClient not available")

    def test_ingest_youtube_url_parsing(self):
        try:
            try:
                from backend.services.youtube import extract_video_id
            except ImportError:
                from services.youtube import extract_video_id

            self.assertEqual(extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ")
            self.assertEqual(extract_video_id("https://youtu.be/dQw4w9WgXcQ?si=abc1234"), "dQw4w9WgXcQ")
            self.assertEqual(extract_video_id("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ")
            self.assertEqual(extract_video_id("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ")
            self.assertEqual(extract_video_id("dQw4w9WgXcQ"), "dQw4w9WgXcQ")
            self.assertIsNone(extract_video_id("https://example.com/not-youtube"))
        except ImportError:
            self.skipTest("YouTube service not available")

    def test_ingest_youtube_invalid_url(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        client = TestClient(app)
        response = client.post("/ingest/youtube", json={"url": "https://example.com/not-a-youtube-url"})
        self.assertEqual(response.status_code, 400)

    def test_ingest_youtube_fallback_signaling(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        client = TestClient(app)
        # Using a dummy 11-char ID that has no captions triggers fallback
        response = client.post("/ingest/youtube", json={"url": "https://youtu.be/00000000000"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("fallbackRequired"))
        self.assertIn("message", data)

    def test_ingest_manual_paragraph_chunking(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        client = TestClient(app)
        sample_text = (
            "First introductory paragraph on classical macroeconomic models and Keynesian demand.\n\n"
            "Second paragraph detailing monetary policy levers, central bank interest rates, and open market operations.\n\n"
            "Third conclusion paragraph on stagflation and modern supply-side economic interventions."
        )
        response = client.post(
            "/ingest/manual",
            json={
                "title": "Macroeconomic Policy Notes",
                "text": sample_text,
                "courseCode": "ECON 201",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["title"], "Macroeconomic Policy Notes")
        self.assertEqual(data["courseCode"], "ECON 201")
        self.assertEqual(data["sourceType"], "transcript")
        self.assertEqual(len(data["segments"]), 3)
        self.assertTrue(data["durationSeconds"] > 0)

    def test_ingest_audio_extension_validation(self):
        if not HAS_FASTAPI:
            self.skipTest("FastAPI not installed in active environment")
        client = TestClient(app)
        # Attempt uploading unsupported file extension
        import io
        fake_file = io.BytesIO(b"dummy binary content")
        files = {"file": ("unsupported_file.txt", fake_file, "text/plain")}
        response = client.post("/ingest/audio", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported audio format", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()


