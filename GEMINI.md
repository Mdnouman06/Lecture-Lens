<!-- GSD:project-start source:PROJECT.md -->

## Project

**LectureLens**

LectureLens is an AI-powered study assistant for students that converts lecture materials (PDFs, recorded audio, transcripts, and YouTube links) into organized notes, executive summaries, interactive quizzes, flashcards, and personalized study resources. Designed with a clean, Apple-inspired interface, it helps students understand and retain complex educational material with minimal cognitive friction.

**Core Value:** Effortlessly transform uploaded lecture media (documents or recordings) into accurate, structured study notes and an interactive AI tutor that answers questions grounded directly in the student's lecture materials.

### Constraints

- **Tech Stack (Frontend)**: React with TypeScript and modern component CSS (Vite build system).
- **Tech Stack (Backend & DB)**: Supabase for authentication, relational metadata database, and lecture file storage.
- **Tech Stack (Local AI)**: Lightweight Python FastAPI backend running locally on `localhost:8000` to interface with Ollama (LLM) and faster-whisper (transcription).
- **Timeline**: 3-day MVP target (~6 hours/day, total ~18 hours) with strict prioritization on complete, usable core workflows over unfinished complexity.
- **Typography**: Poppins font applied globally across all UI elements.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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

# Frontend (Client)

# Local AI Backend (Python)

# Windows activate: .\venv\Scripts\Activate.ps1

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

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
