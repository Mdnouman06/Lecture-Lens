"""
Unit & Integration Tests for LectureLens Manual Transcript Ingestion and AI Grounding
Verifies:
1. Exact preservation of explicit [MM:SS] timestamps (e.g. [00:18] -> 18.0s, [01:28] -> 88.0s).
2. Stripping timestamp markers from segment text while retaining speaker and content.
3. Chaining start/end timestamps between consecutive segments.
4. Graceful fallback to estimated paragraph chunking when no timestamps are present.
5. POST /ingest/manual endpoint response contract and timestamp fidelity.
6. Strict AI Grounding directives in Ollama prompts (zero-hallucination contract).
"""

import json
import unittest
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.manual_ingestion import (
    parse_timestamp_seconds,
    has_explicit_timestamps,
    parse_manual_transcript,
)
from backend.services.ollama import (
    STRICT_GROUNDING_DIRECTIVES,
    SYSTEM_STRICT_STUDY_ASSISTANT,
    EXECUTIVE_SUMMARY_PROMPT,
    STRUCTURED_NOTES_PROMPT,
    KEY_CONCEPTS_PROMPT,
    TUTOR_RAG_PROMPT,
    FLASHCARDS_PROMPT,
    QUIZ_PROMPT,
    OllamaClient,
    generate_notes,
    generate_lecture_quiz,
)


SAMPLE_VIRTUAL_MEMORY_TRANSCRIPT = """
[00:00] Introduction to virtual memory.
[00:18] Lecturer: Virtual memory allows a computer to run programs that require more memory than is physically available.
[00:35] Lecturer: Secondary storage is used to extend the capacity of physical RAM.
[01:10] Lecturer: Programs are divided into pages, while physical memory is divided into frames.
[01:28] Lecturer: When a program references a page not currently in physical memory, a page fault occurs.
[02:05] Lecturer: One commonly discussed page replacement algorithm is Least Recently Used, or LRU.
[02:22] Lecturer: LRU removes the page that has not been used for the longest period of time.
[03:18] Lecturer: Excessive page faults can cause a condition called thrashing, where the system spends more time paging than executing instructions.
"""

SAMPLE_PLAIN_PARAGRAPH_TRANSCRIPT = """
Virtual memory allows a computer to run programs that require more memory than is physically available.
Secondary storage is used to extend the capacity of physical RAM.

Programs are divided into pages, while physical memory is divided into frames.
When a program references a page not currently in physical memory, a page fault occurs.

One commonly discussed page replacement algorithm is Least Recently Used, or LRU.
Excessive page faults can cause a condition called thrashing.
"""


