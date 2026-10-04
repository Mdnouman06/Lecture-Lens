# Phase 16 Context: Integration Testing, Regression Testing & Performance Checks

**Phase:** 16 — Integration Testing, Regression Testing & Performance Checks  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [TEST-01]  

---

## 1. Objective

Execute comprehensive automated integration test suites and performance benchmarks covering the complete LectureLens architecture across frontend components, backend REST endpoints, AI inference pipelines, database CRUD, and export utilities:
1. **Backend Integration & REST Route Matrix (`TEST-01`)**:
   - Expand `backend/test_api.py` and create `backend/test_integration.py` covering 100% of FastAPI endpoints with both mock and live execution modes.
   - Test full request validation, error boundaries (HTTP 400, 422, 500, 503), query parameter handling, and multipart upload schemas.
2. **AI Inference & Speech-to-Text Accuracy (`TEST-01`)**:
   - Verify `faster-whisper` CTranslate2 transcription pipeline on audio fixtures with timestamp continuity (`start < end`), diarization speaker attribution, and real-time factor (RTF) speed benchmarking.
   - Verify local Ollama Qwen3 (`qwen3:4b`) prompt contracts: executive notes synthesis, grounded tutor Q&A citations (`[MM:SS - MM:SS]`), flashcard deck generation, and 5-question quiz generation.
   - Validate offline Ollama diagnostics and error signaling without unhandled server crashes.
3. **Data Integrity & Export Verification (`TEST-01`)**:
   - Verify transcript plain text export (`.txt`) across all lecture ingestion sources (Audio, PDF slides, YouTube, Manual editor) with clean headers and timestamp formatting.
   - Verify Anki-compatible TSV flashcard export and formatted Markdown notes export.
4. **Client Contract & Full-System Integration Verification (`TEST-01`)**:
   - Author `scripts/verify_integration.py` validating that frontend TypeScript API contracts in `src/services/api.ts` and `src/services/lectures.ts` match backend FastAPI schemas exactly.
   - Create a master test suite runner `scripts/run_all_tests.py` orchestrating backend unit tests, security audits, database RLS checks, UI accessibility checks, and production frontend builds.

---

## 2. Technical Stack & Component Architecture

```
LectureLens System Test Matrix
├── Backend Unit & Security Tests
│   ├── backend/test_api.py             <-- REST contract & schema validation
│   ├── backend/test_security.py        <-- Prompt injection & path traversal tests
│   └── backend/test_integration.py     <-- Full endpoint integration & error matrix
├── Performance Benchmarking
│   ├── Whisper transcription RTF benchmark (< 30s for 2-min lecture on CPU)
│   └── Ollama inference latency & token streaming tests
├── Data Integrity & Export Verification
│   ├── Timestamped diarized transcript plain text (.txt) export
│   ├── Structured study notes markdown (.md) export
│   └── Flashcard deck Anki TSV (.tsv) export
├── Frontend Contracts & Build Validation
│   ├── TypeScript client contract verification (src/services/api.ts)
│   ├── Production bundle build (npm run build)
│   └── Linter code quality checks (npm run lint)
└── Master Test Orchestrator
    └── scripts/run_all_tests.py        <-- Consolidated test pipeline runner
```

---

## 3. Plan Decomposition

- **Plan 16-01**: Backend Integration, End-to-End Route Matrix, Whisper Benchmarking & Ollama Prompt Regression Suite
- **Plan 16-02**: Client Integration, Transcript Export Formats, Performance Benchmarking & Master Verification Runner

---

## 4. Acceptance Criteria

1. Backend test suite (`backend/test_api.py` + `backend/test_integration.py` + `backend/test_security.py`) achieves 100% pass rate with zero failures.
2. Faster-whisper transcription pipeline processes audio with valid monotonically increasing timestamps and diarized segments.
3. Plain text transcript export, Markdown notes export, and Anki TSV flashcard export produce valid, non-empty, properly structured files.
4. `scripts/run_all_tests.py` orchestrates all test suites with a consolidated green status report.
5. Production bundle builds cleanly (`npm run build`) in < 5 seconds with zero compilation errors.
