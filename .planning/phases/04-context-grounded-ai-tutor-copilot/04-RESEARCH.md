# Phase 4: Context-Grounded AI Tutor Copilot - Research

**Date:** 2026-09-28
**Status:** Complete

## 1. Domain & Architectural Analysis

### Requirements Coverage
- **`TUTOR-01`**: User can open an interactive AI Tutor chat panel directly alongside the lecture notes.
- **`TUTOR-02`**: User can ask questions in natural language and receive answers strictly grounded in the uploaded lecture material (RAG Q&A).
- **`TUTOR-03`**: User can click pre-generated quick prompt chips (e.g. "Summarize main argument", "Explain key formula", "Give a real-world example") for instant answers.
- **`TUTOR-04`**: User receives citation snippets or timestamp references showing where in the lecture the answer originates.

### Stitch Design Blueprint
- Google Stitch screen `projects/11893050174269724482/screens/94b81da265c04d268fbca4274f1ce534` (*"AI Tutor & Smart Search — LectureLens"*, Width: 2560px, Height: 3034px).
- Dual presentation pattern:
  1. **In-Context Drawer**: Slide-over panel alongside notes inside `LectureWorkspaceView` with zero context-switching friction.
  2. **Dedicated Workspace**: Full-screen view with knowledge scoping, query history, vector corpus metrics, and deep semantic search mode.

---

## 2. Technical Decisions & Patterns

### 2.1 Backend Hybrid RAG & Grounded Prompts
- **FastAPI Endpoints**:
  - `POST /tutor/ask`: Accepts question, lectureId, scope flags. Retrieves relevant transcript segments and structured notes, constructs grounded prompt, queries local Ollama (`localhost:11434`), and returns structured answer, citations, sequence steps, and PYQ warnings.
  - `POST /search/semantic`: Accepts query and scope, searches across indexed lecture transcripts, summaries, and note headings.
- **Prompt Engineering**:
  - `TUTOR_RAG_PROMPT` enforces:
    - Zero hallucination (strict adherence to provided lecture context).
    - Structured biological/mathematical breakdown into numbered sequential steps.
    - Explicit timestamped citation extraction.
    - Exam-yield warning callouts.

### 2.2 Client API & Realistic Simulation Fallback
- `src/services/api.ts` provides:
  - `askAiTutor(request: TutorQuestionRequest): Promise<TutorResponse>`
  - `searchLectureCorpus(query: string, scope?: KnowledgeScope): Promise<SearchResult[]>`
- Rich offline simulation for student questions:
  - Pre-engineered responses for core lecture concepts (NMDA coincidence detection, CaMKII activation, AMPA receptor trafficking, Hebbian plasticity).
  - Accurate multimodal citations with start/end second timecodes (`04:12 - 04:58`).
  - High-Yield Past Exam Alert (PYQ callout for 2023 Midterm Question 3B).
  - Dynamic fallback for freeform queries with simulated streaming latency.

### 2.3 Interactive Audio & Transcript Playback Seeking
- In `CitationCard.tsx`, clicking the primary CTA **"Listen (46s)"**:
  - Emits `onSeek(timeStart)` callback.
  - Updates the active playback time in `AudioScrubDeck`.
  - Scrolls the `DiarizedTranscriptViewer` to the corresponding speaker segment.
  - Activates the ambient glow around the spoken line.

---

## 3. Plan Wave Breakdown

| Plan | Wave | Focus | Deliverables |
|---|---|---|---|
| **04-01-PLAN.md** | Wave 1 | Backend Tutor RAG & Client API | `backend/services/ollama.py`, `backend/main.py`, `src/types/lecture.ts`, `src/services/api.ts` |
| **04-02-PLAN.md** | Wave 2 | Core Tutor Components & Slide-over Drawer | `src/styles/tutor.css`, `CitationCard.tsx`, `TutorSynthesisBubble.tsx`, `TutorInputDeck.tsx`, `AiTutorDrawer.tsx`, `LectureWorkspaceView.tsx` integration |
| **04-03-PLAN.md** | Wave 3 | Full-Screen AI Tutor View & App Navigation | `KnowledgeScopeFilter.tsx`, `RecentQueriesList.tsx`, `VectorCorpusStatus.tsx`, `TutorDialogueStream.tsx`, `AiTutorView.tsx`, `App.tsx` routing, verification |
