# Phase 07: Current Project Audit & Roadmap Baseline

**Milestone:** 2 — Production Readiness & Deployment  
**Status:** In-Progress (Baseline Audit Complete)  
**Date:** 2026-09-30  

---

## 1. Executive Summary

LectureLens currently has a functional Apple-inspired React/Vite frontend and a Python FastAPI backend on `localhost:8000`. The end-to-end audio ingestion pipeline—from local audio upload through `faster-whisper` CTranslate2 transcription, live progress tracking, timestamped Diarized Transcript display, TXT export, Supabase user authentication, and Supabase database persistence for lecture metadata and transcript segments—has been tested and verified working.

However, all subsequent academic modules (Smart Notes generation, Grounded AI Tutor, Active Recall Flashcards, Interactive Quizzes, PYQ Exam Intelligence, and Study Planner) currently rely on hardcoded mock data or temporary in-memory Python dictionaries with realistic simulation fallbacks.

This audit establishes a factual baseline of existing functionality, delineates verified capabilities from prototypes, assesses the feasibility of Google Meet integration, and details the production deployment inference constraint.

---

## 2. Feature Verification Matrix

| Feature Module | Current Implementation State | Verified Working? | Persistence Layer | Gaps & Next Steps |
|---|---|---|---|---|
| **User Authentication** | Supabase Auth (`@supabase/supabase-js`) with email/password signup, signin, session persistence, and logout via `AuthModal.tsx`. | **YES** (Verified) | Supabase `auth.users` | Ready. Session auto-refresh and protected route transitions to be hardened in Phase 14. |
| **Audio / Video Ingestion** | Multipart upload via `POST /ingest/audio` to FastAPI, written to tempfile, transcribed with CTranslate2 `faster-whisper`. Dynamic progress increments from 15% to 100%. | **YES** (Verified on 2:29 audio file: 14 segments, 169 words, auto-navigates to workspace) | Supabase `public.lectures` and `public.lecture_transcripts` | Fully functional for local environment. Cloud deployment strategy addressed in Phase 17. |
| **Transcript Viewer & Export** | `DiarizedTranscriptViewer.tsx` displays timestamped segments, speaker labels, active line autoscroll, live search highlighting, and `.txt` file download with timestamps. | **YES** (Verified) | Reads from `lecture_transcripts` in Supabase | Verified. Multi-speaker diarization refinement deferred to v2. |
| **PDF Slide Deck Ingestion** | `POST /ingest/pdf` with `pypdf` extracts text and slide boundaries. `PdfUploader.tsx` provides UI. | **PARTIAL** (Backend parses text; frontend uses mock concepts) | In-memory response only; **NOT** saved to Supabase | Must connect to Supabase `lectures` & `lecture_notes` tables in Phase 13. |
| **YouTube URL Ingestion** | `POST /ingest/youtube` uses `youtube-transcript-api`. `YouTubeUploader.tsx` includes manual transcript paste fallback. | **PARTIAL** (Works for videos with public CC; unverified with Supabase) | In-memory response only; **NOT** saved to Supabase | Must save transcripts to `lecture_transcripts` and handle IP/caption blocks gracefully in Phase 13. |
| **Google Meet Ingestion** | Not implemented. | **NO** (Planned / Out of Scope) | None | Feasibility assessed below: manual recording upload recommended over live bot. |
| **Smart Notes Synthesizer** | `POST /synthesize/notes` in FastAPI with prompt templates. Defaults to `llama3.2:3b`. `SmartNotesWorkspace.tsx` in UI. | **PARTIAL** (Ollama endpoint 404s in tests and falls back to static string mock; notes saved to in-memory `NOTES_STORE`) | Temporary in-memory dictionary; **NOT** saved to Supabase | Must configure Ollama model (Qwen3 / `qwen2.5:3b`), handle errors, and persist notes to Supabase in Phase 08. |
| **AI Tutor Copilot (RAG)** | `POST /tutor/ask` and `POST /search/semantic` in FastAPI. `AiTutorDrawer.tsx` and `AiTutorView.tsx`. | **MOCK / SIMULATED** (Returns static mock responses when Ollama offline; naive string chunking) | None | Must ground in user's actual Supabase transcript segments with speaker/timestamp citations in Phase 09. |
| **Flashcard Studio (FSRS)** | 3D flip card deck with keyboard shortcuts (Spacebar, 1-4). `POST /generate/flashcards` returns static mock cards. | **MOCK / SIMULATED** (UI functional, generation uses mock data) | Local state / mock; **NOT** saved to Supabase | Must generate from lecture notes with Qwen3 and persist decks & mastery ratings in Supabase in Phase 10. |
| **Interactive Quizzes** | 5-question MCQ assessment with confetti celebration and instant rationales. `POST /generate/quiz` and `POST /quiz/submit`. | **MOCK / SIMULATED** (UI functional, generation uses mock data) | In-memory calculation; **NOT** saved to Supabase | Must generate from lecture notes with Qwen3 and persist submissions & scores in Supabase in Phase 10. |
| **PYQ Exam Intelligence** | `POST /pyq/upload`, `GET /pyq/papers`, `GET /pyq/weights`. UI displays bento bar and topic distribution. | **MOCK / SIMULATED** (Basic regex extraction, returns mock archive) | Mock data; **NOT** saved to Supabase | Must store custom exam papers and link questions to lecture topics in Supabase in Phase 11. |
| **Adaptive Study Planner** | 7-day calendar view with autofill and exam alerts. `GET /planner/schedule` and `POST /planner/autofill`. | **MOCK / SIMULATED** (Static mock calendar blocks) | Mock data; **NOT** saved to Supabase | Must persist study schedule blocks and deadlines in Supabase in Phase 12. |

