# Phase 10 Context: Quiz Generation, Flashcards & Spaced Repetition Flow

**Phase:** 10 — Quiz Generation, Flashcards & Spaced Repetition Flow  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [RECALL-01, RECALL-02, RECALL-03, RECALL-04, RECALL-05, RECALL-06, RECALL-07]  

---

## 1. Objective

Implement dynamic active-recall study tools powered by local Ollama (Qwen3 / `qwen2.5:3b`) and backed by Supabase PostgreSQL persistence:
1. Generate active-recall flashcard decks (Question on Front, Lead + Body on Back) with 1 click directly from the student's lecture transcript and notes.
2. Interactive 3D flip card runner with keyboard shortcuts (Space to flip, 1-4 for FSRS difficulty rating, Z to undo, R for audio pronunciation).
3. Generate 5-question multiple-choice exam drills with 4 options, 1 correct index, detailed explanations, and slide/PYQ citations.
4. Immediate interactive feedback on quiz answers with explanations and celebratory confetti on completion.
5. Persistent storage of flashcard decks, card mastery statuses, FSRS ratings, and quiz submission analytics in Supabase PostgreSQL under Row Level Security.
6. Elimination of all static LTP NMDA fallback mocks; offline Ollama states render clear diagnostic guidance with copyable terminal commands (`ollama serve`).

---

## 2. Architecture & Data Flow

```
[Student in Active Recall Studio or Lecture Workspace]
       │
       ▼ (Clicks "Generate Flashcards" or "Generate Quiz")
[ActiveRecallStudioView.tsx]
       │
       ▼ (Passes lectureId, title, courseCode, and transcript text)
[src/services/api.ts: generateLectureFlashcards / generateLectureQuiz]
       │
       ▼ (POST /generate/flashcards or /generate/quiz)
[FastAPI: backend/main.py]
       │
       ▼ (Prompt Qwen3 on localhost:11434 with FLASHCARDS_PROMPT or QUIZ_PROMPT)
[Local Ollama: qwen2.5:3b]
       │
       ▼ (Returns structured JSON arrays of cards or quiz questions)
[FastAPI validates JSON structure & returns to frontend]
       │
       ▼ (Auto-saves generated deck/quiz to Supabase)
[Supabase PostgreSQL: public.flashcards & public.quiz_submissions]
       │
       ▼ (Interactive Runner)
[FlashcardDeckRunner: 3D flip, FSRS rating (Easy/Med/Hard) -> updates Supabase]
[QuizAssessmentCenter: option select, real-time feedback, confetti on finish -> saves score to Supabase]
```

---

## 3. Key Decisions

1. **Strict Context Grounding for Assessments**: Flashcards and quizzes must test the actual concepts presented in the student's lecture. Prompts require verbatim or thematic citations from the transcript.
2. **Deterministic Schemas**: Qwen3 prompt templates format responses strictly in JSON. Python service validates keys (`question`, `answerLead`, `answerBody`, `options`, `correctIndex`, `explanation`) with regex fallback stripping markdown fences.
3. **Resilient Supabase Persistence**: CRUD methods in `src/services/lectures.ts` perform typed queries on `flashcards` and `quiz_submissions` tables with RLS and graceful fallback handling if database migrations are in progress.
4. **No Static Neurobiology Fallback**: All hardcoded LTP NMDA flashcards and quiz questions are eliminated from `backend/services/ollama.py` and `src/services/api.ts`. If Ollama is offline or uninstalled, transparent HTTP 503/404 errors with copyable terminal commands are returned.
5. **Seamless Navigation & 1-Click Synthesis**: In `ActiveRecallStudioView.tsx`, if the current lecture doesn't have cards or a quiz generated yet, a clean empty state with a 1-click "Generate with Qwen3" button is displayed.

---

## 4. Work Breakdown (Plans)

- **10-01-PLAN**: Backend Qwen3 Flashcards & Quiz Generation Endpoints with Error Diagnostics (`backend/services/ollama.py`, `backend/main.py`, `backend/test_api.py`).
- **10-02-PLAN**: Supabase Flashcards & Quiz Persistence Service Layer (`src/types/lecture.ts`, `src/services/lectures.ts`, `src/services/api.ts`).
- **10-03-PLAN**: Active Recall Studio Integration, 1-Click Generation, 3D Flip Runner & Quiz Scoring (`src/views/ActiveRecallStudioView.tsx`, `src/components/recall/FlashcardDeckRunner.tsx`, `src/components/recall/QuizAssessmentCenter.tsx`, `src/styles/recall.css`).
