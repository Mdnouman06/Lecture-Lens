# Phase 09 Plan 01 Summary: Backend Grounded AI Tutor RAG Endpoint & Citation Extraction

**Execution Date:** 2026-09-30  
**Phase:** 09 — Context-Grounded AI Tutor Copilot  
**Plan:** 01 of 03  
**Status:** Completed & Verified  

---

## 1. Objectives Completed

1. **Grounded Academic Prompt Template (`TUTOR_RAG_PROMPT`)**:
   - Refactored prompt in `backend/services/ollama.py` to enforce strict grounding in provided lecture segments.
   - Enforced structured JSON output with `text`, `topicBadge`, `isGrounded`, `sequenceSteps`, `citations`, and `examAlert`.
   - Included explicit out-of-scope rule: questions not covered in the transcript are marked `isGrounded: false` with `topicBadge: "Out of Scope"` and a polite disclaimer.

2. **RAG Service Refactoring (`answer_tutor_question`)**:
   - Formats transcript context with human-readable timestamp headers `[{MM:SS} - {MM:SS}] {Speaker}: {Text}`.
   - Matches model citations back to actual segment boundaries (`startSeconds`, `endSeconds`) via quote substring or timecode display parsing.
   - Removed canned LTP NMDA simulation fallback. If Ollama daemon is offline or the model is missing, raises `OllamaOfflineError` or `OllamaModelNotFoundError`.

3. **FastAPI Tutor Endpoint (`POST /tutor/ask`)**:
   - Defined `ContextSegmentItem` and updated `TutorQuestionRequest` to accept structured `contextSegments`.
   - Mapped `OllamaOfflineError` to HTTP 503 with actionable remediation instructions (`ollama serve`).
   - Mapped `OllamaModelNotFoundError` to HTTP 404 (`ollama pull <model>`).
   - Validates non-empty question payload with HTTP 400.

4. **Automated Unit Tests**:
   - Added `test_tutor_ask_empty_question` verifying 400 validation.
   - Added `test_tutor_context_formatting` verifying `format_timecode` handling.
   - Verified `/tutor/ask` route registration in FastAPI app.
   - Ran `unittest backend.test_api`: 7/7 tests passed with zero errors.

---

## 2. Verification Checklist

- [x] `TUTOR_RAG_PROMPT` enforces grounding and explicit out-of-scope detection
- [x] `answer_tutor_question` extracts real timestamp citations without canned mock data
- [x] `POST /tutor/ask` handles 400 and 503 status codes cleanly
- [x] `.\.venv\Scripts\python -m unittest backend.test_api` passes (7/7 tests)

---

## 3. Files Modified

- `backend/services/ollama.py`: Defined `format_timecode`, redesigned `TUTOR_RAG_PROMPT`, and rebuilt `answer_tutor_question`.
- `backend/main.py`: Defined `ContextSegmentItem`, updated `TutorQuestionRequest`, and hardened `tutor_ask_endpoint`.
- `backend/test_api.py`: Added contract tests for `/tutor/ask` route, payload validation, and timecode formatting.
