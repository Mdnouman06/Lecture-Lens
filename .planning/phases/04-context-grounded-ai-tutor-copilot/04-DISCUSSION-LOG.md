# Phase 4: Context-Grounded AI Tutor Copilot - Discussion Log

**Date:** 2026-09-28
**Status:** Completed

## Questions & User Selections

### 1. AI Tutor Access Points
- **Question:** Where should students be able to interact with the AI Tutor?
- **User Selection:** (Recommended) Both: A slide-over drawer alongside notes in Workspace, plus a dedicated full-screen AI Tutor & Semantic Search hub.
- **Impact:** Delivers maximum contextual convenience inside `LectureWorkspaceView` while also providing a comprehensive cross-semester intelligence search dashboard via the sidebar (`ai-tutor` route).

### 2. Context Grounding & Retrieval Strategy
- **Question:** How should context grounding and retrieval be architected for local Ollama?
- **User Selection:** (Recommended) Hybrid RAG: Chunk transcript & notes by timestamps/sections, retrieve the top 3-5 most relevant chunks with strict grounding, and provide offline fallback simulation.
- **Impact:** Guarantees factual academic answers without hallucinations, provides explicit citation metadata, and ensures zero blocked student workflows if local Ollama or FastAPI is offline.

### 3. Interactive Citation Seeking
- **Question:** Should citation badges in the AI Tutor interactively seek audio and transcript playback?
- **User Selection:** (Recommended) Yes, clicking a citation timestamp jumps the audio scrubber to that timecode and highlights the transcript line.
- **Impact:** Seamlessly closes the loop between conversational AI explanations and original lecture audio/transcripts, reinforcing student comprehension.
