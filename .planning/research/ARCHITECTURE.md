# Architecture Research

**Domain:** AI Educational Assistant & Multimodal Lecture Processing
**Researched:** 2026-09-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Client Presentation Layer (React TS)                │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │ Dashboard & Nav   │  │ Lecture Workspace │  │ Flashcard & Tutor   │  │
│  │ (Stitch Poppins)  │  │ (Glassmorphic UI) │  │ (Interactive Panels)│  │
│  └─────────┬─────────┘  └─────────┬─────────┘  └──────────┬──────────┘  │
│            │                      │                       │             │
├────────────┴──────────────────────┴───────────────────────┴─────────────┤
│                         Service & API Integration                       │
├──────────────────────────────────────┬──────────────────────────────────┤
│           Cloud Service              │         Local Machine AI         │
│         Supabase Backend             │      FastAPI Local Bridge        │
│  ┌────────────────────────────────┐  │  ┌────────────────────────────┐  │
│  │ Supabase Auth (JWT / Session)  │  │  │ /transcribe (faster-whisper│  │
│  │ Supabase Postgres (Lectures)   │  │  │ /extract-pdf (pypdf)       │  │
│  │ Supabase Storage (PDF/Audio)   │  │  │ /generate-notes (Ollama)   │  │
│  │ Supabase DB (Flashcards/Notes) │  │  │ /tutor/chat (Ollama RAG)   │  │
│  └────────────────────────────────┘  │  └──────────────┬─────────────┘  │
└──────────────────────────────────────┴─────────────────┼────────────────┘
                                                         │
                                        ┌────────────────┴─────────────┐
                                        │ Local Ollama Service (11434) │
                                        │ (llama3.2 / mistral / phi3)  │
                                        └──────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| React Frontend | User experience, Apple-inspired Stitch layouts, audio player, study tools, client state | Vite + React + TypeScript + Vanilla CSS Modules with Poppins font |
| Supabase Auth & DB | Persistent user state, lecture metadata, generated notes, and flashcard records | Supabase JS Client (`@supabase/supabase-js`) |
| FastAPI Local Bridge | Hardware-accelerated ML workloads, file stream handling, subprocess mediation | Python 3.10+, FastAPI, Uvicorn on `http://127.0.0.1:8000` |
| `faster-whisper` Worker | Audio speech-to-text conversion with timestamps | CTranslate2 Whisper model loaded in memory |
| Ollama Daemon | Local LLM inference for summarization and tutor Q&A | Native Ollama server running on `http://localhost:11434` |

## Recommended Project Structure

```
Lecture Lens/
├── frontend/                     # React + TypeScript Client
│   ├── public/
│   ├── src/
│   │   ├── assets/               # Visual assets & icons
│   │   ├── components/           # Reusable UI components
│   │   │   ├── layout/           # Sidebar navigation, top header, glass cards
│   │   │   ├── dashboard/        # Stats, lecture cards, quick action bar
│   │   │   ├── ingest/           # PDF upload modal, audio dropzone, YouTube input
│   │   │   ├── lecture/          # Split-pane notes canvas, transcript scrubber
│   │   │   ├── tutor/            # AI tutor chat drawer
│   │   │   └── flashcards/       # 3D flip card viewer and deck controls
│   │   ├── services/             # API client services
│   │   │   ├── supabase.ts       # Supabase client initialization
│   │   │   ├── localAi.ts        # FastAPI bridge client (localhost:8000)
│   │   │   └── mockData.ts       # Offline/demo mock fallback state
│   │   ├── styles/               # Apple-inspired CSS system
│   │   │   ├── tokens.css        # Colors, radii, typography (Poppins), shadows
│   │   │   └── global.css        # Base resets and animations
│   │   ├── types/                # TypeScript interfaces (Lecture, Flashcard, Note)
│   │   ├── App.tsx               # Primary application shell & navigation
│   │   └── main.tsx              # Application entry point
│   ├── index.html                # Google Fonts (Poppins) link
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Local Python FastAPI AI Engine
│   ├── main.py                   # FastAPI app routes & CORS configuration
│   ├── requirements.txt          # Python dependencies
│   ├── services/
│   │   ├── whisper_service.py    # faster-whisper transcription pipeline
│   │   ├── pdf_service.py        # pypdf text extraction & cleaning
│   │   ├── youtube_service.py    # youtube-transcript-api integration
│   │   └── ollama_service.py     # Prompt engineering & Ollama HTTP client
│   └── utils/
│       └── chunker.py            # Long-text token chunker for LLM prompts
│
└── .planning/                    # GSD project context, roadmap & state
```

## Architectural Patterns

### Pattern 1: Decoupled Local AI Bridge

**What:** The React frontend makes REST requests to `localhost:8000` for computation-heavy AI tasks while using Supabase directly for standard CRUD operations and authentication.
**When to use:** In student apps where zero-cost local AI (Ollama + Whisper) is preferred, avoiding expensive cloud GPU hosting.
**Trade-offs:** Requires the user to run the Python backend and Ollama locally when processing lectures, but keeps runtime 100% free and private.

### Pattern 2: Multi-Stage Prompt Pipeline for Long Transcripts

**What:** A 1-hour lecture transcript often contains 8,000–12,000 words, exceeding small model single-shot limits. A chunker extracts key sections, summarizes iteratively, and consolidates into:
1. Executive Summary
2. Key Topics & Concepts
3. Flashcard Question/Answer pairs
**When to use:** All audio or PDF lecture conversions.
**Trade-offs:** Adds ~15–30 seconds of processing time, but guarantees high-quality, hallucination-free notes.

## Data Flow

### Lecture Processing Flow

```
[Student Uploads PDF or Audio]
             ↓
[React Frontend sends file to FastAPI (localhost:8000)]
             ↓
[FastAPI: Extract Text (pypdf) OR Transcribe (faster-whisper)]
             ↓
[FastAPI: Sends prompt + transcript to Ollama (localhost:11434)]
             ↓
[Ollama returns structured JSON: summary, notes, flashcards]
             ↓
[FastAPI returns clean payload to React]
             ↓
[React saves lecture + notes + cards to Supabase DB & displays in UI]
```

## Anti-Patterns

### Anti-Pattern 1: Heavy AI Inference in Frontend Main Thread

**What people do:** Attempting to run Whisper or small WebLLM in the browser tab.
**Why it's wrong:** Freezes UI animations, exhausts browser memory on low-spec laptops, fails on large files.
**Do this instead:** Delegate to background Python FastAPI process with clean HTTP status responses.

### Anti-Pattern 2: Tightly Coupling Cloud Web Hosting to Local Ports

**What people do:** Hardcoding `localhost:8000` in production web builds without fallback or status checks.
**Why it's wrong:** Breaks completely when viewed on mobile or deployed to Netlify/Vercel.
**Do this instead:** Provide a connection status badge (`● Local AI Engine Connected / Disconnected`) with clear setup instructions and graceful mock demonstration modes.

---
*Architecture research for: LectureLens AI Study Assistant*
*Researched: 2026-09-28*
