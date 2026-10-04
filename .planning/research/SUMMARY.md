# Project Research Summary

**Project:** LectureLens
**Domain:** AI Educational Assistant & Multimodal Lecture Processing
**Researched:** 2026-09-28
**Confidence:** HIGH

## Executive Summary

LectureLens is an Apple-inspired AI study assistant engineered to convert heterogeneous lecture materials—PDF slides, spoken classroom recordings, written transcripts, and YouTube lectures—into structured study notes, executive summaries, interactive flashcards, and a grounded AI Tutor.

Based on domain research, the ideal architecture balances a zero-cost local AI pipeline (Ollama for LLM reasoning and `faster-whisper` for speech-to-text) with a modern React frontend and Supabase cloud persistence. This completely eliminates third-party API subscription costs for students while ensuring zero-data-leak privacy.

The highest risk areas are: (1) long audio processing timeouts between frontend and backend, (2) unstructured Ollama JSON outputs on smaller local models, and (3) visual style drift away from the high-fidelity Google Stitch designs. These risks are mitigated upfront through async status polling, structured prompt schemas, and establishing rigorous Apple HIG CSS tokens with global Poppins typography in Phase 1.

## Key Findings

### Recommended Stack

- **Frontend**: Vite + React 18+ with TypeScript, Vanilla CSS Modules with strict design tokens, `lucide-react` icons, Google Fonts `Poppins`.
- **Backend & Cloud**: Supabase for user authentication, PostgreSQL relational database, and storage buckets.
- **Local AI Bridge**: Python 3.10+ FastAPI server running on `http://127.0.0.1:8000` mediating `faster-whisper`, `pypdf`, `youtube-transcript-api`, and local `Ollama` (`http://localhost:11434`).

### Expected Features

**Must Have (Table Stakes for 3-Day MVP):**
- Modern Student Dashboard with quick upload and recent lectures.
- Multimodal Lecture Ingestion (PDF text extraction, recorded audio transcription via Whisper, YouTube link import with fallback).
- AI-Generated Executive Summary, Key Concepts, and Study Notes.
- Context-Grounded AI Tutor (interactive chat querying lecture content).
- Interactive 3D Flashcard Deck with spaced recall self-grading.

**Should Have (Phase 5 / v1.x):**
- Quiz & MCQ Assessment Generator with instant scoring.
- Synchronized Audio Scrubber with transcript jumping.

**Defer (v2+):**
- PYQ (Previous Year Question Paper) topic mapping and exam predictive indexing.
- Comprehensive Study Planner & Calendar scheduling.
- Real-time meeting bots (Google Meet/Zoom) and campus multi-user management.

### Architecture Approach

A decoupled 2-tier client architecture:
1. **Cloud Tier (Supabase)**: Handles auth sessions, lecture metadata storage, saved notes, and flashcard history.
2. **Local AI Engine (FastAPI)**: Heavy computational lifting running entirely on the student's machine, keeping models free, private, and decoupled from cloud hosting.

### Critical Pitfalls

1. **Transcription Latency**: Long audio files require clear progress feedback and async polling in FastAPI to prevent connection timeouts.
2. **Ollama JSON Parsing**: Small local models must use `format: "json"` and modular prompts to avoid truncated syntax errors.
3. **YouTube Caption Failures**: Always provide an automatic fallback to manual transcript paste or audio upload.
4. **Style Drift**: Establish CSS tokens from Google Stitch project `11893050174269724482` with universal Poppins font immediately in Phase 1.

## Implications for Roadmap

### Suggested Phase Structure

#### Phase 1: Foundation, Design System & Dashboard
- **Rationale**: Establishes the Apple HIG visual benchmark, sets up global Poppins typography, tokens, navigation shell, and mock lecture dataset.
- **Delivers**: Working React application shell with navigation, lecture library, stats cards, and connection health checker.
- **Avoids**: Pitfall 5 (Styling drift and font inconsistency).

#### Phase 2: Local AI Engine & Multimodal Ingestion Hub
- **Rationale**: Sets up the local Python FastAPI bridge and core ingestion pipelines before connecting them to study tools.
- **Delivers**: FastAPI server (`localhost:8000`), PDF extraction (`pypdf`), Whisper audio transcription (`faster-whisper`), and YouTube caption scraper with fallback.
- **Avoids**: Pitfall 1 (Audio timeout) and Pitfall 3 (YouTube caption blocking).

#### Phase 3: AI Notes Synthesizer & Lecture Workspace
- **Rationale**: Connects extracted transcripts to Ollama to generate high-yield study materials.
- **Delivers**: Multi-tab lecture view (Summary, Structured Notes, Key Concepts, Raw Transcript) with prompt-engineered Ollama generation.
- **Avoids**: Pitfall 2 (Ollama formatting breakdown).

#### Phase 4: Interactive AI Tutor & Flashcard Studio
- **Rationale**: Delivers the high-value active recall study features that make LectureLens a complete study assistant.
- **Delivers**: RAG-grounded AI Tutor chat panel and 3D interactive flashcards with spaced repetition ratings.
- **Addresses**: Core student value proposition.

#### Phase 5: Supabase Persistence, Assessment Center & Polish
- **Rationale**: Connects the working local app to Supabase (Auth, DB, Storage), adds MCQ quiz generation, and executes end-to-end testing.
- **Delivers**: Persistent cloud storage, quiz generator, export tools, and responsive polish.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Tested tools (`faster-whisper`, `ollama`, `fastapi`, `vite`). |
| Features | HIGH | Aligned with user's 3-day timeline and Stitch designs. |
| Architecture | HIGH | Clear decoupling between React, Supabase, and local AI bridge. |
| Pitfalls | HIGH | Specific mitigations identified for audio latency and LLM formatting. |

**Overall Confidence:** HIGH

---
*Research completed: 2026-09-28*
*Ready for roadmap: yes*
