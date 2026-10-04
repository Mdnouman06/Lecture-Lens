# Phase 6: Advanced Study Tools (PYQ Analyzer & Study Planner) - Context

**Gathered:** 2026-09-28
**Status:** Ready for UI contract and planning

<domain>
## Phase Boundary

Phase 6 delivers the final capstone phase for **LectureLens**: **Advanced Study Tools (PYQ Analyzer & Study Planner)**. It directly realizes Google Stitch screen `57fae43921be497dac14f898c05ac626` (*"Exam Preparation & PYQ Analysis — LectureLens"*) and screen `1680b7e660454bfab5c78955d8803343` (*"Study Planner & Calendar — LectureLens"*). It integrates historical exam intelligence, question extraction, recurring topic weighting matrices, and an adaptive 7-day academic study calendar optimizing revision against upcoming midterm dates and FSRS spaced repetition retention curves.

Deliverables:
- **Backend AI Extraction & Analysis Endpoints** in `./backend/`:
  - `POST /pyq/upload`: Accepts PYQ paper PDFs, performs text extraction via `pypdf`, and parses individual questions, marks, and rubric elements.
  - `POST /pyq/analyze`: Generates recurring topic frequency matrices, recurrence probabilities, and exam weighting distributions.
  - `POST /planner/schedule`: Calculates adaptive study schedules aligning lecture revisions with exam deadlines and FSRS memory decay curves.
- **Client API & Offline Simulation** in `src/services/api.ts`:
  - `getPyqPapers(courseCode?: string): Promise<PyqPaper[]>`
  - `uploadPyqPaper(file: File): Promise<PyqPaper>`
  - `getTopicWeightingMatrix(courseCode?: string): Promise<TopicWeight[]>`
  - `getStudySchedule(): Promise<StudyCalendarWeek>`
  - `autoFillScheduleDeficit(): Promise<StudyCalendarWeek>`
  - Comprehensive offline fallback pre-loaded with Henderson's 2019-2024 cellular neurobiology exam papers, grading rubrics, and week schedules.
- **Dedicated PYQ Intelligence View** in `src/views/PyqIntelligenceView.tsx`:
  - Top Bento Bar: Predicted Score (88.5% Grade A, 94% Confidence), Mastered PYQs (42/56, 75%), High-Yield Hotspots (7 archetypes recurring >= 3x), Syllabus Alignment (91.2%).
  - Left Workspace: Historical Exam Archive & OCR Engine (filter pills, verified paper card, secondary archive list), and High-Yield Question Deep-Dive (Question 4A 10 marks, recurrence probability 85%, 3-point grading criteria rubric, common pitfall warning, and correlated lecture jump button).
  - Right Workspace: Topic Weighting Matrix (Synaptic Plasticity 32%, Action Potential 25%, Neurotransmitter Release 22%, Glial Support 11%), circular simulation dial.
- **Dedicated Study Planner View** in `src/views/StudyPlannerView.tsx`:
  - Top Urgency Ribbon: Priority 1 Midterm warning ("NEURO 301 Midterm in 4 Days", -3.3h coverage deficit, "Auto-Fill Gap" CTA), and Today's Daily Target tracker (`2.0 / 3.5 hrs`, 57% Done).
  - Main 7-Day Calendar Grid (Monday to Sunday, 08:00 to 22:00) with 5 colored block categories: Live Lecture (Indigo), FSRS Review (Teal/Sky), Deep Study (Emerald), AI Tutor Drill (Purple), Exam / Deadline (Crimson).
  - Study Block Inspection & Quick Jump: Clicking a block opens a modal with details and direct CTA to notes or flashcards.

</domain>

<decisions>
## Implementation Decisions

### 1. Dedicated View Architecture
- **D-01:** Implement dedicated views `src/views/PyqIntelligenceView.tsx` and `src/views/StudyPlannerView.tsx` mapped directly to the sidebar navigation items `pyq` and `planner`. Both views adhere strictly to Google Stitch screens `57fae43921be497dac14f898c05ac626` and `1680b7e660454bfab5c78955d8803343`.

### 2. Dual PYQ Ingestion Pipeline
- **D-02:** Support both live PDF paper ingestion (`POST /pyq/upload` via `pypdf`) and an instant pre-loaded historical paper library spanning 2019–2024 exams.
- **D-03:** Each extracted question includes Professor Henderson's 3-point grading criteria rubric, common pitfalls analysis with percentage mark loss warnings, and a "Jump to Video / Transcript" button that opens `LectureWorkspaceView` at the exact correlated timecode (`[04:12 - 08:30]`).

### 3. Topic Weighting & Exam Simulation
- **D-04:** Provide historical topic weighting matrix with 5-year averages, predicted question distributions (short vs long answer), and circular SVG simulation coverage dial (88.5%).

### 4. Interactive 7-Day Adaptive Study Planner
- **D-05:** Deliver an interactive 7-day schedule grid with 5 categorized study block types, view toggles (Week, Month, Agenda), date navigator, and an active "Auto-Fill Gap" button that resolves the -3.3h study deficit by allocating optimal revision blocks.
- **D-06:** Maintain universal Poppins typography, Apple HIG glassmorphism, and responsive CSS grids across all components.

</decisions>

<canonical_references>
## Canonical References & Artifacts

- **Google Stitch Screens:**
  - `projects/11893050174269724482/screens/57fae43921be497dac14f898c05ac626` (*"Exam Preparation & PYQ Analysis — LectureLens"*)
  - `projects/11893050174269724482/screens/1680b7e660454bfab5c78955d8803343` (*"Study Planner & Calendar — LectureLens"*)
- **Requirements:**
  - `ADV-01`: Upload Previous Year Question Papers (PYQs) in PDF format and extract questions.
  - `ADV-02`: Analyze question frequency and recurring exam topics across historical papers.
  - `ADV-03`: Generate interactive study calendar and revision schedule based on exam dates and topic mastery.
- **Design & Typography:**
  - Strict universal Poppins typography with tabular numerals for timecodes, marks, and percentages.
  - Color scale: Indigo primary (`#3525cd`, `#4f46e5`), Emerald tertiary (`#005338`, `#10b981`), Crimson error/exam (`#ba1a1a`, `#ffdad6`), Sky blue secondary (`#006591`, `#39b8fd`).

</canonical_references>
