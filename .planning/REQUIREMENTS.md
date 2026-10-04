# Requirements: LectureLens

**Defined:** 2026-09-28  
**Updated:** 2026-09-30 (Milestone 2 Production Roadmap Expansion)  
**Core Value:** Effortlessly transform uploaded lecture media (documents or recordings) into accurate, structured study notes and an interactive AI tutor that answers questions grounded directly in the student's lecture materials.

---

## Requirements Catalog

### Dashboard & Foundation (DASH)
- [x] **DASH-01**: User can navigate between views (Dashboard, Ingestion Hub, Notes Workspace, Flashcards, Quizzes, PYQ, Planner) via an Apple-inspired sidebar navigation rail. *(Verified)*
- [x] **DASH-02**: User can view summary study statistics (Total Lectures, Study Minutes, Flashcards Mastered, Recent Activity) on the home dashboard. *(Verified)*
- [x] **DASH-03**: User can view an interactive connection status pill for the local AI engine (`🟢 Ready` / `🟡 Offline Demo Mode`) with setup instructions. *(Verified)*
- [x] **DASH-04**: User experiences consistent Poppins typography, smooth glassmorphism, and responsive layouts across all views matching the Google Stitch design specification. *(Verified)*

### Lecture Ingestion Hub (INGEST)
- [x] **INGEST-01**: User can upload PDF lecture slides or handouts and extract clean text. *(Verified)*
- [x] **INGEST-02**: User can upload recorded audio/video files and receive an automated timestamped transcript using local `faster-whisper`. *(Verified)*
- [x] **INGEST-03**: User can enter a YouTube lecture URL and fetch auto-generated captions. *(Verified)*
- [x] **INGEST-04**: User can manually paste or edit transcript text as an instant fallback when YouTube captions or automated audio extraction fail. *(Verified)*
- [x] **INGEST-05**: User sees real-time progress indicators (15% to 100%) during file upload, transcription, and text processing. *(Verified)*
- [x] **INGEST-06**: Extracted PDF slide texts and slide count persist to Supabase `lectures` and `lecture_notes` tables. *(Verified)*
- [x] **INGEST-07**: YouTube captions persist to Supabase `lecture_transcripts` table with timestamped segments. *(Verified)*
- [x] **INGEST-08**: Google Meet recorded video (.mp4/.m4a) and transcript file upload workflow documented and supported via the audio ingestion pipeline. *(Verified)*

### AI Notes & Summarization Engine (NOTES)
- [x] **NOTES-01**: User can generate an AI Executive Summary highlighting high-level takeaways from the lecture via local Ollama. *(Verified)*
- [x] **NOTES-02**: User can generate detailed Structured Notes with formatted markdown headers, bullet points, and actionable study items. *(Verified)*
- [x] **NOTES-03**: User can view extracted Key Concepts & Definitions in a dedicated quick-review card grid. *(Verified)*
- [x] **NOTES-04**: User can edit, copy, and export generated study notes to markdown or plain text. *(Verified)*
- [x] **NOTES-05**: Notes, student markdown edits, margin notes, and highlights are persisted to Supabase `lecture_notes` PostgreSQL table. *(Verified)*
- [x] **NOTES-06**: Ollama inference uses a configurable model (supporting Qwen3 / `qwen2.5:3b`) with clear diagnostic error handling when Ollama is offline. *(Verified)*

### AI Tutor Copilot (TUTOR)
- [x] **TUTOR-01**: User can open an interactive AI Tutor chat panel directly alongside the lecture notes. *(Verified)*
- [x] **TUTOR-02**: User can ask questions in natural language and receive answers strictly grounded in the uploaded lecture material (RAG Q&A). *(Verified)*
- [x] **TUTOR-03**: User can click pre-generated quick prompt chips (e.g., "Summarize main argument", "Explain key formula", "Give a real-world example") for instant answers. *(Verified)*
- [x] **TUTOR-04**: User receives citation snippets or timestamp references showing where in the lecture the answer originates, with audio player seek triggers. *(Verified)*
- [x] **TUTOR-05**: Tutor prompts assemble real context from user's Supabase transcript segments and notes, with explicit ungrounded out-of-scope warnings. *(Verified)*