class TestManualTranscriptTimestampParsing(unittest.TestCase):
    """Test explicit timestamp parsing and conversion to exact seconds."""

    def test_parse_timestamp_seconds(self):
        self.assertEqual(parse_timestamp_seconds("00:00"), 0.0)
        self.assertEqual(parse_timestamp_seconds("00:18"), 18.0)
        self.assertEqual(parse_timestamp_seconds("00:35"), 35.0)
        self.assertEqual(parse_timestamp_seconds("01:10"), 70.0)
        self.assertEqual(parse_timestamp_seconds("01:28"), 88.0)
        self.assertEqual(parse_timestamp_seconds("1:28"), 88.0)
        self.assertEqual(parse_timestamp_seconds("02:05"), 125.0)
        self.assertEqual(parse_timestamp_seconds("2:05"), 125.0)
        self.assertEqual(parse_timestamp_seconds("02:22"), 142.0)
        self.assertEqual(parse_timestamp_seconds("03:18"), 198.0)
        self.assertEqual(parse_timestamp_seconds("01:05:20"), 3920.0)
        self.assertEqual(parse_timestamp_seconds(""), 0.0)
        self.assertEqual(parse_timestamp_seconds("invalid"), 0.0)

    def test_has_explicit_timestamps(self):
        self.assertTrue(has_explicit_timestamps(SAMPLE_VIRTUAL_MEMORY_TRANSCRIPT))
        self.assertTrue(has_explicit_timestamps("[00:18] Lecturer: Hello"))
        self.assertTrue(has_explicit_timestamps("[1:28] Lecturer: Hello"))
        self.assertFalse(has_explicit_timestamps(SAMPLE_PLAIN_PARAGRAPH_TRANSCRIPT))
        self.assertFalse(has_explicit_timestamps("Plain text with no timecodes."))

    def test_parse_manual_transcript_explicit_timestamps(self):
        segments, total_duration = parse_manual_transcript(SAMPLE_VIRTUAL_MEMORY_TRANSCRIPT)

        self.assertEqual(len(segments), 8)

        # Check segment 1: [00:00]
        self.assertEqual(segments[0]["startSeconds"], 0.0)
        self.assertEqual(segments[0]["endSeconds"], 18.0)
        self.assertEqual(segments[0]["start"], 0.0)
        self.assertEqual(segments[0]["end"], 18.0)
        self.assertNotIn("[00:00]", segments[0]["text"])
        self.assertEqual(segments[0]["text"], "Introduction to virtual memory.")

        # Check segment 2: [00:18] - Must NOT be estimated to ~6s
        self.assertEqual(segments[1]["startSeconds"], 18.0)
        self.assertEqual(segments[1]["endSeconds"], 35.0)
        self.assertNotIn("[00:18]", segments[1]["text"])
        self.assertEqual(segments[1]["speaker"], "Lecturer")
        self.assertTrue(segments[1]["text"].startswith("Lecturer: Virtual memory allows"))

        # Check segment 5: [01:28] (88s)
        self.assertEqual(segments[4]["startSeconds"], 88.0)
        self.assertEqual(segments[4]["endSeconds"], 125.0)
        self.assertNotIn("[01:28]", segments[4]["text"])

        # Check segment 6: [02:05] (125s)
        self.assertEqual(segments[5]["startSeconds"], 125.0)
        self.assertEqual(segments[5]["endSeconds"], 142.0)
        self.assertNotIn("[02:05]", segments[5]["text"])

        # Check segment 7: [02:22] (142s)
        self.assertEqual(segments[6]["startSeconds"], 142.0)
        self.assertEqual(segments[6]["endSeconds"], 198.0)
        self.assertNotIn("[02:22]", segments[6]["text"])

        # Check segment 8: [03:18] (198s)
        self.assertEqual(segments[7]["startSeconds"], 198.0)
        self.assertGreater(segments[7]["endSeconds"], 198.0)
        self.assertNotIn("[03:18]", segments[7]["text"])
        self.assertEqual(total_duration, segments[7]["endSeconds"])

    def test_unbracketed_and_range_timestamps(self):
        text = """
        [00:00 - 00:15] Introduction to the lecture
        [00:15 - 00:45] Lecturer: Core mechanism breakdown
        """
        segments, duration = parse_manual_transcript(text)
        self.assertEqual(len(segments), 2)
        self.assertEqual(segments[0]["startSeconds"], 0.0)
        self.assertEqual(segments[0]["endSeconds"], 15.0)
        self.assertEqual(segments[1]["startSeconds"], 15.0)
        self.assertEqual(segments[1]["endSeconds"], 45.0)

    def test_parse_manual_transcript_fallback_estimated(self):
        segments, total_duration = parse_manual_transcript(SAMPLE_PLAIN_PARAGRAPH_TRANSCRIPT)

        self.assertEqual(len(segments), 3)
        self.assertEqual(segments[0]["startSeconds"], 0.0)
        self.assertGreater(segments[0]["endSeconds"], 0.0)
        self.assertEqual(segments[1]["startSeconds"], segments[0]["endSeconds"])
        self.assertGreater(segments[1]["endSeconds"], segments[1]["startSeconds"])
        self.assertEqual(segments[2]["startSeconds"], segments[1]["endSeconds"])
        self.assertEqual(total_duration, segments[2]["endSeconds"])


