# Phase 11-01 Summary: Backend PDF Extraction Engine & Qwen3 PYQ Synthesis

## Work Completed

1. **Qwen3 PYQ Synthesis Service (`backend/services/ollama.py`)**:
   - Engineered `PYQ_EXTRACTION_PROMPT` tailored for `qwen3:4b` to analyze exam PDFs and extract structured questions with marks, 3-step grading rubrics, common pitfalls, and estimated recurrence years in strict JSON format.
   - Implemented `analyze_pyq_exam_paper` with transparent error handling, schema validation, and JSON normalization.

2. **Harden PDF Extraction & Hybrid Question Parser (`backend/services/pyq.py`)**:
   - Refactored `extract_pyq_pdf` to ingest PDF bytes via `pypdf.PdfReader`, calculate page counts, and attempt `analyze_pyq_exam_paper` using local Qwen3.
   - Built resilient regex fallback parser `parse_pyq_questions_regex` to extract questions, marks, and rubric steps when Ollama is offline or uninstalled.
   - Implemented `generate_topic_weighting_matrix` to compute dynamic topic percentages and category priority tags (`critical`, `mastered`, `good`, `low`) based on extracted questions.
   - Implemented `correlate_question_to_lectures` to match exam problem statements and topics with student lecture titles, summaries, and key concepts.

3. **FastAPI Endpoints & Unit Tests (`backend/main.py`, `backend/test_api.py`)**:
   - Upgraded `POST /pyq/upload` to parse real PDF files via `pypdf` and return structured `PyqPaper` objects with questions and topic weights.
   - Exposed `GET /pyq/topics` (and alias `/pyq/weights`) for dynamic course syllabus topic weighting.
   - Exposed `POST /pyq/match` accepting `PyqMatchRequest` for linking questions to lecture timecodes.
   - Added automated tests in `backend/test_api.py`: `test_pyq_routes_exist`, `test_pyq_topic_weighting_calculation`, and `test_pyq_match_logic`.

## Verification
- Unit test suite: `.\.venv\Scripts\python -m unittest backend.test_api` passed (12/12 tests in 2.103s).
- Contract verification: `/pyq/upload`, `/pyq/topics`, and `/pyq/match` registered in FastAPI router.
