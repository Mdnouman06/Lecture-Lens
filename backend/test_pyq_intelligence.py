"""
Regression Test Suite for PYQ Intelligence & Grouped Question Patterns
Validates all 12 explicit criteria from the specification:
  1. Exact duplicate questions -> ONE grouped pattern.
  2. Slightly different wording with the same meaning -> ONE grouped pattern.
  3. Same broad topic but different question intent -> separate patterns.
  4. Same pattern appearing 20 times -> occurrenceCount = 20 and ONE grouped pattern.
  5. Original raw questions remain individually accessible.
  6. Every grouped occurrence retains year + question number.
  7. Recurrence counts use only actual uploaded papers.
  8. No fabricated years.
  9. No fabricated questions.
  10. Topic Weighting Matrix uses normalized topic labels rather than raw/truncated question text.
  11. Existing six OS hotspot topics remain correct.
  12. Empty state remains free of demo/neuroscience content.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.pyq import (
    UPLOADED_PAPERS,
    extract_pyq_pdf,
    parse_pyq_questions_regex,
    generate_topic_weighting_matrix,
    get_uploaded_pyq_papers,
    get_active_topic_weights,
    get_active_question_patterns,
    extract_question_patterns,
    to_normalized_archetype_title,
    delete_uploaded_pyq_paper,
    correlate_question_to_lectures,
)
from backend.services.storage import _get_connection

BANNED_DEMO_TERMS = [
    "NEURO 301",
    "Cellular Neurobiology",
    "Synaptic Plasticity",
    "LTP/LTD",
    "NMDA",
    "CaMKII",
    "Hodgkin-Huxley",
    "Henderson",
    "88.5%",
    "91.2%",
    "42 / 56",
]

# Real Operating Systems 3-year test paper text matching the user's dataset
OS_MULTI_YEAR_PAPER_TEXT = """Operating Systems Examination Paper

2024 Examination

Unit I — Processes
Q1. Explain process states and the process control block (PCB).
Unit II — Memory Management
Q2. Explain paging, pages, and frames with architecture diagrams.
Q3. Explain LRU page replacement algorithm with an example page reference string.
Q4. Discuss file allocation methods including contiguous, linked, and indexed.

2023 Examination

Unit I — Processes
Q1. Describe process states and the process control block (PCB) structures.
Q2. Explain paging / pages / frames memory translation mechanism.
Unit II — Storage & Concurrency
Q3. Explain virtual memory concepts and demand paging techniques.
Q4. Describe deadlock conditions and the four necessary Coffman conditions.

2022 Examination

Unit I — Memory
Q1. Explain LRU page replacement and evaluate its fault rate.
Q2. Discuss virtual memory management and page fault handling.
Unit II — File Systems & Deadlocks
Q3. Explain file allocation schemes and compare contiguous vs indexed.
Q4. Discuss deadlock conditions and avoidance using Banker's algorithm.
"""


def make_simple_pdf(lines: list[str]) -> bytes:
    """Create a minimal 1-page valid PDF in memory containing the given text lines."""
    content = "BT /F1 12 Tf 72 720 Td 16 TL "
    for line in lines:
        ascii_line = line.replace("\u2014", "-").replace("\u2013", "-").replace("—", "-")
        safe_line = ascii_line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        content += f"({safe_line}) ' "
    content += "ET"
    content_bytes = content.encode("latin1", errors="replace")
    stream_len = len(content_bytes)

    pdf = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length {stream_len} >>
stream
{content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000298 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
{360 + stream_len}
%%EOF"""
    return pdf.encode("latin1")


