# Phase 2: Local AI Bridge & Multimodal Ingestion Hub - Context

**Gathered:** 2026-09-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the local Python FastAPI service (`localhost:8000`) and the multimodal ingestion UI supporting PDF slide extraction, audio transcription via `faster-whisper`, YouTube caption importing via `youtube-transcript-api`, and a direct transcript editor with manual fallback.

Deliverables:
- Dedicated Python FastAPI service in `./backend/` with `main.py`, `requirements.txt`, and PowerShell setup/run scripts (`setup.ps1`, `run.ps1`).
- Backend endpoints:
  - `GET /health`: Engine status, model details (`llama3.2:3b`), speech engine (`faster-whisper`), and latency.
  - `POST /ingest/pdf`: PDF text extraction from lecture slide decks and handouts using `pypdf`.
  - `POST /ingest/audio`: Audio/video speech-to-text transcription using `faster-whisper` with timestamped segments.
  - `POST /ingest/youtube`: Automated and manual YouTube caption retrieval using `youtube-transcript-api`.
- Frontend Multimodal Ingestion Hub in React:
  - Full-page Ingestion Hub view (`ingest` in sidebar navigation rail).
  - Quick `+ Upload Lecture` modal dialog accessible from the top header on any screen.
  - 4 input modes: PDF Slides, Audio/Video File, YouTube URL, and Manual Transcript Fallback.
  - Animated progress states (upload, transcription, vector indexing).
  - Seamless realistic simulation fallback when the local Python backend is offline.
  - Auto-persistence into active lecture state and dashboard catalog.

</domain>

<decisions>
## Implementation Decisions

### Backend Architecture & Setup Scripts
- **D-01:** Place the local AI bridge in a dedicated `./backend/` directory with `requirements.txt`, `main.py`, and Windows PowerShell helper scripts (`setup.ps1` to create venv & install packages, `run.ps1` to launch uvicorn on port 8000). — **Reversibility:** costly — establishes repository structure for all subsequent local AI features.
- **D-02:** Configure CORS in FastAPI with `allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`.

### Speech-to-Text & Model Architecture
- **D-03:** Use `faster-whisper` with the `base` model and `int8` CPU quantization by default (~145MB download, low RAM consumption, ~4x real-time speed on consumer CPUs). Enable CUDA auto-detection if an NVIDIA GPU is present. — **Reversibility:** reversible — model name and compute type are parameterized in backend config.
- **D-04:** Stream or return structured timestamped segments: `[{ id, startSeconds, endSeconds, speaker, text }]` matching our TypeScript `TranscriptSegment` type.

### YouTube Caption Extraction & Fallback
- **D-05:** Use `youtube-transcript-api` to fetch auto-generated or creator-provided transcripts by video ID.
- **D-06:** If YouTube captions are disabled or unavailable, immediately present the student with the Direct Transcript Editor tab pre-populated with video metadata and a clear message inviting them to paste notes or transcript text.

### Ingestion UI & Experience
- **D-07:** Implement dual access: A dedicated full-page Ingestion Hub view (`ingest` in the sidebar) and an accessible `+ Upload Lecture` modal dialog triggered from the header across all views.
- **D-08:** Support 4 distinct tabs matching Stitch design:
  1. `PDF Slides & Handouts` (drag-and-drop dropzone, page count, slide extraction).
  2. `Audio / Video Recording` (MP3, WAV, M4A, MP4 upload with animated transcription progress bar).
  3. `YouTube Lecture URL` (URL input, video thumbnail preview, caption fetch button).
  4. `Manual Transcript / Notes` (clean rich-text textarea with word count and format cleanup).
- **D-09:** **Interactive Demo Fallback**: When `http://localhost:8000/health` is offline or unreachable, the frontend seamlessly executes realistic simulated ingestion with progress steps (Uploading 0-100%, Transcribing audio segments, Vectorizing concepts) using rich academic mock templates, so student testing is never blocked by environment setup.
- **D-10:** Once processed, the newly ingested lecture is immediately appended to client state, shows a celebratory toast notification, and provides a direct CTA to "Open Smart Notes in Workspace".

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual Design System & Stitch Specs
- `Stitch Screen 402b1ce7bbd84b36bd262a1f528d857b` — "Lecture Library & Management — LectureLens"
- `Stitch Screen d9c68082013048039fecbeedb5afeb83` — "Dashboard — LectureLens Student Workspace"
- `.planning/research/STACK.md` — FastAPI, faster-whisper, pypdf, and youtube-transcript-api specs
- `.planning/research/PITFALLS.md` — Handling YouTube bot detection, Whisper WASM freezing avoidance, and non-blocking health checks

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/lecture.ts`: `Lecture`, `KeyConcept`, `TranscriptSegment`, `Flashcard` domain models.
- `src/types/navigation.ts`: `ActiveView`, `LocalAiHealth`.
- `src/components/common/GlassCard.tsx`: Reusable Apple HIG card container.
- `src/styles/tokens.css` & `src/styles/global.css`: Stitch tokens, Poppins typography, and glassmorphic utilities.
- `src/components/layout/Shell.tsx`: Coordinates layout and active view switching.

### Integration Points
- `src/components/layout/Header.tsx`: Connects `+ Upload Lecture` button to open the Ingestion modal or navigate to `ingest`.
- `src/components/dashboard/RecentLectures.tsx`: Dropzone bar clicks trigger ingestion.
- `src/App.tsx`: Central state management where newly ingested lectures are added to `lectures` state.

</code_context>

<specifics>
## Specific Ideas

- Real-time progress bar with animated phase steps: "Uploading Media" → "Running Whisper STT" → "Chunking & Structuring" → "Ready".
- Dropzone hover highlighting with Apple spring transition and subtle indigo border glow.
- Quick metadata fields for uploaded lectures: Course selection dropdown (CS 106B, NEURO 301, PHYS 402, ECON 201, or New Course), lecture title, and date.

</specifics>

<deferred>
## Deferred Ideas

- Direct browser-based mic audio recording (deferred to v2).
- Google Drive / OneDrive cloud lecture import (deferred to v2).

</deferred>

---

*Phase: 2-Local AI Bridge & Multimodal Ingestion Hub*
*Context gathered: 2026-09-28*
