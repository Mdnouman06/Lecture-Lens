# Phase 4: Context-Grounded AI Tutor Copilot - Context

**Gathered:** 2026-09-28
**Status:** Ready for UI contract and planning

<domain>
## Phase Boundary

Phase 4 delivers an interactive, context-grounded AI Tutor Copilot for **LectureLens**, directly modeled on Google Stitch screen `94b81da265c04d268fbca4274f1ce534` (*"AI Tutor & Smart Search — LectureLens"*). The AI Tutor operates with strict factual grounding against lecture audio transcripts, slide decks, structured notes, and past exam rubrics, providing instant cited answers and cross-semester semantic search.

Deliverables:
- **Backend AI Tutor & RAG Endpoints** in `./backend/`:
  - `POST /tutor/ask`: Queries local Ollama (`localhost:11434`) using a grounded RAG prompt feeding relevant transcript chunks and note sections, returning an answer with structured citation metadata (source, timecode, excerpt) and past exam warnings.
  - `POST /search/semantic`: Performs semantic keyword and topic matching across indexed lectures, transcripts, and notes.
- **Client API & Offline Simulation** in `src/services/api.ts`:
  - `askAiTutor(request: TutorQuestionRequest): Promise<TutorResponse>`
  - `searchLectureCorpus(query: string, scope?: KnowledgeScope): Promise<SearchResult[]>`
  - Realistic instant fallback simulation with simulated streaming latency so student queries are never blocked when Ollama or FastAPI is offline.
- **Slide-over AI Tutor Drawer** in `src/components/tutor/AiTutorDrawer.tsx`:
  - Embedded directly inside `LectureWorkspaceView` alongside lecture notes.
  - Opens on demand via header button, bottom intelligence dock ("Ask AI Tutor"), or transcript line action ("Ask AI").
  - Pre-seeded with active lecture context and selected transcript timestamps.
- **Dedicated AI Tutor & Semantic Search Hub View** in `src/views/AiTutorView.tsx`:
  - Full-screen dashboard accessible from the sidebar navigation (`activeView === 'tutor'`).
  - Top header: Neural Retrieval Engine status, breadcrumbs, mode toggle ("Tutor Dialogue Mode" vs "Deep Semantic Search").
  - Left panel (4 cols): Knowledge scope filter checkboxes, recent semantic queries history, vectorized source corpus status card (38 audio tracks, 2,410 pages, 1,536-d HNSW).
  - Right panel (8 cols): Interactive dialogue stream with conceptual synthesis bubbles, 3-step biological sequences, direct multimodal citation cards, high-yield past exam alerts (PYQ), follow-up action chips, and a bottom prompt input deck with shortcuts ("Derive formula", "Explain simply", "Find exam question").
- **Interactive Citation Playback Seeking**:
  - Clicking "Listen (XXs)" or timestamp pill jumps the audio scrubber to that timecode and highlights the transcript line in `LectureWorkspaceView`.
- **Exam Intelligence & Follow-up Actions**:
  - Highlights questions connected to previous year exams (PYQ alerts).
  - Quick action chips ("Generate 3 Flashcards on this", "Test me with a hard MCQ") to bridge seamlessly into Phase 5.

</domain>

<decisions>
## Implementation Decisions

### 1. Dual Access Experience
- **D-01:** Implement both access points:
  1. A contextual slide-over drawer (`AiTutorDrawer.tsx`) within `LectureWorkspaceView` for frictionless question-answering during lecture review.
  2. A dedicated full-page workspace (`AiTutorView.tsx`) wired to the sidebar navigation (`ai-tutor` route) matching Google Stitch screen `94b81da265c04d268fbca4274f1ce534`.

### 2. Context Grounding & Prompt Engineering (Hybrid RAG)
- **D-02:** Local Ollama is queried via `POST /tutor/ask` with a strict academic grounding prompt template:
  - Injects the top 3-5 relevant transcript/note segments as context.
  - Instructs the LLM to only answer based on provided lecture material and acknowledge when information falls outside the provided notes.
  - Extracts citations with `timeStart`, `timeEnd`, `speaker`, and `sourceTitle`.
- **D-03:** Built-in offline fallback in `src/services/api.ts` provides instant simulated answers for common lecture queries (e.g. NMDA coincidence detection, CaMKII activation, Hebbian plasticity, action potential formulas) complete with citations, PYQ alerts, and follow-up chips.

### 3. Interactive Multimodal Citations
- **D-04:** Every citation card includes:
  - Source type pill (`Lecture Audio`, `Textbook PDF`, `Slide Deck`, `PYQ Rubric`).
  - Audio timecode range (`04:12 - 04:58`) with a primary CTA button: "Listen (46s)".
  - Clicking "Listen" invokes the audio scrub deck at that timecode and centers the corresponding transcript line.
  - Secondary action: "Open Transcript" or "View Excerpt".

### 4. Rich Dialogue Visual Structure (Google Stitch Fidelity)
- **D-05:** AI response cards feature rich structured presentation:
  - Conceptual synthesis badge with discipline pill (`Cellular Neurobiology`) and latency pill (`Synthesized in 1.4s`).
  - Multi-part visual breakdown cards (e.g. 1. Presynaptic, 2. Postsynaptic, 3. Coincidence).
  - High-Yield Past Exam Alert (PYQ callout box: "Question 3B of 2023 Midterm - Average cohort score 68%").
  - Recommended Follow-ups chips (`Generate 3 Flashcards`, `Test me with a hard MCQ`, `Add to Midterm Review Sheet`).

### 5. Prompt Shortcuts & Input Deck
- **D-06:** Bottom input deck features:
  - Quick prompt shortcuts: "Derive formula", "Explain simply", "Find exam question", "Real-world analogy".
  - Model indicator pill ("Intelligence 2.5 High Reasoning").
  - Multi-line textarea with auto-focus and `Enter ↵` trigger (`Shift+Enter` for newline).
  - Clear session and export dialogue buttons.

</decisions>

<canonical_references>
## Canonical References & Artifacts

- **Google Stitch Screen:** `projects/11893050174269724482/screens/94b81da265c04d268fbca4274f1ce534` (*"AI Tutor & Smart Search — LectureLens"*)
- **Requirements:**
  - `TUTOR-01`: Interactive AI Tutor chat panel directly alongside lecture notes.
  - `TUTOR-02`: Natural language questions answered with strict lecture grounding (RAG Q&A).
  - `TUTOR-03`: Pre-generated quick prompt chips for one-click answers.
  - `TUTOR-04`: Direct citation snippets and timestamp references linked to lecture media.
- **Design Tokens:**
  - Universal Poppins font across all tutor interfaces.
  - Glassmorphic panels with `backdrop-filter: blur(20px)`.
  - Primary accent: Indigo `#4F46E5`, Tertiary: Mint `#005338`, Surface container hierarchy from `tokens.css`.
- **Lucide Icons**:
  - `Bot`, `Sparkles`, `Brain`, `MessageSquare`, `Send`, `Volume2`, `Play`, `FileText`, `CheckCircle2`, `AlertTriangle`, `BookmarkPlus`, `RotateCcw`, `Share2`, `Paperclip`, `Mic`.

</canonical_references>
