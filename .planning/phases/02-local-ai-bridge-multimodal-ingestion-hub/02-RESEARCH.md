# Phase 2: Local AI Bridge & Multimodal Ingestion Hub - Research

**Date:** 2026-09-28
**Phase:** 02-local-ai-bridge-multimodal-ingestion-hub
**Status:** Complete

---

## 1. Domain & Architecture Overview

Phase 2 builds the local Python FastAPI service running on `localhost:8000` alongside the multimodal client ingestion UI. This bridges local AI execution (speech-to-text transcription via `faster-whisper`, slide text extraction via `pypdf`, and YouTube caption retrieval via `youtube-transcript-api`) with the React client.

```
                    ┌────────────────────────────────────────────────────────┐
                    │            LectureLens React Client (5173)             │
                    │  ┌─────────────────────────┬─────────────────────────┐ │
                    │  │ Ingestion Hub View      │ Quick Upload Modal      │ │
                    │  │ [PDF | Audio | YT | TXT]│ [PDF | Audio | YT | TXT]│ │
                    │  └────────────┬────────────┴────────────┬────────────┘ │
                    │               │                         │              │
                    │               └───────────┬─────────────┘              │
                    │                           │                            │
                    │                   src/services/api.ts                  │
                    │         (Auto Fallback to Simulation if Offline)       │
                    └───────────────────────────┬────────────────────────────┘
                                                │ HTTP / REST
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │            Python FastAPI Service (8000)               │
                    │                  backend/main.py                       │
                    │  ┌────────────────────────┬──────────────────────────┐ │
                    │  │ GET  /health           │ Engine & status check    │ │
                    │  │ POST /ingest/pdf       │ pypdf text extraction    │ │
                    │  │ POST /ingest/audio     │ faster-whisper STT       │ │
                    │  │ POST /ingest/youtube   │ youtube-transcript-api   │ │
                    │  └────────────────────────┴──────────────────────────┘ │
                    └────────────────────────────────────────────────────────┘
```

---

## 2. Technical Component Deep-Dive

### A. FastAPI Bridge Server (`backend/main.py`)
- **Framework**: `fastapi>=0.115.0`, `uvicorn>=0.30.0`, `python-multipart>=0.0.9`.
- **CORS**: Must explicitly permit `http://localhost:5173` and `http://127.0.0.1:5173` with credentials and all methods.
- **Port**: Default `8000`.
- **Endpoints**:
  - `GET /health`: Returns `{ "status": "ok", "model": "llama3.2:3b", "whisperEngine": "faster-whisper (CTranslate2)", "version": "0.1.0" }`.
  - `POST /ingest/pdf`: Accepts `UploadFile` (multipart/form-data), reads with `pypdf.PdfReader`, iterates pages, extracts plain text with page demarcation (`--- Page N ---`), calculates page count and word count.
  - `POST /ingest/audio`: Accepts audio/video `UploadFile`, writes temporarily to scratch directory, runs `WhisperModel("base", device="cpu", compute_type="int8")`, and returns structured segments:
    ```json
    [
      { "id": "seg-1", "startSeconds": 0.0, "endSeconds": 4.5, "speaker": "Speaker 1", "text": "..." }
    ]
    ```
  - `POST /ingest/youtube`: Accepts JSON body `{ "url": "https://www.youtube.com/watch?v=..." }`, parses `v=` query parameter or `youtu.be/` slug, calls `YouTubeTranscriptApi.get_transcript(video_id)`, formats into timestamped segments. Handles `TranscriptsDisabled`, `NoTranscriptFound`, and `VideoUnavailable` gracefully with structured error message and `fallback_required: true`.

### B. Windows Environment Management (`setup.ps1` & `run.ps1`)
- Standard Windows developers may not have virtual environment tools pre-configured on PATH.
- `setup.ps1`:
  - Detects Python 3 (`python`, `py -3`, or searches AppData/Program Files).
  - Creates virtual environment `backend\venv`.
  - Upgrades `pip` and installs `requirements.txt`.
- `run.ps1`:
  - Activates `backend\venv`.
  - Launches `python -m uvicorn main:app --reload --port 8000`.

### C. Client API Service (`src/services/api.ts`)
- Provides clean, async functions:
  - `checkBackendHealth(): Promise<LocalAiHealth>`
  - `uploadPdf(file: File, courseCode: string): Promise<Lecture>`
  - `uploadAudio(file: File, courseCode: string, onProgress?: (percent: number) => void): Promise<Lecture>`
  - `fetchYouTubeTranscript(url: string, courseCode: string): Promise<Lecture>`
  - `submitManualTranscript(title: string, text: string, courseCode: string): Promise<Lecture>`
- **Offline Simulation Fallback**: If backend is offline or throws network error, simulates realistic progress callbacks (10% → 40% → 75% → 100%) and returns an academic lecture payload matching the uploaded metadata.

---

## 3. Plan Wave Breakdown

To maintain strict dependencies, high velocity, and clean validation:

- **Wave 1 — Plan 02-01: Python FastAPI Service & PDF Extractor**
  - Create `./backend/` directory with `requirements.txt`, `main.py`, `setup.ps1`, and `run.ps1`.
  - Implement `/health` and `/ingest/pdf` endpoints.
  - Test health ping and PDF extraction.

- **Wave 2 — Plan 02-02: `faster-whisper` Audio & YouTube Transcript Endpoints**
  - Implement `/ingest/audio` with `faster-whisper` base model and timestamped segment chunking.
  - Implement `/ingest/youtube` with `youtube-transcript-api` and caption error handlers.
  - Create backend test script to verify endpoint contracts.

- **Wave 3 — Plan 02-03: React Multimodal Ingestion Hub & Upload Modal**
  - Create `src/services/api.ts` with real-time endpoints and offline simulation fallback.
  - Create `PdfUploader.tsx`, `AudioUploader.tsx`, `YouTubeUploader.tsx`, and `ManualTranscriptEditor.tsx`.
  - Create `UploadLectureModal.tsx` and full-page `IngestionHubView.tsx`.
  - Wire into `Shell.tsx` and `App.tsx`, updating active lectures catalog in real time.

---

## 4. Verification Checkpoints

1. `curl http://localhost:8000/health` returns valid JSON with status "ok".
2. `POST /ingest/pdf` successfully extracts text from a test PDF.
3. `src/services/api.ts` connects seamlessly with both real FastAPI server and offline mock fallback.
4. `npm run build` passes with zero TypeScript errors.
5. Ingestion Hub and Upload Modal render with Google Stitch aesthetics and Poppins typography.
