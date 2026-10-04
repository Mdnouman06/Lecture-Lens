# Phase 5: Active Recall & Assessment Studio - Research

**Date:** 2026-09-28
**Status:** Complete

## 1. Domain & Architectural Analysis

### Requirements Coverage
- **`RECALL-01`**: User can generate a deck of flashcards (Question on Front, Answer on Back) from any processed lecture with one click.
- **`RECALL-02`**: User can flip flashcards using interactive 3D card flip animations with keyboard or click controls.
- **`RECALL-03`**: User can rate their recall difficulty for each card (Easy / Medium / Hard) to track mastery (FSRS 4.5 4-level scale).
- **`RECALL-04`**: User can generate a 5-question multiple-choice quiz (MCQ) based on the lecture material.
- **`RECALL-05`**: User receives immediate feedback on quiz answers with clear explanations and confetti celebration on completion.

### Stitch Design References
- **Screen 1**: `projects/11893050174269724482/screens/780bbb036c7d4c0f967b26d82e45a3f6` (*"Flashcards & Spaced Repetition — LectureLens"*)
  - 3D card flip centerpiece (`perspective: 1000px`, `transform-style: preserve-3d`)
  - Retention overview strip with 12-day streak flame, 94.2% memory stability badge, and FSRS 4.5 SVG retention decay curve
  - 4-level FSRS rating bar: Again (<10m / Key 1), Hard (1.2d / Key 2), Good (3.8d / Key 3), Easy (8.5d / Key 4)
  - Deck filters: All Decks (28 due), Neurobiology 301 (18 due), Physics 402 (6 due), Macroeconomics 210 (4 due)
  - Right panel: Repetition horizon load forecast
- **Screen 2**: `projects/11893050174269724482/screens/d0d55bf76b054dc9973ffd286321aa5e` (*"Quiz & Assessment Center — LectureLens"*)
  - 4 stat summary strip: Average Score (91.5%), Quizzes Completed (24), Mastery Level (88.4%), Upcoming Midterm Drill
  - Active runner: `LIVE DRILL`, Question 4 of 5, Timer `08:42 / 25:00`, 3 Flagged
  - Problem statements with diagram thumbnails and 4 selectable options
  - Instant answer validation per question with academic rationale card
  - Confetti particle celebration (`canvas-confetti`) on quiz completion with performance scorecard

---

## 2. Technical Decisions & Patterns

### 2.1 Backend Generation Pipelines (`./backend/`)
- `FLASHCARDS_PROMPT`: Instructs local Ollama to return a JSON array of flashcard objects:
  ```json
  [
    {
      "source": "Lecture 14 [18:40] • Slide 22",
      "subtopic": "LTP Induction Mechanism",
      "question": "What is the molecular mechanism by which CaMKII maintains autonomous catalytic activity...",
      "answerLead": "Autophosphorylation at Threonine 286 (Thr286).",
      "answerBody": "When Ca2+/Calmodulin binds adjacent subunits...",
      "step1": "Thr286 Phosphorylation",
      "step2": "Unlocks Catalytic Domain",
      "conceptNote": "Prevents autoinhibitory capping",
      "recallAccuracy": "96%"
    }
  ]
  ```
- `QUIZ_PROMPT`: Instructs local Ollama to return a JSON array of 5 quiz questions:
  ```json
  [
    {
      "problemStatement": "In experimental hippocampal slice preparations...",
      "topicTag": "NMDA Receptor Biophysics & Voltage Dependence",
      "difficulty": "Hard",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 1,
      "explanation": "Removal of extracellular Mg2+ relieves the voltage-dependent pore plug...",
      "slideCitation": "Lecture 14 Slide 18"
    }
  ]
  ```
- Endpoints: `POST /generate/flashcards` and `POST /generate/quiz`.
- Resilient fallback simulations pre-loaded with biological and physical study sets.

### 2.2 3D Card Flip Animation (Hardware-Accelerated CSS)
- Uses `perspective: 1000px`, `transform-style: preserve-3d`, and `backface-visibility: hidden`.
- Flipping toggles `.is-flipped` which applies `transform: rotateY(180deg)`.
- Keybindings: `Spacebar` toggles flip; `1-4` selects FSRS rating and advances to the next card; `Z` undos previous rating.

### 2.3 Formative Instant Quiz Verification & Confetti
- In `QuizOptionCard.tsx`, clicking an option immediately locks the choice and compares against `correctIndex`.
- Correct option displays emerald border and fill (`rgba(0, 83, 56, 0.06)`), incorrect displays crimson (`rgba(186, 26, 26, 0.06)`).
- Rationale card slides down beneath the choice with deep academic explanation.
- Answering Question 5 renders `QuizScoreModal.tsx` and triggers `confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })`.

---

## 3. Plan Wave Breakdown

| Plan | Wave | Focus | Deliverables |
|---|---|---|---|
| **05-01-PLAN.md** | Wave 1 | Backend Generation Pipelines & Client API | `backend/services/ollama.py`, `backend/main.py`, `src/types/lecture.ts`, `src/services/api.ts` |
| **05-02-PLAN.md** | Wave 2 | 3D Flip Flashcard Deck Runner & FSRS 4.5 Rating | `src/styles/recall.css`, `RetentionTelemetryStrip.tsx`, `FlashcardDeckRunner.tsx`, `FlashcardRatingBar.tsx`, `RepetitionHorizonPanel.tsx` |
| **05-03-PLAN.md** | Wave 3 | Quiz Assessment Center, Confetti Celebration & App Integration | `QuizAssessmentCenter.tsx`, `QuizOptionCard.tsx`, `QuizScoreModal.tsx`, `ActiveRecallStudioView.tsx`, `App.tsx` navigation & verification |
