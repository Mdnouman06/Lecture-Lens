# Phase 2: Local AI Bridge & Multimodal Ingestion Hub - Discussion Log

**Date:** 2026-09-28
**Command:** `/gsd-discuss-phase 2`

## Key Questions & Decisions

### 1. Python FastAPI Backend Structure
- **Question:** Where should the Python FastAPI backend and virtual environment live?
- **Decision:** Dedicated `./backend` directory with `main.py`, `requirements.txt`, and PowerShell launch scripts (`setup.ps1`, `run.ps1`). Isolates Python ML libraries and virtual environment from the frontend client workspace.

### 2. Speech-to-Text Model & Acceleration
- **Question:** Which default faster-whisper model and quantization should we configure for speech-to-text?
- **Decision:** `'base'` model with `int8` CPU compute. Fast download (~145MB), low RAM footprint, ~4x real-time transcription speed on standard laptops with CUDA auto-detection when an NVIDIA GPU is present.

### 3. Ingestion Interface Presentation in UI
- **Question:** How should the Multimodal Ingestion interface be presented in the UI?
- **Decision:** Dual access: A dedicated full-page Ingestion Hub in the sidebar rail (`ingest` view) AND a quick `+ Upload Lecture` modal dialog accessible from the top header on any screen.

### 4. Handling Offline / Pending Local Python Backend
- **Question:** How should Lecture Ingestion handle offline or pending local Python backend states?
- **Decision:** Full local AI pipelines (`pypdf`, `faster-whisper`, `youtube-transcript-api`) via FastAPI on `localhost:8000`, paired with a seamless realistic simulation fallback if Python/Whisper is offline. This ensures student testing is never blocked during UI development.