class TestPyqIntelligence(unittest.TestCase):
    def _clear_pyq_sqlite(self):
        """Delete all rows from pyq_papers in SQLite to ensure test isolation."""
        try:
            with _get_connection() as conn:
                conn.execute("DELETE FROM pyq_papers")
                conn.commit()
        except Exception:
            pass  # Table may not exist in test DB; harmless

    def setUp(self):
        self.client = TestClient(app)
        UPLOADED_PAPERS.clear()
        self._clear_pyq_sqlite()

    def tearDown(self):
        UPLOADED_PAPERS.clear()
        self._clear_pyq_sqlite()

    def _get_os_pdf_bytes(self) -> bytes:
        lines = [line.strip() for line in OS_MULTI_YEAR_PAPER_TEXT.strip().split("\n") if line.strip()]
        return make_simple_pdf(lines)

    # =========================================================================
    # CRITERION 12: Empty state remains free of demo/neuroscience content
    # =========================================================================
    def test_12_empty_state_and_no_neuroscience_demo_values(self):
        """12. Empty state: Fresh PYQ page returns empty list and no neuroscience demo terms."""
        res_papers = self.client.get("/pyq/papers")
        self.assertEqual(res_papers.status_code, 200)
        self.assertEqual(res_papers.json(), [])

        res_topics = self.client.get("/pyq/topics")
        self.assertEqual(res_topics.status_code, 200)
        self.assertEqual(res_topics.json(), [])

        res_patterns = self.client.get("/pyq/patterns")
        self.assertEqual(res_patterns.status_code, 200)
        self.assertEqual(res_patterns.json(), [])

        for term in BANNED_DEMO_TERMS:
            self.assertNotIn(term, str(res_papers.json()))
            self.assertNotIn(term, str(res_topics.json()))
            self.assertNotIn(term, str(res_patterns.json()))

    # =========================================================================
    # CRITERION 1: Exact duplicate questions -> ONE grouped pattern
    # =========================================================================
    def test_01_exact_duplicate_questions_grouped_into_one_pattern(self):
        """1. Exact duplicate questions -> ONE grouped pattern."""
        duplicates = [
            {"id": "q1", "year": 2024, "questionNumber": "2024 · Q2", "questionText": "Explain paging and distinguish between pages and frames.", "topicTag": "Paging"},
            {"id": "q2", "year": 2023, "questionNumber": "2023 · Q3", "questionText": "Explain paging and distinguish between pages and frames.", "topicTag": "Paging"},
            {"id": "q3", "year": 2022, "questionNumber": "2022 · Q1", "questionText": "Explain paging and distinguish between pages and frames.", "topicTag": "Paging"},
            {"id": "q4", "year": 2021, "questionNumber": "2021 · Q4", "questionText": "Explain paging and distinguish between pages and frames.", "topicTag": "Paging"},
            {"id": "q5", "year": 2020, "questionNumber": "2020 · Q2", "questionText": "Explain paging and distinguish between pages and frames.", "topicTag": "Paging"},
        ]
        patterns = extract_question_patterns(duplicates)
        self.assertEqual(len(patterns), 1, f"Expected exactly 1 grouped pattern, got {len(patterns)}")
        self.assertEqual(patterns[0]["occurrenceCount"], 5)
        self.assertEqual(sorted(patterns[0]["years"], reverse=True), [2024, 2023, 2022, 2021, 2020])
        self.assertEqual(len(patterns[0]["occurrences"]), 5)

    # =========================================================================
    # CRITERION 2: Slightly different wording with the same meaning -> ONE pattern
    # =========================================================================
    def test_02_slight_wording_differences_grouped_into_one_pattern(self):
        """2. Slightly different wording with the same meaning -> ONE grouped pattern."""
        wording_variants = [
            {"id": "q1", "year": 2024, "questionNumber": "2024 · Q2", "questionText": "Explain paging and distinguish between pages and frames.", "topicTag": "Paging"},
            {"id": "q2", "year": 2023, "questionNumber": "2023 · Q3", "questionText": "Describe paging and differentiate between pages and frames.", "topicTag": "Paging"},
        ]
        patterns = extract_question_patterns(wording_variants)
        self.assertEqual(len(patterns), 1, f"Expected 1 grouped pattern for equivalent wording, got {len(patterns)}")
        self.assertEqual(patterns[0]["occurrenceCount"], 2)
        self.assertEqual(sorted(patterns[0]["years"], reverse=True), [2024, 2023])
        self.assertEqual(len(patterns[0]["occurrences"]), 2)

    # =========================================================================
    # CRITERION 3: Same broad topic but different question intent -> separate patterns
    # =========================================================================
    def test_03_same_broad_topic_different_intent_remain_separate(self):
        """
        3. Same broad topic but different question intent -> separate patterns.
        "Explain paging.", "Differentiate pages and frames.", "Explain page fault handling."
        must remain 3 distinct patterns, not collapsed into one.
        """
        distinct_intent_questions = [
            {"id": "q1", "year": 2024, "questionNumber": "2024 · Q1", "questionText": "Explain paging.", "topicTag": "Paging"},
            {"id": "q2", "year": 2023, "questionNumber": "2023 · Q2", "questionText": "Differentiate pages and frames.", "topicTag": "Paging"},
            {"id": "q3", "year": 2022, "questionNumber": "2022 · Q3", "questionText": "Explain page fault handling.", "topicTag": "Paging"},
        ]
        patterns = extract_question_patterns(distinct_intent_questions)
        self.assertEqual(
            len(patterns), 3,
            f"Expected 3 separate patterns for distinct intents, got {len(patterns)}: {[p['canonicalQuestion'] for p in patterns]}"
        )
        for p in patterns:
            self.assertEqual(p["occurrenceCount"], 1)

    # =========================================================================
    # CRITERION 4: Same pattern appearing 20 times -> occurrenceCount = 20 & ONE pattern
    # =========================================================================
    def test_04_pattern_appearing_20_times_across_10_years(self):
        """4. Same pattern appearing 20 times across 10 years -> occurrenceCount = 20 and ONE grouped pattern."""
        twenty_questions = []
        for i in range(20):
            yr = 2015 + (i % 10)  # 10 years (2015-2024)
            qnum = f"Q{(i // 10) + 1}"
            twenty_questions.append({
                "id": f"q_{i}",
                "year": yr,
                "questionNumber": f"{yr} · {qnum}",
                "questionText": "Explain paging and distinguish between pages and frames." if i % 2 == 0 else "Describe paging and differentiate between pages and frames.",
                "topicTag": "Paging / Pages / Frames",
            })

        patterns = extract_question_patterns(twenty_questions)
        self.assertEqual(len(patterns), 1, f"Expected exactly ONE grouped pattern, got {len(patterns)}")
        self.assertEqual(patterns[0]["occurrenceCount"], 20)
        self.assertEqual(len(patterns[0]["years"]), 10)
        self.assertEqual(len(patterns[0]["occurrences"]), 20)

    # =========================================================================
    # CRITERION 5: Original raw questions remain individually accessible (Level A)
    # =========================================================================
    def test_05_original_raw_questions_remain_accessible(self):
        """5. Original raw questions remain individually accessible with all fields intact."""
        questions = parse_pyq_questions_regex(OS_MULTI_YEAR_PAPER_TEXT, title="Operating Systems PYQ")
        self.assertEqual(len(questions), 12)

        # Generate patterns
        patterns = extract_question_patterns(questions)
        self.assertEqual(len(patterns), 6)

        # Raw questions must remain untouched
        self.assertEqual(len(questions), 12)
        for q in questions:
            self.assertIn("questionNumber", q)
            self.assertIn("year", q)
            self.assertIn("questionText", q)
            self.assertIn("unit", q)
            self.assertIn("marks", q)
            self.assertTrue(len(q["questionText"]) > 10)

    # =========================================================================
    # CRITERION 6: Every grouped occurrence retains year + question number
    # =========================================================================
    def test_06_grouped_occurrences_retain_year_and_question_number(self):
        """6. Every grouped occurrence retains year + question number + traceability link."""
        questions = parse_pyq_questions_regex(OS_MULTI_YEAR_PAPER_TEXT, title="Operating Systems PYQ")
        patterns = extract_question_patterns(questions)

        total_occurrences = 0
        for pattern in patterns:
            self.assertTrue(pattern["occurrenceCount"] >= 1)
            self.assertEqual(pattern["occurrenceCount"], len(pattern["occurrences"]))
            for occ in pattern["occurrences"]:
                total_occurrences += 1
                self.assertIn("year", occ)
                self.assertIn("questionNumber", occ)
                self.assertIn("questionText", occ)
                self.assertTrue(bool(occ["year"]))
                self.assertTrue(bool(occ["questionNumber"]))
                self.assertTrue(bool(occ["questionText"]))

        self.assertEqual(total_occurrences, 12, "All 12 questions must be accounted for across occurrences")

    # =========================================================================
    # CRITERION 7: Recurrence counts use only actual uploaded papers
    # =========================================================================
    def test_07_recurrence_counts_use_only_actual_uploaded_papers(self):
        """7. Recurrence counts use only actual uploaded papers (zero phantom data)."""
        # Upload single OS 3-year paper
        pdf_bytes = self._get_os_pdf_bytes()
        res = self.client.post(
            "/pyq/upload",
            files={"file": ("OS_Exam.pdf", pdf_bytes, "application/pdf")},
            data={"courseCode": "CS301"},
        )
        self.assertEqual(res.status_code, 200)

        res_patterns = self.client.get("/pyq/patterns")
        self.assertEqual(res_patterns.status_code, 200)
        patterns = res_patterns.json()

        # Total occurrences across all patterns must equal exactly the 12 extracted questions
        total_occurrences = sum(p["occurrenceCount"] for p in patterns)
        self.assertEqual(total_occurrences, 12)

        # Each pattern has exactly 2 occurrences because the paper has 6 topics repeated twice
        for p in patterns:
            self.assertEqual(p["occurrenceCount"], 2)

    # =========================================================================
    # CRITERION 8: No fabricated years
    # =========================================================================
    def test_08_no_fabricated_years(self):
        """8. No fabricated years: only 2024, 2023, 2022 exist across paper, questions, and patterns."""
        pdf_bytes = self._get_os_pdf_bytes()
        self.client.post(
            "/pyq/upload",
            files={"file": ("OS_Exam.pdf", pdf_bytes, "application/pdf")},
            data={"courseCode": "CS301"},
        )

        res_patterns = self.client.get("/pyq/patterns")
        patterns = res_patterns.json()

        all_years = set()
        for p in patterns:
            for y in p.get("years", []):
                all_years.add(str(y))
            for occ in p.get("occurrences", []):
                all_years.add(str(occ.get("year")))

        self.assertEqual(all_years, {"2024", "2023", "2022"})
        self.assertNotIn("2021", all_years)
        self.assertNotIn("2020", all_years)
        self.assertNotIn("2025", all_years)

    # =========================================================================
    # CRITERION 9: No fabricated questions
    # =========================================================================
    def test_09_no_fabricated_questions(self):
        """9. No fabricated questions: questions and pattern statements derive strictly from paper text."""
        questions = parse_pyq_questions_regex(OS_MULTI_YEAR_PAPER_TEXT, title="Operating Systems PYQ")
        patterns = extract_question_patterns(questions)

        # Check canonical questions originate from one of the actual questions
        raw_texts = [q["questionText"] for q in questions]
        for p in patterns:
            self.assertIn(p["canonicalQuestion"], raw_texts)

    # =========================================================================
    # CRITERION 10: Topic Weighting Matrix uses normalized topic labels
    # =========================================================================
    def test_10_topic_weighting_matrix_uses_clean_normalized_labels(self):
        """
        10. Topic Weighting Matrix uses clean normalized topic labels rather than raw/truncated question text.
        Labels must be:
          - Process States + PCB
          - Paging / Pages / Frames
          - LRU Page Replacement
          - File Allocation
          - Virtual Memory
          - Deadlock Conditions
        """
        questions = parse_pyq_questions_regex(OS_MULTI_YEAR_PAPER_TEXT, title="Operating Systems PYQ")
        matrix = generate_topic_weighting_matrix(questions)

        expected_normalized_labels = {
            "Process States + PCB",
            "Paging / Pages / Frames",
            "LRU Page Replacement",
            "File Allocation",
            "Virtual Memory",
            "Deadlock Conditions",
        }

        actual_labels = {item["topic"] for item in matrix}
        self.assertEqual(actual_labels, expected_normalized_labels)

        # None of the labels may contain ellipsis or raw un-normalized sentences
        for label in actual_labels:
            self.assertNotIn("...", label)
            self.assertNotIn("process states a control block", label)
            self.assertNotIn("paging, pages, a", label)

    # =========================================================================
    # CRITERION 11: Existing six OS hotspot topics remain correct
    # =========================================================================
    def test_11_existing_six_hotspot_topics_correct(self):
        """
        11. Existing six OS hotspot topics remain correct:
          1. Process States + PCB -> 2024 + 2023
          2. Paging / Pages / Frames -> 2024 + 2023
          3. LRU Page Replacement -> 2024 + 2022
          4. File Allocation -> 2024 + 2022
          5. Virtual Memory -> 2023 + 2022
          6. Deadlock Conditions -> 2023 + 2022
        """
        questions = parse_pyq_questions_regex(OS_MULTI_YEAR_PAPER_TEXT, title="Operating Systems PYQ")
        matrix = generate_topic_weighting_matrix(questions)

        topic_map = {item["topic"]: sorted(item["years"]) for item in matrix}

        self.assertEqual(topic_map.get("Process States + PCB"), ["2023", "2024"])
        self.assertEqual(topic_map.get("Paging / Pages / Frames"), ["2023", "2024"])
        self.assertEqual(topic_map.get("LRU Page Replacement"), ["2022", "2024"])
        self.assertEqual(topic_map.get("File Allocation"), ["2022", "2024"])
        self.assertEqual(topic_map.get("Virtual Memory"), ["2022", "2023"])
        self.assertEqual(topic_map.get("Deadlock Conditions"), ["2022", "2023"])


if __name__ == "__main__":
    unittest.main()
