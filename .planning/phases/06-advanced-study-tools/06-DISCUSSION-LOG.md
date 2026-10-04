# Phase 6: Advanced Study Tools (PYQ Analyzer & Study Planner) — Discussion Log

**Date:** 2026-09-28
**Status:** Complete

---

## 1. Context & Scope

Phase 6 completes the core student ecosystem for **LectureLens** by implementing:
- **`ADV-01`**: Upload Previous Year Question Papers (PYQs) in PDF format and extract questions using local OCR/parsing.
- **`ADV-02`**: Analyze question frequency and recurring exam topics across historical papers (Topic Weighting Matrix, recurrence probabilities, rubric breakdowns).
- **`ADV-03`**: Generate an interactive weekly study planner and academic calendar based on exam deadlines, lecture schedules, and FSRS spaced repetition retention curves.

---

## 2. Key Decisions

### D-01: View Architecture & Sidebar Mapping
- Implement dedicated views:
  - `src/views/PyqIntelligenceView.tsx`: Mapped to sidebar route `pyq`.
  - `src/views/StudyPlannerView.tsx`: Mapped to sidebar route `planner`.
- Directly realizes Google Stitch screens:
  - `57fae43921be497dac14f898c05ac626` (*"Exam Preparation & PYQ Analysis — LectureLens"*)
  - `1680b7e660454bfab5c78955d8803343` (*"Study Planner & Calendar — LectureLens"*)

### D-02: PYQ Paper Processing & Question Archetypes
- Support both:
  - **Live PDF Upload**: Via FastAPI endpoint `POST /pyq/upload` using `pypdf` text extraction.
  - **Pre-Loaded Historical Archive**: 2019–2024 exam papers with OCR verified status (94% fidelity), 14 short + 4 long answer questions, historical cohort means (68.4%), and syllabus overlap score (98.2%).
- High-Yield Question Deep-Dive:
  - Recurrence tracker: e.g. "Recurred in 2021, 2023, 2024 (85% Midterm Probability)".
  - Professor Rubric Breakdown: 3 explicit grading criteria points required for full marks.
  - Common Pitfall & Mark Loss Analysis: Explains common mistakes (e.g. "42% of past students lost 3/10 marks for describing Mg2+ unblocking as diffusion rather than electrostatic repulsion").
  - Correlated Lecture Timestamp: Direct jump CTA (`Lecture 14 [04:12 - 08:30]`) navigating straight to `LectureWorkspaceView` and seeking the audio deck.

### D-03: Topic Weighting & Exam Readiness Matrix
- Right-side intelligence panel with 5-year average topic weights:
  - Synaptic Plasticity & LTP: `Critical / 32%` (Predicted 3 questions, Focus Area).
  - Action Potential Biophysics: `Mastered / 25%` (96% Accuracy in drills).
  - Neurotransmitter Release Mechanics: `Good / 22%` (Review SNAREpins).
  - Glial Support & Ion Homeostasis: `Low Yield / 11%` (1 Short answer predicted).
- Circular SVG dial displaying 88.5% exam simulation coverage.

### D-04: Interactive 7-Day Study Planner Canvas
- Top Priority 1 Notification Ribbon:
  - "NEURO 301 Midterm in 4 Days" with -3.3h coverage deficit warning.
  - One-click "Auto-Fill Gap" CTA that calculates optimal study slots and adds revision blocks.
  - Today's Daily Target tracker: `2.0 / 3.5 hrs (57% Done)`.
- 7-Day Interactive Calendar Grid (Mon–Sun):
  - 5 Categorized block types: Live Lecture, FSRS Review, Deep Study, AI Tutor Drill, Exam / Deadline.
  - View switcher: Week View, Month, Agenda.
  - Date navigator: "Today", "Oct 27 – Nov 02".
  - Block click modal: Details, estimated time, and direct CTA to jump to relevant lecture notes or flashcard queues.
