# Phase 13 Context: Multimodal Ingestion: PDFs, YouTube & Google Meet Feasibility

**Phase:** 13 — Multimodal Ingestion: PDFs, YouTube & Google Meet Feasibility  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [INGEST-01, INGEST-03, INGEST-04, INGEST-06, INGEST-07, INGEST-08]  

---

## 1. Objective

Deliver a complete, production-grade multimodal ingestion pipeline that expands LectureLens beyond standalone audio files into full multi-format lecture media:
1. **PDF Slide Deck & Handout Ingestion (`INGEST-01`, `INGEST-06`)**: Extract clean structured slide text and page counts using backend `pypdf`, chunk slides cleanly, and persist both lecture metadata (`page_count`) and initial structured slide notes into Supabase PostgreSQL (`public.lectures` and `public.lecture_notes`).
2. **YouTube Lecture URL Ingestion (`INGEST-03`, `INGEST-07`)**: Query official and auto-generated YouTube captions via `youtube-transcript-api`, parse timestamped segments, and persist segments to Supabase `public.lecture_transcripts` under user ownership.
3. **Instant Manual Transcript Fallback (`INGEST-04`)**: Provide seamless 1-click fallback from failed YouTube captions or silent audio files directly into `ManualTranscriptEditor`, pre-filling video titles and source references with automatic paragraph chunking and estimated timecodes.
4. **Google Meet & Conference Recording Support (`INGEST-08`)**: Formalize and document the university Google Meet workflow (download `.mp4`/`.m4a` from Google Drive, transcribe via `faster-whisper` CTranslate2 pipeline, or paste Google Docs meeting captions), complete with in-app workflow guide and supported format badges.

---

## 2. Architecture & Data Flow

```
[Student selects ingestion tab in IngestionHubView or UploadLectureModal]
       │
       ├──► [PDF Slides Tab]
       │       │
       │       ▼ (POST /ingest/pdf via FormData)
       │    [FastAPI: pypdf extracts pages, cleans whitespace, formats slide markdown]
       │       │
       │       ▼ (Returns id, title, pageCount, wordCount, slides, text)
       │    [createUserLecture in src/services/lectures.ts]
       │       │
       │       ├──► Inserts to public.lectures (page_count, source_type: 'pdf')
       │       └──► Inserts to public.lecture_notes (structured slide markdown & summary)
       │
       ├──► [YouTube URL Tab]
       │       │
       │       ▼ (POST /ingest/youtube with URL & courseCode)
       │    [FastAPI: services/youtube.py extracts video ID & queries youtube-transcript-api]
       │       │
       │       ├── If captions found:
       │       │     ▼ (Returns segments, durationSeconds, wordCount)
       │       │   [createUserLecture in src/services/lectures.ts]
       │       │     ├──► Inserts to public.lectures (source_type: 'youtube')
       │       │     └──► Batch inserts segments to public.lecture_transcripts
       │       │
       │       └── If captions disabled / unavailable:
       │             ▼ (Returns fallbackRequired: true)
       │           [YouTubeUploader prompts "Paste Transcript" -> switches to Manual Editor]
       │
       ├──► [Manual Transcript Tab]
       │       │
       │       ▼ (POST /ingest/manual with title, text, courseCode)
       │    [FastAPI: chunks text into ~150 wpm segments with interpolated timestamps]
       │       │
       │       ▼ (createUserLecture -> public.lectures & public.lecture_transcripts)
       │
       └──► [Google Meet & Zoom Video Tab (.mp4, .m4a)]
               │
               ▼ (POST /ingest/audio -> faster-whisper CTranslate2)
            [Transcribes speech with timestamped segments -> persists to Supabase]
            [In-App Guide in UI explains Google Drive export -> upload steps]
```

---

## 3. Key Decisions

1. **PDF Slide Text Persistence to `lecture_notes` (`INGEST-06`)**:
   - When a student uploads a slide deck PDF, the primary content is slides rather than continuous spoken audio.
   - `createUserLecture` persists `page_count` to `public.lectures` and immediately generates an initial `lecture_notes` record in `public.lecture_notes` formatted by slides (e.g. `## Slide 1: Introduction...`). This guarantees that opening the lecture in Smart Notes Workspace (`SmartNotesWorkspace.tsx`) immediately displays the extracted slide notes from Supabase without requiring external cloud re-extraction.
2. **YouTube Captions to `lecture_transcripts` (`INGEST-07`)**:
   - `youtube-transcript-api` segments (`start`, `duration`, `text`) are normalized to `start_seconds`, `end_seconds`, `speaker: "Speaker"`, and `segment_index`.
   - `createUserLecture` batch inserts these segments into Supabase `public.lecture_transcripts`, making them instantly queryable by the Diarized Transcript Viewer and the Grounded AI Tutor Copilot.
3. **Resilient Caption Fallback UX (`INGEST-04`)**:
   - Videos with disabled captions or anti-bot blocks return `fallbackRequired: true`.
   - The UI displays an amber advisory banner with a prominent "Paste Transcript" action that seamlessly switches to `ManualTranscriptEditor`, passing the video title and URL so students never encounter dead ends.
4. **Google Meet Feasibility Execution (`INGEST-08`)**:
   - Rather than fragile, CAPTCHA-blocked headless bots that fail on institutional SSO logins, Google Meet is supported via the robust recorded media pipeline (`.mp4` / `.m4a` exports from Google Drive) and transcript paste from Google Docs.
   - An interactive "Google Meet Ingestion Guide" is integrated directly into `IngestionHubView.tsx` and `AudioUploader.tsx` with clear 3-step visual instructions.

---

## 4. Work Breakdown (Plans)

- **13-01-PLAN**: Backend Multimodal Ingestion Endpoints & Unit Tests (`backend/main.py`, `backend/services/youtube.py`, `backend/test_api.py`).
- **13-02-PLAN**: Supabase Multimodal Persistence Layer & Ingestion API Bridge (`src/types/lecture.ts`, `src/services/lectures.ts`, `src/services/api.ts`).
- **13-03-PLAN**: Interactive Ingestion Hub UI, YouTube Fallback & Google Meet Workflow (`src/views/IngestionHubView.tsx`, `src/components/ingestion/`, `src/styles/ingestion.css`).