### Active Recall & Assessment (RECALL)
- [x] **RECALL-01**: User can generate a deck of flashcards (Question on Front, Answer on Back) from any processed lecture with one click using Qwen3. *(Verified)*
- [x] **RECALL-02**: User can flip flashcards using interactive 3D card flip animations with keyboard or click controls. *(Verified)*
- [x] **RECALL-03**: User can rate their recall difficulty for each card (Easy / Medium / Hard) to track mastery. *(Verified)*
- [x] **RECALL-04**: User can generate a 5-question multiple-choice quiz (MCQ) based on the lecture material using Qwen3. *(Verified)*
- [x] **RECALL-05**: User receives immediate feedback on quiz answers with clear explanations and confetti celebration on completion. *(Verified)*
- [x] **RECALL-06**: Flashcard decks, difficulty ratings, and card mastery statuses persist to Supabase `flashcards` table. *(Verified)*
- [x] **RECALL-07**: Quiz submissions, selected answers, and scores persist to Supabase `quiz_submissions` table. *(Verified)*

### Advanced Study Tools (ADV)
- [x] **ADV-01**: User can upload a Previous Year Question Paper (PYQ) PDF and extract question text. *(Verified)*
- [x] **ADV-02**: User can view identified topics and key recurring themes from the uploaded PYQ. *(Verified)*
- [x] **ADV-03**: User can view an interactive 7-day academic study planner and calendar dashboard tracking upcoming review sessions. *(Verified)*
- [x] **ADV-04**: PYQ exam papers and extracted questions persist to Supabase `pyq_papers` and `pyq_questions` tables. *(Verified)*
- [x] **ADV-05**: Study blocks and exam deadlines persist to Supabase `study_blocks` and `exam_deadlines` tables. *(Verified)*

### Data Persistence, Security & RLS (SEC)
- [x] **SEC-01**: Strict PostgreSQL Row Level Security (RLS) policies are active and enforced across all tables (`lectures`, `lecture_transcripts`, `lecture_notes`, `flashcards`, `quiz_submissions`, `pyq_papers`, `study_blocks`) and storage (`lecture_media`). *(Verified)*
- [x] **SEC-02**: User authentication gates protected data, handles session token expiry gracefully, and ensures zero cross-tenant data leakage. *(Verified)*

### UI/UX Polish & Accessibility (UI)
- [x] **UI-01**: Complete empty state illustrations, loading skeletons, keyboard accessibility (Tab, Enter, Spacebar, ARIA tags), and responsive layouts across mobile (375px), tablet (768px), and desktop (1440px). *(Verified)*

### Integration & Performance Testing (TEST)
- [x] **TEST-01**: Comprehensive automated integration test suite covering backend REST endpoints, faster-whisper transcription accuracy, Ollama prompt contracts, and transcript export integrity. *(Verified)*

### Production Deployment & Operations (PROD)
- [x] **PROD-01**: Production environment variables configured without committed secrets, build optimized with code-split chunks under 500kB, and CORS locked to production origins. *(Verified)*
- [x] **PROD-02**: Production deployment executed and verified with live smoke tests, Supabase database backup procedures, and student release documentation. *(Verified)*

---

## Out of Scope

| Feature | Reason |
|---|---|
| Live Google Meet / Zoom bot capture | Headless browser audio capture is fragile, actively blocked by meeting security/CAPTCHA, and violates institutional privacy permissions without admin rights. Replaced with reliable recorded file upload (`.mp4`/`.m4a`). |
| In-browser Whisper WASM model execution | 500MB+ model downloads inside a browser tab cause out-of-memory crashes on student laptops. Local Python `faster-whisper` via CTranslate2 is up to 4x faster and rock-solid. |
| Direct university LMS auto-sync (Canvas/Blackboard/Moodle) | Extreme institutional API variability and OAuth restrictions. Direct file/PDF upload provides universal compatibility. |
| Direct cloud deployment of local Ollama / faster-whisper | Student MVP relies on private, free, on-device compute. Cloud AI inference options evaluated as optional alternatives in Phase 17. |

