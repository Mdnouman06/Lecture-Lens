# Phase 08 Context: Smart Notes Generation with Local Ollama & Supabase Persistence

**Phase:** 08 — Smart Notes Generation with Local Ollama & Supabase Persistence  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [NOTES-01, NOTES-02, NOTES-03, NOTES-04, NOTES-05, NOTES-06]  

---

## 1. Objective

Connect the verified audio/transcript ingestion pipeline to a local Ollama instance running Qwen3 (`qwen2.5:3b`), replacing the static mock notes and in-memory Python dictionary with:
1. Real LLM-generated executive summaries, structured Markdown notes with formulas, and key concepts.
2. Immediate persistence in Supabase PostgreSQL (`lecture_notes` table) tied to the authenticated student's `user_id`.
3. Support for inline student markdown edits, margin notes, and highlights that survive browser reloads.
4. Clear diagnostic error messaging when Ollama or the model is missing, eliminating fake mock data.

---

## 2. Architecture & Data Flow

```
[Student in Workspace]
       │
       ▼ (Clicks "Generate Notes")
[Frontend: LectureWorkspaceView.tsx]
       │
       ▼ (Calls POST /synthesize/notes with lectureId, title, courseCode, transcript)
[FastAPI: backend/main.py & services/ollama.py]
       │
       ▼ (Queries localhost:11434 with Qwen3 prompt templates)
[Local Ollama: qwen2.5:3b / qwen3]
       │
       ▼ (Returns structured JSON & markdown)
[Frontend receives Note payload]
       │
       ▼ (Persists directly to Supabase via lectures.ts)
[Supabase: public.lecture_notes (RLS: auth.uid() = user_id)]
       │
       ▼
[SmartNotesWorkspace renders real summary, concepts, notes, and allows inline editing]
```

---

## 3. Key Decisions

1. **Model Selection**: Default to `qwen2.5:3b` via environment variable `OLLAMA_MODEL` (fallback to `llama3.2:3b` or `phi3:mini`). Qwen 2.5/3 offers superior structured markdown formatting, mathematical formula representation, and JSON extraction in compact 3B parameters.
2. **Persistence Target**: Notes must be stored in Supabase PostgreSQL (`public.lecture_notes`), not in Python in-memory dictionaries. This guarantees persistence across backend restarts and devices.
3. **No Fake Fallbacks**: If Ollama daemon is offline or the model is missing, return clean HTTP 503 / 404 errors with guidance (e.g. `ollama pull qwen2.5:3b`) instead of silently injecting fake neurobiology notes for an unrelated lecture.
4. **Offline / Guest Mode Grace**: If a student is not signed in to Supabase (guest mode), notes are temporarily cached in `localStorage` with a prompt to sign in.

---

## 4. Work Breakdown (Plans)

- **08-01-PLAN**: Backend Ollama Qwen3 Synthesis & Error Diagnostics (FastAPI + `services/ollama.py` + tests).
- **08-02-PLAN**: Supabase `lecture_notes` Schema & Database Service Layer (`src/services/lectures.ts` + `api.ts`).
- **08-03-PLAN**: Frontend Notes Workspace Integration, Inline Editing & Persistence (`SmartNotesWorkspace.tsx` + `LectureWorkspaceView.tsx`).