---

## 3. Google Meet Ingestion Feasibility Assessment

The brief requested an assessment of Google Meet support:

### Technical Options
1. **Live Google Meet Bot (Headless Browser / OAuth Webhook)**:
   - *Architecture*: Spawns a headless browser instance (Puppeteer/Playwright) or third-party meeting bot (e.g. Recall.ai) that joins the call, requests permission to record, and streams audio to Whisper.
   - *Feasibility for Student Project*: **Very Low / Unfavorable**.
     - Requires server-grade compute and reliable outbound streaming bandwidth.
     - Google Meet actively blocks automated browser joins without human CAPTCHA intervention.
     - Institutional Google Workspace policies (university domains) typically restrict unauthorized external bots from joining lectures.
     - Third-party meeting bot APIs cost $0.50–$1.20 per meeting hour.
2. **Recorded Meet File & Transcript Upload (Recommended)**:
   - *Architecture*: Students download the Google Meet recording (`.mp4`) or the auto-generated Google Docs transcript created by Google Workspace / Gemini, and drop it directly into LectureLens.
   - *Feasibility for Student Project*: **High / Optimal**.
     - 100% reliable, zero recurring cost, no credential sharing or institutional admin restrictions.
     - The existing `faster-whisper` pipeline already supports `.mp4` and `.m4a` files seamlessly.
   - *Recommendation*: Support Google Meet via **Recorded Video & Transcript File Ingestion** in Phase 13. Exclude live headless bot integrations from the core scope.

---

## 4. Production Inference Dilemma: Local AI vs. Cloud Deployment

### The Core Conflict
In local development, the architecture relies on:
- FastAPI running on `localhost:8000`
- `faster-whisper` running locally on the student's CPU/GPU
- Ollama running locally on `localhost:11434` (`qwen2.5:3b` / `llama3.2:3b`)

When the React frontend is deployed to a public hosting provider (e.g. Netlify, Vercel, Cloudflare Pages at `https://lecturelens.app`):
1. **Mixed Content Security**: A secure HTTPS website cannot fetch `http://localhost:8000` or `http://127.0.0.1:8000`. Modern browsers block mixed content by default.
2. **Private Network Access (PNA)**: Chrome and Firefox enforce PNA restrictions that block public websites from querying local private loopback addresses without explicit preflight permissions.
3. **Multi-User Availability**: Other students accessing a public URL do not have FastAPI or Ollama running on their personal machines, resulting in immediate network failure.

### Deployment Options for Phase 17 Decision
- **Option A (Student-Run Local-First Web / Desktop App)**:
  - Frontend hosted locally or distributed via lightweight local launcher (`run.bat` / Docker / Electron / Tauri).
  - Uses Supabase as the cloud database for sync across student sessions.
  - Zero server hosting bills, 100% private.
- **Option B (Public Web with Cloud AI APIs)**:
  - Frontend on Netlify/Vercel, FastAPI backend on Render / Railway / Fly.io.
  - Faster-whisper replaced with Groq Whisper API (ultra-fast, $0.0018/min) or hosted faster-whisper container.
  - Local Ollama replaced with Groq API or Together AI running open-source Qwen / Llama 3 models with server-side environment variables.
  - Seamless for any student visiting the URL without local installation.
- **Option C (Hybrid Architecture with BYO Local Tunnel)**:
  - Public static frontend with a "Connection Settings" modal allowing power users to plug in a Cloudflare Tunnel URL (`https://xyz.trycloudflare.com`) pointing to their local FastAPI/Ollama stack.

*Formal selection will be finalized in Phase 17.*

---

## 5. Next Steps
- Transition to **Phase 08**: Implement real Smart Notes generation using local Ollama (Qwen3) and persist notes/highlights to Supabase PostgreSQL.
