# Phase 3: AI Notes Synthesizer & Lecture Workspace - Research

**Date:** 2026-09-28
**Status:** Complete

## Technical Architecture & Investigation

### 1. Local Ollama Integration (`localhost:11434`)
- **API Spec**: Ollama's `/api/generate` accepts `{ "model": "llama3.2:3b", "prompt": "...", "stream": false, "format": "json" }` or raw text generation.
- **Prompt Engineering Strategy**:
  - **Executive Summary Prompt**: Takes lecture transcript text, extracts 1-paragraph executive abstract, 3 high-level conceptual anchors, and timestamp markers.
  - **Structured Notes Prompt**: Generates hierarchical markdown notes with `##` and `###` headers, numbered sequential mechanism steps (e.g. CaMKII phosphorylation, AMPAR trafficking), and biophysical/mathematical equations in monospaced/LaTeX format (e.g. Goldman-Hodgkin-Katz differential).
  - **Key Concepts Prompt**: Extracts array of `{ term: string, definition: string, examRelevance: string }` cards.
- **FastAPI Bridge Integration**:
  - `POST /synthesize/notes` in `backend/main.py` forwards the prompt to `http://localhost:11434/api/generate` with a 15-second timeout. If Ollama is unreachable, returns structured fallback data or indicates fallback requirement.
  - `PUT /lectures/{id}/notes` stores modified notes and personal student margin annotations.

### 2. Client API & Offline Fallback Simulation
- In `src/services/api.ts`:
  - `synthesizeNotes(lectureId: string): Promise<StudyNotes>`
  - `saveLectureNotes(lectureId: string, notes: StudyNotes): Promise<void>`
  - When the FastAPI bridge or local Ollama is offline, `api.ts` simulates async generation (showing realistic progress stages) and returns comprehensive academic study notes based on the lecture title, maintaining seamless zero-block usability.

### 3. Dual-Column Apple HIG Workspace Layout
- Direct implementation of Google Stitch screen `840927a0efce4abc8d510d560c1d5994`:
  - **Sub-header Ribbon**: Breadcrumb trail (`LectureLens > Course > Lecture`), status pill (`Synced & Verified`, `Whisper-v3 Diarized`), lecture title, export suite, and Focus Mode toggle.
  - **Synchronized Audio Deck**: Play/pause toggle, ±10s jumps, timecode display (`04:18 / 52:30`), speaker chip, speed selector (`1.0x`, `1.25x`, `1.5x`, `2.0x`), volume slider, and 70-bar interactive waveform with scrub node.
  - **Left Column (42% width, ~5 of 12 cols)**: `DiarizedTranscriptViewer`
    - Live search input with real-time match counter ("3 matches") and instant term highlight.
    - Auto-scrolling toggle with status indicator.
    - Timestamped speaker cards (`Prof. Henderson`, `Student (Sarah Chen)`).
    - Active spoken line highlight with ambient glow and quick inline action toolbar (`Make Card`, `Ask AI`, `Highlight`, copy timestamp).
    - "Download Full VTT / TXT" export action.
  - **Right Column (58% width, ~7 of 12 cols)**: `SmartNotesWorkspace`
    - Tab navigation: `Executive Notes`, `Structured Notes & Derivations`, `Key Concepts (Takeaways)`, `Slide Artifacts`.
    - Highlighter palette: Teal, Lavender, Mint.
    - Inline Edit mode toggle (switch between rendered Markdown and editable Markdown textarea).
    - Section cards with LaTeX monospaced equations and numbered sequence steps.
    - Margin Notes placeholder with `⌘N` shortcut trigger.
  - **Docked Bottom Intelligence Strip**:
    - Floating pill with 24px backdrop blur highlighting exam relevance ("NMDA Mg²⁺ block mechanism appeared on 2022 & 2024 Midterms").
    - Quick actions to open AI Tutor or jump to Flashcards.

### 4. Component Wave Decomposition
- **Plan 03-01 (Wave 1)**: Local Ollama Synthesizer Service & Backend Endpoints (`backend/services/ollama.py`, `backend/main.py`).
- **Plan 03-02 (Wave 2)**: Workspace Client API, Audio Deck & Diarized Transcript Viewer (`src/services/api.ts`, `src/styles/workspace.css`, `AudioScrubDeck.tsx`, `DiarizedTranscriptViewer.tsx`).
- **Plan 03-03 (Wave 3)**: Smart Notes Tabs, Interactive Editing, Export Suite & App Integration (`ExecutiveNotesTab.tsx`, `StructuredNotesTab.tsx`, `KeyConceptsTab.tsx`, `SlideArtifactsTab.tsx`, `SmartNotesWorkspace.tsx`, `BottomIntelligenceDock.tsx`, `LectureWorkspaceView.tsx`, `src/App.tsx`).
