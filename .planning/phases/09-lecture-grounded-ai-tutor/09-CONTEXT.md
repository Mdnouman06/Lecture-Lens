# Phase 09 Context: Context-Grounded AI Tutor Copilot

**Phase:** 09 — Context-Grounded AI Tutor Copilot  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [TUTOR-01, TUTOR-02, TUTOR-03, TUTOR-04, TUTOR-05]  

---

## 1. Objective

Implement an interactive AI Tutor Copilot that answers student questions strictly grounded in their specific lecture materials (transcript segments and notes), replacing canned static neurobiology responses with real Qwen3 RAG synthesis.
1. Assemble real context from the lecture's Supabase transcript segments and study notes.
2. Formulate grounded answers that cite specific start/end timestamp ranges (`[02:15 - 02:45]`) with verbatim quotes.
3. Wire citation cards directly to the audio scrub deck so clicking a citation immediately seeks audio playback to that exact second.
4. Detect out-of-scope questions and politely inform the student that the topic is not covered in the lecture, preventing hallucinations.
5. Provide dynamic lecture-specific prompt chips ("Summarize core argument", "Explain key concept") and clear diagnostic errors when Ollama is offline.

---

## 2. Architecture & Data Flow

```
[Student in Lecture Workspace]
       │
       ▼ (Clicks "AI Tutor" drawer or quick prompt chip)
[Frontend: AiTutorDrawer.tsx & TutorInputDeck.tsx]
       │
       ▼ (Assembles relevant transcript segments & notes from lecture)
[Client Service: askAiTutor in src/services/api.ts]
       │
       ▼ (POST /tutor/ask with question, lectureId, courseCode, and segments)
[FastAPI: backend/main.py]
       │
       ▼ (Passes grounded system prompt and segment context to OllamaClient)
[Local Ollama: qwen2.5:3b on localhost:11434]
       │
       ▼ (Returns structured JSON: answer text, citations, sequence steps, exam alerts)
[FastAPI parses and validates citations: startSeconds, endSeconds, quote]
       │
       ▼
[AiTutorDrawer renders TutorSynthesisBubble & CitationCard]
       │
       ▼ (Clicking citation executes onSeekAudio(citation.timeStart))
[AudioScrubDeck jumps to exact timestamp and resumes playback]
```

---

## 3. Key Decisions

1. **Strict Context Grounding**: The LLM prompt must explicitly restrict responses to facts directly stated in the supplied lecture transcript snippets. If a query cannot be answered from the lecture, the tutor must output a standardized out-of-scope notice rather than hallucinating or defaulting to neurobiology facts.
2. **Deterministic Timestamp Citations**: Instead of making up arbitrary timecodes, the prompt instructs the model to select exact segment timecodes and quotes provided in the prompt context. The backend validates and enriches citations with `timeStart`, `timeEnd`, and `timecodeDisplay`.
3. **No Fake Default Conversation**: The drawer must not open with pre-canned NMDA questions and answers for unrelated lectures. It should open with a welcoming empty state and dynamic quick prompt chips customized to the current lecture's title and concepts.
4. **Offline Diagnostics**: If Ollama daemon is offline or the model is missing, return clean HTTP 503/404 with copyable terminal guidance (`ollama serve`) instead of fake simulated answers.

---

## 4. Work Breakdown (Plans)

- **09-01-PLAN**: Backend Grounded AI Tutor RAG Endpoint & Citation Extraction (`backend/services/ollama.py`, `backend/main.py`, `backend/test_api.py`).
- **09-02-PLAN**: Frontend Context Grounding, Supabase Context Assembly & Tutor Client (`src/services/api.ts`, `src/types/lecture.ts`).
- **09-03-PLAN**: Interactive AI Tutor Drawer, Dynamic Prompt Chips & Audio Seek Integration (`src/components/tutor/AiTutorDrawer.tsx`, `src/components/tutor/TutorInputDeck.tsx`, `src/styles/tutor.css`).
