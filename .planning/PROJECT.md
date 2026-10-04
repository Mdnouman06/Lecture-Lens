# LectureLens

## What This Is

LectureLens is an AI-powered study assistant for students that converts lecture materials (audio recordings, slide PDFs, transcripts, and YouTube links) into organized notes, executive summaries, interactive quizzes, flashcards, and personalized study resources. Designed with a clean, Apple-inspired interface, it helps students understand and retain complex educational material with minimal cognitive friction.

## Core Value

Effortlessly transform uploaded lecture media (documents or recordings) into accurate, structured study notes and an interactive AI tutor that answers questions grounded directly in the student's lecture materials.

## Requirements

### Validated (Milestone 1 & Phase 7 Baseline)

- [x] Supabase user authentication (email/password signup, signin, persistent session listener, and logout)
- [x] Interactive Apple HIG Dashboard with recent lectures, study progress, and navigation rail
- [x] Recorded lecture audio/video upload via FastAPI `POST /ingest/audio` with local `faster-whisper` CTranslate2 transcription
- [x] Dynamic real-time upload & transcription progress bar (15% to 100%)
- [x] Automatic navigation transition from upload completion directly to Lecture Workspace
- [x] Diarized Transcript Viewer with timestamped segments, speaker labels, active autoscroll, and live search highlighting
- [x] Client-side transcript plain text (.txt) export with timestamps and speaker attributions
- [x] Supabase PostgreSQL persistence of lecture metadata (`lectures`) and transcript segments (`lecture_transcripts`) with Row Level Security (RLS)

### Active (Milestone 2 Production Roadmap)

- [ ] Smart Notes generation using local Ollama (supporting Qwen3) with Supabase persistence and inline markdown editing (Phase 8)
- [ ] Context-grounded AI Tutor copilot using user's Supabase transcripts, timestamp citations, and audio seeking (Phase 9)
- [ ] Active-recall flashcards and 5-question MCQ quizzes with FSRS difficulty ratings and Supabase persistence (Phase 10)
- [ ] Previous Year Question Paper (PYQ) PDF upload, question parsing, and topic weighting matrix in Supabase (Phase 11)
- [ ] Adaptive 7-day study planner and visual academic calendar tracking review deadlines in Supabase (Phase 12)
- [ ] Multimodal ingestion for PDF slide decks, YouTube URLs with fallbacks, and Google Meet recorded file uploads (Phase 13)
- [ ] Comprehensive PostgreSQL Row Level Security (RLS) and multi-tenant isolation audit across all tables (Phase 14)
- [ ] UI/UX polish: empty states, loading skeletons, responsive mobile/tablet design, and keyboard accessibility (Phase 15)
- [ ] Automated integration test suite covering backend endpoints, transcription, and prompt contracts (Phase 16)
- [ ] Production architecture resolution: local-first vs cloud AI APIs, environment variables, and CORS hardening (Phase 17)
- [ ] Production deployment, live smoke testing on real lecture media, disaster recovery, and release checklist (Phase 18)

### Out of Scope

- **Live Google Meet / Zoom bot integration** — Headless browser audio capture is fragile, actively blocked by meeting security/CAPTCHA, and violates institutional privacy permissions without admin rights. Replaced with reliable recorded file upload (`.mp4`/`.m4a`).
- **In-browser Whisper WASM model execution** — 500MB+ model downloads in browser tab cause memory crashes on student laptops. Local Python `faster-whisper` via CTranslate2 is up to 4x faster and rock-solid.
- **Enterprise university institutional LMS integration (Canvas/Blackboard)** — High API variability; manual file upload provides universal compatibility for students.
- **Automated multi-tenant billing & payments** — Not required for single-student beginner MVP.

## Context

- **Visual Design Reference**: Pre-designed in Google Stitch under project `"LectureLens Apple-Inspired Design System"` (`projects/11893050174269724482`) with 25 polished desktop screens.
- **Typography & Styling**: Poppins font applied throughout all interface surfaces paired with Apple-grade glassmorphism, crisp card borders, and responsive layouts.
- **Current Baseline**: Audio ingestion, transcription, transcript export, and Supabase database persistence are verified working.

## Constraints

- **Tech Stack (Frontend)**: React with TypeScript and modern component CSS (Vite build system).
- **Tech Stack (Backend & DB)**: Supabase for authentication, relational metadata database, and lecture file storage.
- **Tech Stack (Local AI)**: Lightweight Python FastAPI backend running locally on `localhost:8000` to interface with Ollama (LLM) and faster-whisper (transcription).
- **Inference Models**: `faster-whisper` (CTranslate2 `base` or `small` int8) for speech-to-text; Ollama with Qwen3 (`qwen2.5:3b` / `qwen3` via `OLLAMA_MODEL`) for study notes and AI tutoring.
- **Typography**: Poppins font applied globally across all UI elements.

## Key Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| Lightweight FastAPI local AI server | Keeps heavy Python ML dependencies (faster-whisper, PyTorch) cleanly isolated while exposing simple REST endpoints for React | **Adopted & Verified** |
| Faster-whisper via CTranslate2 | Up to 4x faster than vanilla Whisper with int8 quantization, running smoothly on student laptops | **Adopted & Verified** |
| Supabase Auth & PostgreSQL | Provides instant email/password auth, robust RLS data isolation, and relational tables for lectures and transcripts | **Adopted & Verified** |
| Google Meet via Recording Upload | Live bots face institutional CAPTCHA and permission blocks; file upload of exported `.mp4` is 100% reliable | **Adopted for Phase 13** |
| Configurable Ollama model (Qwen3) | Allows students to run fast, state-of-the-art compact models (`qwen2.5:3b`) without hardcoding model names | **Adopted for Phase 8** |
| Production Inference Strategy | Documented 3 deployment models (Local-First Desktop, Cloud AI APIs, Hybrid Tunnel) to resolve HTTPS vs localhost block | **Pending Phase 17** |

---
*Last updated: 2026-09-30 after Milestone 2 production roadmap baseline*