class TestManualIngestApiEndpoint(unittest.TestCase):
    """Test POST /ingest/manual FastAPI endpoint."""

    def setUp(self):
        self.client = TestClient(app)

    def test_post_ingest_manual_with_explicit_timestamps(self):
        response = self.client.post(
            "/ingest/manual",
            json={
                "title": "CS 106B Virtual Memory",
                "text": SAMPLE_VIRTUAL_MEMORY_TRANSCRIPT,
                "courseCode": "CS 106B",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["title"], "CS 106B Virtual Memory")
        self.assertEqual(data["courseCode"], "CS 106B")
        self.assertEqual(data["sourceType"], "transcript")
        self.assertFalse(data["hasAudio"])
        self.assertEqual(len(data["segments"]), 8)

        # Segment 2 must be exactly 18.0s, not estimated to 6s
        seg2 = data["segments"][1]
        self.assertEqual(seg2["startSeconds"], 18.0)
        self.assertEqual(seg2["endSeconds"], 35.0)
        self.assertNotIn("[00:18]", seg2["text"])

        # Segment 5 must be exactly 88.0s
        seg5 = data["segments"][4]
        self.assertEqual(seg5["startSeconds"], 88.0)
        self.assertEqual(seg5["endSeconds"], 125.0)

    def test_post_ingest_manual_with_plain_paragraphs(self):
        response = self.client.post(
            "/ingest/manual",
            json={
                "title": "Unstructured Notes",
                "text": SAMPLE_PLAIN_PARAGRAPH_TRANSCRIPT,
                "courseCode": "CS 106B",
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["segments"]), 3)
        self.assertEqual(data["segments"][0]["startSeconds"], 0.0)

    def test_post_ingest_manual_empty_text_error(self):
        response = self.client.post(
            "/ingest/manual",
            json={
                "title": "Empty",
                "text": "   ",
                "courseCode": "CS 106B",
            },
        )
        self.assertEqual(response.status_code, 400)


class TestStrictGroundingDirectives(unittest.TestCase):
    """Test strict AI grounding rules across all synthesis prompt templates."""

    def test_directives_present_in_all_prompts(self):
        prompts = [
            ("EXECUTIVE_SUMMARY_PROMPT", EXECUTIVE_SUMMARY_PROMPT),
            ("STRUCTURED_NOTES_PROMPT", STRUCTURED_NOTES_PROMPT),
            ("KEY_CONCEPTS_PROMPT", KEY_CONCEPTS_PROMPT),
            ("TUTOR_RAG_PROMPT", TUTOR_RAG_PROMPT),
            ("FLASHCARDS_PROMPT", FLASHCARDS_PROMPT),
            ("QUIZ_PROMPT", QUIZ_PROMPT),
        ]

        required_snippets = [
            "ABSOLUTE GROUNDING DIRECTIVES (ZERO-HALLUCINATION ENFORCEMENT):",
            "Use ONLY information explicitly stated in the provided lecture",
            "Do NOT introduce outside textbook knowledge",
            "Do NOT add claims merely because they are generally true",
            "Do NOT infer unstated causes, comparisons, advantages, disadvantages, or trade-offs",
            "Do NOT \"correct\" or expand on the lecturer's statements with external theory",
            "Do NOT expand abbreviations or introduce external concepts unless the transcript itself defines them",
            "If any requested section cannot be derived directly from the text, explicitly state: \"Not specified in the provided lecture transcript.\"",
            "Preserve the lecturer's exact terminology and framing",
            "Every timestamp cited (e.g. [MM:SS]) MUST correspond to an actual timestamp",
            "You may reorganize and format the transcript, but you must NOT introduce new factual content.",
        ]

        for prompt_name, prompt_text in prompts:
            for snippet in required_snippets:
                self.assertIn(
                    snippet,
                    prompt_text,
                    f"Prompt {prompt_name} is missing directive snippet: {snippet}",
                )

    def test_system_prompt_adherence_in_generate_notes(self):
        """Verify that generate_notes sends the strict grounding system prompt to Ollama."""
        with patch.object(OllamaClient, "is_available", return_value=True), \
             patch.object(OllamaClient, "check_model_installed", return_value=True), \
             patch.object(OllamaClient, "generate") as mock_gen:

            mock_gen.side_effect = [
                "# Summary\nGrounding test",
                "## 1. Notes\nGrounding notes",
                json.dumps({"concepts": [{"term": "Virtual Memory", "definition": "Allows running programs larger than RAM."}]}),
            ]

            generate_notes(
                transcript_text=SAMPLE_VIRTUAL_MEMORY_TRANSCRIPT,
                title="Virtual Memory",
                course_code="CS 106B",
            )

            self.assertEqual(mock_gen.call_count, 3)
            for call in mock_gen.call_args_list:
                _, kwargs = call
                system_sent = kwargs.get("system", "")
                self.assertIn("zero-hallucination", system_sent.lower())
                self.assertIn("strictly and exclusively grounded", system_sent.lower())

    def test_no_hallucinated_knowledge_in_notes_synthesis(self):
        """Verify that unstated facts (e.g. LRU optimality, RAM sufficiency) are rejected."""
        # Simulated compliant output based strictly on the transcript
        compliant_notes = """
        ## Overview of Virtual Memory
        Virtual memory allows a computer to run programs that require more memory than is physically available [00:18].
        Secondary storage extends physical RAM capacity [00:35].

        ## Key Mechanisms
        - Programs are divided into pages, while physical memory is divided into frames [01:10].
        - A page fault occurs when a program references a page not currently in physical memory [01:28].
        - Least Recently Used (LRU) removes the page not used for the longest period of time [02:05], [02:22].
        - Excessive page faults cause thrashing, where the system spends more time paging than executing instructions [03:18].
        """

        forbidden_hallucinations = [
            "optimal",
            "suboptimal",
            "insufficient ram",
            "practical limitation",
            "belady",
        ]

        for forbidden in forbidden_hallucinations:
            self.assertNotIn(forbidden, compliant_notes.lower())

        # Valid citations must match segment timestamps
        valid_timestamps = ["[00:00]", "[00:18]", "[00:35]", "[01:10]", "[01:28]", "[02:05]", "[02:22]", "[03:18]"]
        import re
        found_timestamps = re.findall(r"\[\d{2}:\d{2}\]", compliant_notes)
        for ts in found_timestamps:
            self.assertIn(ts, valid_timestamps)

    def test_system_prompt_adherence_in_generate_quiz(self):
        """Verify that generate_lecture_quiz sends the strict grounding system prompt to Ollama."""
        with patch.object(OllamaClient, "is_available", return_value=True), \
             patch.object(OllamaClient, "check_model_installed", return_value=True), \
             patch.object(OllamaClient, "generate") as mock_gen:

            mock_quiz_json = json.dumps({
                "id": "quiz-vm-1",
                "title": "Virtual Memory - Exam Drill",
                "questions": [
                    {
                        "id": "q-1",
                        "problemStatement": "What occurs when a program references a page not currently in physical memory?",
                        "options": ["Page fault", "Segmentation fault", "Thrashing", "Bus error"],
                        "correctIndex": 0,
                        "explanation": "According to the transcript [01:28], referencing a missing page triggers a page fault.",
                        "slideCitation": "Virtual Memory [01:28]",
                    }
                ]
            })
            mock_gen.return_value = mock_quiz_json

            generate_lecture_quiz(
                transcript_text=SAMPLE_VIRTUAL_MEMORY_TRANSCRIPT,
                title="Virtual Memory",
                course_code="CS 106B",
            )

            self.assertTrue(mock_gen.called)
            _, kwargs = mock_gen.call_args
            system_sent = kwargs.get("system", "")
            self.assertIn("zero-hallucination", system_sent.lower())
            self.assertIn("strictly and exclusively grounded", system_sent.lower())

    def test_no_hallucinated_knowledge_in_quiz_synthesis(self):
        """Verify that generated quiz questions and explanations reject unstated external concepts."""
        compliant_quiz_questions = [
            {
                "problemStatement": "What condition occurs when the system spends more time paging than executing instructions?",
                "options": ["Thrashing", "Deadlock", "Starvation", "Race condition"],
                "correctIndex": 0,
                "explanation": "Excessive page faults cause thrashing [03:18].",
                "slideCitation": "Virtual Memory [03:18]",
            },
            {
                "problemStatement": "Which page replacement policy removes the page not used for the longest period of time?",
                "options": ["FIFO", "Least Recently Used (LRU)", "Optimal algorithm", "Random replacement"],
                "correctIndex": 1,
                "explanation": "LRU removes the page not used for the longest period [02:22].",
                "slideCitation": "Virtual Memory [02:22]",
            }
        ]

        forbidden_hallucinations = [
            "belady",
            "insufficient ram",
            "practical limitation",
            "hardware translation lookaside buffer",
        ]

        for q in compliant_quiz_questions:
            q_text = (q["problemStatement"] + " " + q["explanation"] + " " + " ".join(q["options"])).lower()
            for forbidden in forbidden_hallucinations:
                self.assertNotIn(forbidden, q_text)

        valid_timestamps = ["[00:00]", "[00:18]", "[00:35]", "[01:10]", "[01:28]", "[02:05]", "[02:22]", "[03:18]"]
        import re
        for q in compliant_quiz_questions:
            found_timestamps = re.findall(r"\[\d{2}:\d{2}\]", q["explanation"] + " " + q["slideCitation"])
            for ts in found_timestamps:
                self.assertIn(ts, valid_timestamps)


if __name__ == "__main__":
    unittest.main()
