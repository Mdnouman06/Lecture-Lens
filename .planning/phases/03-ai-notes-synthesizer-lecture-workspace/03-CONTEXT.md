# Phase 3: AI Notes Synthesizer & Lecture Workspace - Context

**Gathered:** 2026-09-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect lecture transcripts and slides to local Ollama (`localhost:11434` / FastAPI bridge `localhost:8000`) to synthesize executive summaries, structured study notes with LaTeX formulas, and key concepts, and display them in a flagship dual-column Apple-inspired reading workspace matching Google Stitch screen `840927a0efce4abc8d510d560c1d5994`.

Deliverables:
- Backend AI Synthesizer endpoints in `./backend/`:
  - `POST /synthesize/notes`: Invokes local Ollama (`llama3.2:3b` or configured local model) with prompt-engineered templates for executive summaries, structured notes, and key concepts.
  - `PUT /lectures/{id}/notes`: Saves student edits, personal margin notes, and highlights.
- Dual-Column Flagship Reading Workspace in React (`src/views/LectureWorkspaceView.tsx`):
  - **Sub-header & Lecture Ribbon**: Breadcrumbs (`LectureLens > Course > Lecture`), status pill (`Whisper-v3 Diarized`), lecture title, export suite, and Focus Mode toggle.
  - **Synchronized Audio Deck**: Play/pause toggle, ±10s jumps, timecode display (`04:18 / 52:30`), speaker chip, speed selector (`1.0x`, `1.25x`, `1.5x`, `2.0x`), volume slider, and 70-bar interactive audio waveform with draggable playhead scrub node.
  - **Left Column (42% width) — Live Diarized Transcript Viewer**:
    - Live search input with real-time match counter ("3 matches") and term highlighting.
    - Auto-scrolling toggle.
    - Timestamped speaker cards (`Prof. Henderson`, `Student (Sarah Chen)`).
    - Active spoken line highlight with ambient glow and quick inline action toolbar (`Make Card`, `Ask AI`, `Highlight`, copy timestamp).
    - "Download Full VTT / TXT" export action.
  - **Right Column (58% width) — AI Smart Notes & Synthesis**:
    - Segmented tabs: `Executive Notes`, `Structured Notes & Derivations`, `Key Concepts (Takeaways)`, and `Slide Artifacts`.
    - Mathematical equation callouts and multi-step numbered sequences.
    - Inline edit mode toggle (student can edit notes directly).
    - Color highlighter palette (Teal, Lavender, Mint).
    - Margin notes block (`⌘N` hotkey).
  - **Docked Bottom Intelligence Strip**: High exam relevance alert ("NMDA Mg²⁺ block appeared on 2022 & 2024 Midterms").
- Client API & Offline Fallback in `src/services/api.ts`:
  - `synthesizeNotes(lectureId: string): Promise<LectureNotes>`
  - `saveLectureNotes(lectureId: string, notes: LectureNotes): Promise<void>`
  - Realistic instant fallback simulation returning structured notes when Ollama is offline.

</domain>

<decisions>
## Implementation Decisions

### 1. Ollama Integration & Prompt Engineering
- **D-01:** Local Ollama is queried via the FastAPI backend (`POST /synthesize/notes`) interfacing with `http://localhost:11434/api/generate` using structured JSON/Markdown prompt templates.
- **D-02:** When Ollama is offline or unreachable, `src/services/api.ts` transparently falls back to rich academic mock notes with formulas, summaries, and key concepts so student interaction is never blocked.

### 2. Dual-Column Flagship Workspace Layout
- **D-03:** Implement the dual-column layout directly mirroring Google Stitch screen `840927a0efce4abc8d510d560c1d5994`:
  - Left column: 5 of 12 columns (~42% width) for the Live Diarized Transcript Viewer.
  - Right column: 7 of 12 columns (~58% width) for the Tabbed Smart Notes Workspace.
- **D-04:** On smaller screens (<1200px), collapse gracefully into a stacked layout with sticky tab navigation.

### 3. Synchronized Audio Scrub Deck & Waveform
- **D-05:** Implement the audio scrub deck atop the workspace with media controls, time track, speed picker (`1.0x`, `1.25x`, `1.5x`, `2.0x`), and 70 dynamic waveform bars with gradient fill that respond to clicks to seek audio and scroll the transcript.

### 4. Interactive Note Customization & Export
- **D-06:** Provide full editing capabilities:
  - Toggle between rendered Markdown view and in-place editable Markdown textarea.
  - Personal margin notes input (`⌘N`).
  - Highlight color palette for student annotations.
- **D-07:** Multi-format export suite supporting Markdown (`.md`), formatted PDF, Notion-ready markdown, and Anki flashcard CSV.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual Design System & Stitch Specs
- **Google Stitch Screen `840927a0efce4abc8d510d560c1d5994`**: "Lecture Processing & AI Notes — LectureLens" — Complete visual layout, transcript sidebar, waveform deck, note tabs, and bottom intelligence dock.
- **`src/styles/tokens.css`**: Core 60-30-10 color palette, glassmorphism tokens, and radius variables.
- **`src/styles/global.css`**: Global Poppins typography and layout reset.

### Data Models & Schemas
- **`src/types/lecture.ts`**: Types for `Lecture`, `TranscriptSegment`, `KeyConcept`, `StudyNotes`, and `Flashcard`.

</canonical_refs>
