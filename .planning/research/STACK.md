# Stack Research

**Domain:** AI Educational Assistant & Multimodal Lecture Processing
**Researched:** 2026-09-28
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vite + React | React 18.3+ / Vite 5+ | Frontend Client Application | Instant HMR, minimal build overhead, robust TypeScript ecosystem, beginner-friendly setup. |
| TypeScript | 5.5+ | Static Typing | Prevents runtime schema mismatch bugs between frontend, Supabase, and local AI endpoints. |
| Vanilla CSS & CSS Tokens | Modern CSS3 | Visual Presentation & Apple HIG Design | Full control over Apple-grade glassmorphism (`backdrop-filter`), precise Poppins typography, and Stitch token alignment without heavy Tailwind configuration. |
| Supabase (`@supabase/supabase-js`) | 2.45+ | Auth, Database & File Storage | Free-tier PostgreSQL with built-in JWT authentication and S3-compatible file storage for lecture PDFs and slides. |
| Python FastAPI + Uvicorn | FastAPI 0.115+ | Local AI Bridge API | High-performance async REST framework isolating heavy ML pipelines on `localhost:8000` from the browser. |
| `faster-whisper` | 1.0+ | Speech-to-Text Transcription | CTranslate2-based Whisper engine: up to 4x faster than vanilla OpenAI Whisper, lower RAM/VRAM consumption, excellent accuracy on lecture audio. |
| Ollama | 0.3+ | Local LLM Inference Engine | Standard local LLM server (`localhost:11434`), supports state-of-the-art compact models (`llama3.2:3b`, `mistral:7b`, `phi3:mini`) with zero API token cost and total privacy. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pypdf` | 5.0+ | PDF Text Extraction | Extracting text streams from student lecture slide decks and reading materials in FastAPI. |
| `youtube-transcript-api` | 0.6+ | Automated YouTube Transcripts | Fetching official or auto-generated captions from lecture video URLs in Python. |
| `lucide-react` | 0.440+ | UI Icons | Apple-style clean stroke icons matching the Stitch visual specification. |
| `canvas-confetti` | 1.9+ | Quiz/Flashcard Gamification | Celebratory feedback on quiz completions and flashcard study sessions. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite Dev Server | Frontend development on `http://localhost:5173` | Configured with simple proxy or CORS support. |
| Uvicorn CLI | FastAPI dev server on `http://localhost:8000` | Run with `--reload` for instant Python updates. |
| Ollama CLI | Model pull and server management | Run `ollama serve` and `ollama pull llama3.2:3b`. |
| Git & GitHub | Version control and milestone releases | Feature branches, atomic GSD commits, remote backup. |

## Installation

```bash
# Frontend (Client)
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @supabase/supabase-js lucide-react canvas-confetti
npm install -D @types/canvas-confetti

# Local AI Backend (Python)
cd backend
python -m venv venv
# Windows activate: .\venv\Scripts\Activate.ps1
pip install fastapi uvicorn faster-whisper pypdf youtube-transcript-api requests python-multipart
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `faster-whisper` | OpenAI Whisper API | When user has no local GPU/CPU headroom and is willing to pay API costs per minute. |
| Local Ollama | OpenAI / Claude API | When deploying a production multi-tenant web app without asking users to run local processes. |
| FastAPI Bridge | Direct browser Ollama fetch | Direct fetch fails for binary audio files (Whisper) and lacks PDF parsing utilities. |
| Vanilla CSS Tokens | Tailwind CSS | Tailwind is great for rapid utility scaffolding, but user requested Vanilla CSS and exact Stitch Poppins fidelity. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| In-browser Whisper WASM (Transformers.js) | Downloading 200MB–1GB model into browser tab causes out-of-memory crashes and freezing on laptops. | Local Python `faster-whisper` via FastAPI. |
| Selenium / Puppeteer for YouTube | Heavy, fragile, easily blocked by Google bot detection. | `youtube-transcript-api` with manual transcript paste fallback. |
| SQLite client in React frontend | Browsers cannot write directly to local SQLite files without complex OPFS or Electron wrappers. | Supabase PostgreSQL or local REST API. |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `faster-whisper@1.0.3` | Python 3.9 - 3.12 | Uses CTranslate2; prebuilt wheels available on Windows. |
| `pypdf@5.0+` | Python 3.8+ | Native pure-Python, zero external C library dependencies. |
| `@supabase/supabase-js@2.x` | React 18 & 19 | Standard isomorphic client. |

## Sources

- Fast Whisper GitHub & CTranslate2 documentation
- Ollama API specifications (`/api/generate`, `/api/chat`)
- Supabase JavaScript Client Reference
- Google Stitch Design System `projects/11893050174269724482`

---
*Stack research for: LectureLens AI Study Assistant*
*Researched: 2026-09-28*
