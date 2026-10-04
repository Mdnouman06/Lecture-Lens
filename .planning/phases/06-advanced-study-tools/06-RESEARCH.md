# Phase 6: Advanced Study Tools (PYQ Analyzer & Study Planner) — Research

**Date:** 2026-09-28
**Status:** Complete

---

## 1. Requirements & Domain Analysis

### Requirements Coverage
- **`ADV-01`**: User can upload Previous Year Question Papers (PYQs) in PDF format and extract questions using local OCR/parsing.
- **`ADV-02`**: User can view extracted question frequency, recurring exam topics, grading rubrics, and common student pitfalls across historical papers.
- **`ADV-03`**: User can view an interactive weekly study planner and academic calendar that automatically schedules review blocks around upcoming exam deadlines and FSRS memory decay curves.

### Google Stitch Blueprints
- **Screen 1**: `projects/11893050174269724482/screens/57fae43921be497dac14f898c05ac626` (*"Exam Preparation & PYQ Analysis — LectureLens"*)
  - Bento metric strip: Predicted Exam Score (88.5% Grade A, 94% Confidence), Mastered PYQs (42/56, 75%), High-Yield Hotspots (7 archetypes >= 3x), Syllabus Alignment (91.2%).
  - Left column (7 cols):
    - Historical Exam Archive & OCR Engine: Year filter pills (All Years, 2024 Midterm, 2023 Midterm, 2022 Final, Practice Drills); Primary paper card with OCR Verified (94% Fidelity), 14 short + 4 long ans, historical mean 68.4%, syllabus match 98.2%; Secondary paper archive list; PDF upload dropzone.
    - High-Yield Question Deep-Dive: Question 4A 10 marks, Recurred in 2021, 2023, 2024 (85% Midterm Prob.), Problem statement ("Explain mechanistic role of extracellular Mg2+ expulsion..."), Prof. Henderson's Strict Grading Criteria (3 explicit numbered rubric steps), Common Pitfall & Mark Loss Analysis ("42% lost marks on diffusion vs repulsion"), Correlated lecture timestamp jump button (`Lecture 14 [04:12 - 08:30]`).
    - Synaptic Plasticity 3D Schematic card thumbnail.
  - Right column (5 cols):
    - Topic Weighting Matrix: Historical 5-year average percentages (Synaptic Plasticity 32% Critical, Action Potential 25% Mastered, Neurotransmitter Release 22% Good, Glial Support 11% Low Yield).
    - Circular SVG simulation dial (88.5% exam simulation coverage verified in notes).
- **Screen 2**: `projects/11893050174269724482/screens/1680b7e660454bfab5c78955d8803343` (*"Study Planner & Calendar — LectureLens"*)
  - Dynamic Notification Ribbon: Priority 1 Midterm warning ("Cellular Neurobiology Midterm Exam • Friday, Oct 31 • In 4 Days"), Coverage Deficit `-3.3 hrs`, active "Auto-Fill Gap" primary CTA; Today's Daily Target tracker (`2.0 / 3.5 hrs`, 57% Done, Deep Study 1.5h, FSRS Drill 0.5h).
  - Action controls bar: Segmented view switcher (`Week View`, `Month`, `Agenda`), Date Navigator (`Today`, `< Oct 27 – Nov 02 >`), LMS Sync button, "Add Study Block" CTA.
  - 7-Day Interactive Weekly Schedule Grid (Monday to Sunday, 08:00 to 22:00) with 5 color-coded block categories (Live Lecture, FSRS Review, Deep Study, AI Tutor Drill, Exam / Deadline) and block inspection modal.
  - Right-side Backlog Panel: Spaced Repetition Due Queue, upcoming exam milestones, LMS sync status.

---

## 2. Technical Architecture & Endpoints

### 2.1 Backend Services (`./backend/`)
- In `backend/services/pyq.py`:
  - `extract_pyq_pdf(file_bytes: bytes) -> Dict[str, Any]`: Uses `pypdf` to extract text from question paper PDFs.
  - `parse_pyq_questions(text: str) -> List[Dict[str, Any]]`: Parses questions into structured objects with topic tag, marks, year, recurrence probability, and rubric steps.
  - `get_mock_pyq_archive() -> List[Dict[str, Any]]`: Returns historical 2019-2024 exam papers and question archetypes.
  - `get_topic_weighting_matrix(course_code: str) -> List[Dict[str, Any]]`: Returns 5-year topic weights.
- In `backend/services/planner.py`:
  - `generate_study_schedule() -> Dict[str, Any]`: Returns 7-day schedule with 5 categorized block types and daily targets.
  - `autofill_schedule_deficit() -> Dict[str, Any]`: Computes coverage deficit (-3.3h) and injects optimal study blocks.
- In `backend/main.py`:
  - `POST /pyq/upload`: Handles multipart PDF file upload and returns extracted questions.
  - `GET /pyq/papers`: Returns processed exam papers.
  - `GET /pyq/weights`: Returns topic frequency matrix.
  - `GET /planner/schedule`: Returns current 7-day schedule.
  - `POST /planner/autofill`: Resolves coverage deficit and returns updated schedule.

### 2.2 Client API & Offline Simulation (`src/services/api.ts`)
- Pre-loaded historical exam papers and question archetypes matching Stitch screen `57fae43921be497dac14f898c05ac626`.
- Pre-loaded 7-day schedule (Mon Oct 27 – Sun Nov 02) with 5 color-coded categories matching Stitch screen `1680b7e660454bfab5c78955d8803343`.
- Interactive "Auto-Fill Gap" state that immediately eliminates the -3.3h deficit in client state and populates 3 dedicated study blocks.

---

## 3. Plan Wave Breakdown

| Plan | Wave | Requirements | Focus & Deliverables |
|---|---|---|---|
| **06-01-PLAN.md** | Wave 1 | `ADV-01`, `ADV-02`, `ADV-03` | **Backend PYQ & Planner Pipelines, Types, and Client API**<br>• `backend/services/pyq.py` & `backend/services/planner.py`<br>• REST endpoints in `backend/main.py`<br>• TypeScript interfaces in `src/types/lecture.ts`<br>• Client API methods with offline simulation in `src/services/api.ts` |
| **06-02-PLAN.md** | Wave 2 | `ADV-01`, `ADV-02` | **PYQ Exam Intelligence View & Component Suite**<br>• `src/styles/advanced.css` (bento metrics, rubrics, pitfall alerts, topic weighting bars, dial SVG)<br>• `PyqBentoBar.tsx`, `PyqPaperArchive.tsx`, `PyqQuestionInspector.tsx`, `PyqTopicWeightMatrix.tsx`<br>• Dedicated full-page `PyqIntelligenceView.tsx` |
| **06-03-PLAN.md** | Wave 3 | `ADV-03` | **Adaptive Study Planner View, Calendar Canvas & Complete App Integration**<br>• `StudyUrgencyRibbon.tsx` with deficit warning & "Auto-Fill Gap" CTA<br>• `StudyCalendarGrid.tsx` with 7-day canvas, time axis, and 5 color-coded block types<br>• `StudyBlockModal.tsx` and `StudyBacklogPanel.tsx`<br>• Dedicated `StudyPlannerView.tsx`<br>• Routing in `src/App.tsx` and end-to-end verification |
