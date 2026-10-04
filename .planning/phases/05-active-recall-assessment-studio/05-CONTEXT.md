# Phase 5: Active Recall & Assessment Studio - Context

**Gathered:** 2026-09-28
**Status:** Ready for UI contract and planning

<domain>
## Phase Boundary

Phase 5 establishes the **Active Recall & Assessment Studio** for **LectureLens**, directly realizing Google Stitch screen `780bbb036c7d4c0f967b26d82e45a3f6` (*"Flashcards & Spaced Repetition — LectureLens"*) and screen `d0d55bf76b054dc9973ffd286321aa5e` (*"Quiz & Assessment Center — LectureLens"*). It provides high-yield spaced repetition flashcards with FSRS 4.5 algorithm mechanics (Again, Hard, Good, Easy) and interactive 3D card flips, alongside a 5-question multiple choice assessment engine with instant answer verification and confetti celebration.

Deliverables:
- **Backend AI Generation Endpoints** in `./backend/`:
  - `POST /generate/flashcards`: Generates structured flashcard decks from active lecture notes and transcripts via local Ollama (`localhost:11434`), returning question, answer lead, detailed biological mechanism, 2-step concept sequence, and source slide/audio timecode.
  - `POST /generate/quiz`: Generates a 5-question multiple-choice exam simulation with four options, correct answer index, physiological rationale, and past exam correlation (PYQ).
- **Client API & Offline Simulation** in `src/services/api.ts`:
  - `generateLectureFlashcards(lectureId: string): Promise<FlashcardItem[]>`
  - `generateLectureQuiz(lectureId: string): Promise<QuizAssessment>`
  - `submitQuizResult(quizId: string, score: number): Promise<void>`
  - High-fidelity academic simulation with comprehensive pre-calibrated neurobiology and quantum mechanics questions ensuring student testing is never blocked when Ollama is offline.
- **Unified Active Recall & Assessment Studio View** in `src/views/ActiveRecallStudioView.tsx`:
  - Main sub-tab switcher: `Flashcard Decks` vs `Quiz Assessments`, wired to sidebar routes `flashcards` and `quiz`.
  - **Flashcard Deck Studio**:
    - Retention overview strip: Queue Progress (28 Cards Due), Study Streak flame badge (12-day streak), Memory Stability (94.2%), and FSRS v4.5 retention decay SVG curve.
    - Deck filter pills: All Decks (28 due), Neurobiology 301 (18 due), Physics 402 (6 due), Macroeconomics 210 (4 due).
    - 3D Interactive Card Flip Centerpiece:
      - Hardware-accelerated 3D card flip (`transform-style: preserve-3d`, `rotateY(180deg)`) triggered by card click or keyboard `Spacebar`.
      - Front Face: Lecture source badge (`Lecture 14 [18:40] • Slide 22`), concept recall prompt question, "Space to flip" indicator.
      - Back Face: Verified model answer with bold lead (*"Autophosphorylation at Threonine 286"*), full physiological explanation, 2-step concept progression chips (*"Thr286 Phosphorylation → Unlocks Catalytic Domain"*), confidence tag (96%).
      - Docked 4-level FSRS Response Rating Bar: Again (`<10m / Key 1`), Hard (`1.2d / Key 2`), Good (`3.8d / Key 3`), Easy (`8.5d / Key 4`).
      - Deck queue progress tracking (`Card 7 of 18 in queue • 11 remaining`), undo rating (`Z`), and audio pronunciation.
    - Side intelligence panel: Repetition horizon bar and stability telemetry.
  - **Quiz Assessment Center**:
    - Formative quiz runner with 5 calibrated exam-level questions.
    - Top progress bar, timer (`08:42 / 25:00`), problem statement, and 4 selectable answer choices.
    - Immediate per-question verification: Instant emerald highlight for correct answer, crimson for incorrect, accompanied by an in-depth explanatory rationale card.
    - Completion scorecard with accuracy percentage, cohort benchmark, review CTA, and celebratory confetti burst (`canvas-confetti`).

</domain>

<decisions>
## Implementation Decisions

### 1. Unified Studio Architecture
- **D-01:** Provide a unified view (`ActiveRecallStudioView.tsx`) with segmented sub-tabs (`Flashcard Decks` & `Quiz Assessments`). Both sidebar items (`flashcards` and `quiz`) navigate to this studio with the appropriate tab active.

### 2. Spaced Repetition Engine (FSRS 4.5 Fidelity)
- **D-02:** Implement a 4-level FSRS rating bar matching Stitch screen `780bbb036c7d4c0f967b26d82e45a3f6`:
  - `Again` (Rating 1, interval `<10m`, Key `1`)
  - `Hard` (Rating 2, interval `1.2d`, Key `2`)
  - `Good` (Rating 3, interval `3.8d`, Key `3` - highlighted primary with star)
  - `Easy` (Rating 4, interval `8.5d`, Key `4`)
- **D-03:** Support global keyboard triggers when reviewing flashcards:
  - `Space`: Flip card (front ↔ back)
  - `1`, `2`, `3`, `4`: Select rating and advance to next card
  - `Z`: Undo previous rating

### 3. Apple-Grade 3D Flip Mechanics
- **D-04:** Implement pure CSS 3D transforms (`perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`) with a 450ms cubic-bezier transition (`cubic-bezier(0.4, 0, 0.2, 1)`) ensuring smooth 60fps card flips on both desktop and mobile.

### 4. Formative Immediate Quiz Verification & Gamification
- **D-05:** In the Quiz Assessment runner, checking an option immediately validates the answer with visual state cues:
  - Correct option turns Emerald `#005338` with checkmark.
  - Incorrect selection turns Crimson `#BA1A1A` with cross.
  - Expands an academic rationale card explaining why the option is correct and citing lecture slides.
- **D-06:** Completing the 5th question triggers a celebratory confetti burst (`canvas-confetti`) with completion score modal and mastery rating updates.

</decisions>

<canonical_references>
## Canonical References & Artifacts

- **Google Stitch Screens:**
  - `projects/11893050174269724482/screens/780bbb036c7d4c0f967b26d82e45a3f6` (*"Flashcards & Spaced Repetition — LectureLens"*)
  - `projects/11893050174269724482/screens/d0d55bf76b054dc9973ffd286321aa5e` (*"Quiz & Assessment Center — LectureLens"*)
- **Requirements:**
  - `RECALL-01`: One-click flashcard deck generation from lecture notes.
  - `RECALL-02`: Interactive 3D card flip animation with click or Spacebar.
  - `RECALL-03`: Rate recall difficulty (Easy/Medium/Hard/Again) to track mastery.
  - `RECALL-04`: 5-question multiple choice quiz generation based on lecture material.
  - `RECALL-05`: Immediate feedback on answers with clear explanations and confetti celebration.
- **Typography & Styling:**
  - Universal Poppins font across all cards and quizzes.
  - Monospaced fonts for intervals, accuracy percentages, and timecodes.
  - Apple HIG glassmorphic surfaces (`tokens.css`).
- **Libraries:**
  - `canvas-confetti` (for celebratory completion feedback).
  - `lucide-react` (icons: `Layers`, `HelpCircle`, `Flame`, `RotateCcw`, `Check`, `X`, `Award`, `Sparkles`, `Timer`).

</canonical_references>
