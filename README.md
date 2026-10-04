# LectureLens 🎓

> **AI-Powered Lecture Assistant & Active Recall Study Suite**  
> Effortlessly transform uploaded lecture media into structured study notes, context-grounded tutor dialogues, spaced-repetition flashcards, and adaptive exam plans.

[![Live Production](https://img.shields.io/badge/Production-Live%20on%20Netlify-success?style=flat&logo=netlify)](https://lecturelens-app.netlify.app)
[![Vite](https://img.shields.io/badge/Vite-8.3-blueviolet?style=flat&logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud%20PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![Ollama](https://img.shields.io/badge/Ollama-Qwen3%3A0.6b-black?style=flat&logo=ollama)](https://ollama.com)

---

## 🌐 Live Production Deployment

- **Production Web Application**: **[`https://lecturelens-app.netlify.app`](https://lecturelens-app.netlify.app)**
- **API Status**: Compatible with Local AI Bridge (`localhost:8000`) or Cloudflare Quick Tunnel.

---

## 🏗️ Architecture & Deployment Topologies

LectureLens employs a **privacy-first, zero-subscription** architecture that decouples heavy AI inference from cloud hosting bills.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Netlify Static CDN (HTTPS)                      │
│   Production URL: https://lecturelens-app.netlify.app                  │
│   - Vite 8 compiled Single-Page Application (SPA)                      │
│   - Vendor code-splitting with manualChunks (<500kB per asset)         │
│   - Zero-config rewrite routing (/* /index.html 200)                   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
┌─────────────────────────────────┐ ┌────────────────────────────────────┐
│   Supabase Cloud (PostgreSQL)   │ │  Student Machine (On-Device AI)    │
│   - Multi-tenant student auth   │ │  - FastAPI Local Bridge (:8000)    │
│   - 36 Row-Level Security rules │ │  - faster-whisper CTranslate2 (CPU)│
│   - Notes, cards, and planners  │ │  - Ollama qwen3:0.6b (Local LLM)   │
│   - S3 Storage (lecture_media)  │ │  - Exact-origin CORS protection    │
└─────────────────────────────────┘ └────────────────────────────────────┘
```

### Supported Deployment Modes

1. **Mode A: Local-First MVP (Active / Default)**
   - **Frontend**: Hosted on Netlify CDN at [`https://lecturelens-app.netlify.app`](https://lecturelens-app.netlify.app).
   - **Database**: Cloud-hosted Supabase PostgreSQL with multi-tenant RLS isolation.
   - **AI Inference**: Runs directly on the student's personal computer via `faster-whisper` and local Ollama (`qwen3:0.6b`).
   - *Advantage*: Zero AI token costs, 100% student privacy, unlimited transcription.
   - *Limitation*: The student's local machine must be running `uvicorn backend.main:app` for AI features. A public visitor cannot reach another user's localhost.

2. **Mode C: Hybrid Quick Tunnel (Supported for Mobile/Remote Study)**
   - **Frontend**: Hosted on Netlify CDN.
   - **AI Bridge**: Exposed via Cloudflare Quick Tunnel (`cloudflared tunnel --url http://localhost:8000`).
   - *Advantage*: Enables mobile phone or remote library study while leveraging home desktop GPU/CPU power.

3. **Mode B: Hosted Cloud Backend (Future Enterprise Topology)**
   - Containerized FastAPI backend deployed to RunPod, Modal, or AWS with serverless GPU inference.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🎙️ **Multimodal Lecture Ingestion** | Upload audio recordings (`.mp3`, `.wav`, `.m4a`), PDF slide decks, YouTube videos (with automatic transcript fallback), or paste class notes. |
| 📝 **Smart Notes Workspace** | AI-generated executive summaries, categorized key concepts, formula derivations, and persistent inline student notes. |
| 🧑‍🏫 **Context-Grounded AI Tutor** | Conversational tutor strictly grounded in your lecture materials. Features verifiable `[MM:SS]` timestamp citations that seek audio playback on click. |
| 🧠 **Active Recall Studio** | 3D flip card runner powered by FSRS spaced repetition algorithms, keyboard shortcuts (<kbd>Space</kbd>, <kbd>1</kbd>-<kbd>4</kbd>, <kbd>Z</kbd>), and 5-question exam drills. |
| 📊 **PYQ Exam Intelligence** | Extract questions from university past-paper PDFs, assess pitfall rates and grading rubrics, and map questions to lecture timestamps. |
| 🗓️ **Adaptive Study Planner** | Interactive 7-day academic calendar with automatic revision block autofill to eliminate exam coverage deficits. |
| 📤 **Academic Multi-Format Exports** | 1-click downloads for Diarized Transcripts (`.txt`), Formatted Notes (`.md`), and Anki-compatible Decks (`.tsv`). |

---

## 🚀 Student Quick Start (3 Steps)

### 1. Install & Launch Ollama
```bash
# Pull the recommended compact reasoning model
ollama pull qwen3:0.6b
```

### 2. Launch Local AI Bridge
```bash
# Windows:
.\.venv\Scripts\Activate.ps1
python backend/main.py

# macOS / Linux:
source .venv/bin/activate
python backend/main.py
```

### 3. Open Web App
Open **[`https://lecturelens-app.netlify.app`](https://lecturelens-app.netlify.app)**, sign in, and verify the green "AI Connected" beacon in the header!

For detailed instructions, troubleshooting, and keyboard navigation cheatsheets, see the **[Student Quick Start Guide](docs/STUDENT_QUICK_START.md)**.

---

## 📚 Documentation Index

- **[Student Quick Start & Release Guide](docs/STUDENT_QUICK_START.md)**: Zero-to-hero setup, Cloudflare tunnel guide, keyboard shortcuts, and troubleshooting playbook.
- **[Production Architecture & Deployment Standards](docs/ARCHITECTURE_PRODUCTION.md)**: Technical specification of Modes A, B, and C, CORS boundaries, and secret hygiene.
- **[Disaster Recovery & Backup Runbook](docs/DISASTER_RECOVERY.md)**: Supabase PostgreSQL backup schedules, PITR realities, `pg_dump` commands, and storage restoration.
- **[Supabase Database Schema](supabase/schema.sql)**: 9 relational tables, 36 RLS security policies, and foreign key cascades.

---

## 🛠️ Technology Stack

- **Frontend Client**: React 18.3, TypeScript 5.5, Vite 8.3, Vanilla CSS & CSS Tokens (Apple HIG / Google Stitch), Lucide Icons, Canvas Confetti.
- **Backend Bridge**: Python 3.13, FastAPI 0.115, Uvicorn, Pydantic v2.
- **Speech-to-Text**: `faster-whisper` (CTranslate2 INT8 engine).
- **Language Model**: Ollama `qwen3:0.6b` (Local-First).
- **Authentication & Database**: Supabase Cloud (PostgreSQL 15 with Row-Level Security).
- **Hosting CDN**: Netlify Static Hosting.

---

## 📄 License

MIT License. Designed with Apple HIG elegance and Google Stitch design tokens for students worldwide.

# Lecture-Lens