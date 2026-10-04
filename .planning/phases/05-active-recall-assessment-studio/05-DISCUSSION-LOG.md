# Phase 5: Active Recall & Assessment Studio - Discussion Log

**Date:** 2026-09-28
**Status:** Completed

## Questions & User Selections

### 1. Navigation & Studio Architecture
- **Question:** How should Flashcards and Quizzes be presented in the user navigation?
- **User Selection:** (Recommended) Unified Studio: Dedicated Active Recall Hub with sub-tabs for 'Flashcard Decks' and 'Quiz Assessments', wired to both sidebar entries.
- **Impact:** Provides a cohesive study center where students can effortlessly pivot between flashcard memorization and quiz testing without fragmented views.

### 2. Spaced Repetition Rating Scale
- **Question:** What rating scale should students use when reviewing flashcards?
- **User Selection:** (Recommended) 4-level FSRS scale: Again (<10m / Key 1), Hard (1.2d / Key 2), Good (3.8d / Key 3), Easy (8.5d / Key 4) with interval prediction badges.
- **Impact:** Delivers Apple-grade spaced repetition fidelity directly adhering to Google Stitch screen `780bbb036c7d4c0f967b26d82e45a3f6`, featuring keyboard hotkeys (`1-4`, `Space` to flip) and retention telemetry.

### 3. Quiz Question Verification & Feedback
- **Question:** How should quiz question verification and feedback be handled?
- **User Selection:** (Recommended) Immediate feedback per question with instant explanation, followed by celebratory confetti celebration on 100% or completion.
- **Impact:** Maximizes formative learning through immediate reinforcement after every question selection, culminating in celebratory feedback (`canvas-confetti`) when completing the 5-question assessment.