---

## Traceability Matrix

| Requirement | Target Phase | Status | Verified Date |
|---|---|---|---|
| DASH-01 | Phase 1 | **Complete** | 2026-09-28 |
| DASH-02 | Phase 1 | **Complete** | 2026-09-28 |
| DASH-03 | Phase 1 | **Complete** | 2026-09-28 |
| DASH-04 | Phase 1 | **Complete** | 2026-09-28 |
| INGEST-02 | Phase 2 / Phase 7 | **Complete** | 2026-09-30 |
| INGEST-05 | Phase 2 / Phase 7 | **Complete** | 2026-09-30 |
| NOTES-01 | Phase 8 | Complete | 08-VERIFICATION.md |
| NOTES-02 | Phase 8 | Complete | 08-VERIFICATION.md |
| NOTES-03 | Phase 8 | Complete | 08-VERIFICATION.md |
| NOTES-04 | Phase 8 | Complete | 08-VERIFICATION.md |
| NOTES-05 | Phase 8 | Complete | 08-VERIFICATION.md |
| NOTES-06 | Phase 8 | Complete | 08-VERIFICATION.md |
| TUTOR-01 | Phase 9 | Complete | 09-VERIFICATION.md |
| TUTOR-02 | Phase 9 | Complete | 09-VERIFICATION.md |
| TUTOR-03 | Phase 9 | Complete | 09-VERIFICATION.md |
| TUTOR-04 | Phase 9 | Complete | 09-VERIFICATION.md |
| TUTOR-05 | Phase 9 | Complete | 09-VERIFICATION.md |
| RECALL-01 | Phase 10 | Complete | 10-VERIFICATION.md |
| RECALL-02 | Phase 10 | Complete | 10-VERIFICATION.md |
| RECALL-03 | Phase 10 | Complete | 10-VERIFICATION.md |
| RECALL-04 | Phase 10 | Complete | 10-VERIFICATION.md |
| RECALL-05 | Phase 10 | Complete | 10-VERIFICATION.md |
| RECALL-06 | Phase 10 | Complete | 10-VERIFICATION.md |
| RECALL-07 | Phase 10 | Complete | 10-VERIFICATION.md |
| ADV-01 | Phase 11 | Complete | 11-VERIFICATION.md |
| ADV-02 | Phase 11 | Complete | 11-VERIFICATION.md |
| ADV-04 | Phase 11 | Complete | 11-VERIFICATION.md |
| ADV-03 | Phase 12 | Complete | 12-VERIFICATION.md |
| ADV-05 | Phase 12 | Complete | 12-VERIFICATION.md |
| INGEST-01 | Phase 13 | Complete | 13-VERIFICATION.md |
| INGEST-03 | Phase 13 | Complete | 13-VERIFICATION.md |
| INGEST-04 | Phase 13 | Complete | 13-VERIFICATION.md |
| INGEST-06 | Phase 13 | Complete | 13-VERIFICATION.md |
| INGEST-07 | Phase 13 | Complete | 13-VERIFICATION.md |
| INGEST-08 | Phase 13 | Complete | 13-VERIFICATION.md |
| SEC-01 | Phase 14 | Complete | 14-VERIFICATION.md |
| SEC-02 | Phase 14 | Complete | 14-VERIFICATION.md |
| UI-01 | Phase 15 | Complete | 15-VERIFICATION.md |
| TEST-01 | Phase 16 | Complete | 16-VERIFICATION.md |
| PROD-01 | Phase 17 | Complete | 17-VERIFICATION.md |
| PROD-02 | Phase 18 | Complete | 18-VERIFICATION.md |

**Total Requirements:** 40  
**Verified Complete:** 28  
**Planned / In-Progress:** 12  
**Unmapped:** 0 ✓  

---
*Requirements updated: 2026-10-01*
