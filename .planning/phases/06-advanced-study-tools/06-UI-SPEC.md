---
phase: "6"
slug: "advanced-study-tools"
status: approved
shadcn_initialized: false
preset: "apple-hig-glassmorphism"
created: "2026-09-28"
---

# Phase 6 — UI Design Contract: Advanced Study Tools (PYQ Analyzer & Study Planner)

> Visual and interaction design contract for Phase 6 (Advanced Study Tools).
> Directly derived from Google Stitch project `projects/11893050174269724482`:
> - Screen `57fae43921be497dac14f898c05ac626` (*"Exam Preparation & PYQ Analysis — LectureLens"*, Width: 2560px, Height: 4252px)
> - Screen `1680b7e660454bfab5c78955d8803343` (*"Study Planner & Calendar — LectureLens"*, Width: 2560px, Height: 3940px)
> Refined per Apple Human Interface Guidelines and `design-taste-frontend`.

---

## Design System & Foundation

| Property | Value |
|----------|-------|
| Tool | Custom Design System (Stitch Tokens + CSS Modules in `src/styles/advanced.css`) |
| Preset | Apple HIG Glassmorphism (Frosted acrylic surfaces, subtle 1px border lines, soft 0 1px 8px shadows, micro-badges) |
| Component library | None (Framework-free native React 19 components with TypeScript) |
| Icon library | `lucide-react` (Strict 1.5px stroke width throughout, unified academic iconography) |
| Font | **Poppins** (Google Fonts) applied universally across all UI elements; SF Mono / JetBrains Mono for intervals, timecodes, marks, and percentages |

---

## Component Inventory

> Custom component architecture implementing Google Stitch screens `57fae43921be497dac14f898c05ac626` and `1680b7e660454bfab5c78955d8803343`.

| Component | File Path | Role & Purpose |
|-----------|-----------|----------------|
| `PyqIntelligenceView` | `src/views/PyqIntelligenceView.tsx` | Dedicated full-page view mounted on sidebar route `pyq`, displaying the PYQ archive, question deep-dive, and topic weighting matrix. |
| `PyqBentoBar` | `src/components/pyq/PyqBentoBar.tsx` | Top 4-card metric strip: Predicted Score (`88.5% Grade A`), Mastered PYQs (`42/56`), High-Yield Hotspots (`7` archetypes), Syllabus Alignment (`91.2%`). |
| `PyqPaperArchive` | `src/components/pyq/PyqPaperArchive.tsx` | Historical exam browser with year filter pills (2019–2024), primary paper card with OCR verification badge, and paper upload dropzone. |
| `PyqQuestionInspector` | `src/components/pyq/PyqQuestionInspector.tsx` | Question deep-dive card with historical recurrence probability, 3-point grading criteria rubric, common pitfall alert, and lecture jump CTA. |
| `PyqTopicWeightMatrix` | `src/components/pyq/PyqTopicWeightMatrix.tsx` | Right-side panel with 5-year average topic weights, predicted question types, and 88.5% circular simulation dial. |
| `StudyPlannerView` | `src/views/StudyPlannerView.tsx` | Dedicated calendar and schedule view mounted on sidebar route `planner`, integrating exam countdowns, daily study targets, and weekly timetables. |
| `StudyUrgencyRibbon` | `src/components/planner/StudyUrgencyRibbon.tsx` | Top notification banner with countdown exam alert (`In 4 Days`), -3.3h coverage deficit warning, "Auto-Fill Gap" CTA, and daily target tracker. |
| `StudyCalendarGrid` | `src/components/planner/StudyCalendarGrid.tsx` | 7-day interactive schedule canvas (Mon–Sun, 08:00–22:00) with 5 color-coded block types, legend, and time axis. |
| `StudyBlockModal` | `src/components/planner/StudyBlockModal.tsx` | Inspection and editor modal for scheduled blocks with lecture jump and flashcard drill CTAs. |
| `StudyBacklogPanel` | `src/components/planner/StudyBacklogPanel.tsx` | Right-side backlog of due FSRS review queues, upcoming assignment milestones, and LMS sync status. |

---

## Spacing Scale

Strictly adheres to the 4px baseline grid:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Internal icon-to-label gaps, badge paddings, rubric bullet margins |
| `sm` | 8px | Filter pill gaps, legend indicator gaps, calendar cell inner padding |
| `md` | 16px | Card padding, study block margins, metric card gaps |
| `lg` | 24px | Split-pane grid gaps, section margins, modal padding |
| `xl` | 32px | Sub-header bottom margin, outer workspace horizontal padding |
| `2xl` | 48px | Bottom clearance, page bottom padding |

---

## Typography Scale

Universal typography powered strictly by **Poppins** with optical tracking and tabular numerals for timecodes, marks, and dates:

| Role | Font Family | Size | Weight | Line Height | Tracking | Usage |
|------|-------------|------|--------|-------------|----------|-------|
| Display / Headline | Poppins | 28px | 700 | 1.25 | -0.025em | Main view titles ("Exam Preparation & PYQ Intelligence", "Adaptive Study Planner") |
| Section Header | Poppins | 18px | 600 | 1.3 | -0.015em | Panel headers ("Historical Exam Archive", "Topic Weighting Matrix", "7-Day Schedule") |
| Card Title | Poppins | 16px | 600 | 1.35 | -0.01em | Question statement lead, paper title, study block title |
| Body Text | Poppins | 14px | 400 | 1.6 | 0 | Problem statements, rubric criteria, pitfall explanation |
| Small Body | Poppins | 13px | 400 | 1.5 | 0 | Subtopic tags, scheduled hours, author lines |
| Caption / Micro | Poppins | 11px | 600 | 1.4 | +0.02em | Recurrence badges, exam tags, key shortcuts |
| Tabular Code / Mono | SF Mono, JetBrains Mono | 12px | 600 | 1.4 | 0 | Timecodes (`[04:12 - 08:30]`), deficit (`-3.3 hrs`), predicted score (`88.5%`), clock times (`09:00 - 10:30`) |

---

## Color Palette & Visual Tokens (60-30-10 Rule)

Directly mapped from Google Stitch design tokens in `src/styles/tokens.css`:

```
60% Dominant (Canvas & Backgrounds):
  --color-surface: #FBF8FF (Soft Apple lilac canvas)
  --color-surface-container-low: #F4F2FD (Translucent calendar well & panel background)
  --color-surface-container: #EEEDF7 (Interactive track & input background)
  --color-surface-container-lowest: #FFFFFF (Pristine paper card face & modal fill)

30% Structural (Borders, Text & Dividers):
  --color-on-surface: #1A1B22 (Deep graphite typography)
  --color-on-surface-variant: #464555 (Muted slate secondary text)
  --color-outline: #777587 (Subtle border lines)
  --color-outline-variant: #C7C4D8 (Faint card perimeter strokes)

10% Accent (Categorized Study Block Types & Semantics):
  Live Lecture: #3525CD (Deep Indigo)
  FSRS Review: #006591 (Teal / Sky Blue)
  Deep Study: #005338 (Deep Emerald)
  AI Tutor Drill: #4F46E5 (Vibrant Indigo / Purple)
  Exam / Deadline: #BA1A1A (Crimson Alert & Deficit Warning)
```

---

## Layout & View Architectures

### 1. PYQ Exam Intelligence View (`PyqIntelligenceView.tsx`)
- **Top Command Header**:
  - Breadcrumb: `LectureLens > Exam Preparation & PYQ Intelligence`
  - Urgency Badge: `NEURO 301 Midterm in 4 Days` (pulsing emerald dot)
  - Action Cluster: Course selector (`Target: NEURO 301`), "Import Paper / PYQ" button, "Run Predictive Simulation" primary CTA.
- **Top Bento Bar (4 Cards)**:
  1. *Predicted Score*: `88.5% Grade A` (94% confidence, +4.2% lift vs 2023 cohort).
  2. *Mastered PYQs*: `42/56` (75% complete with progress bar).
  3. *High-Yield Hotspots*: `7` archetypes recurring >= 3x (covers ~65% of exam weight).
  4. *Syllabus Alignment*: `91.2%` with checkmark.
- **Left Column (7 cols)**:
  - *Historical Exam Archive & OCR Engine*:
    - Filter pills: `All Years (2019–2024)`, `2024 Midterm`, `2023 Midterm`, `2022 Final Exam`, `Practice Drills`.
    - Primary paper card: PDF badge, `2023 Cellular Neurobiology Midterm Paper`, "OCR Verified (94% Fidelity)", 14 Short + 4 Long Ans, Historical Mean 68.4%, 98.2% Direct Overlap.
    - Secondary paper archive list: 2024 Fall Mock Paper, 2022 Comprehensive Midterm.
    - Dropzone to upload new PYQ PDF.
  - *High-Yield Question Deep-Dive*:
    - Question header: `QUESTION 4A • 10 MARKS`, `Recurred in 2021, 2023, 2024 (85% Midterm Prob.)`.
    - Question statement: *"Explain the mechanistic role of extracellular Mg2+ expulsion in NMDA receptor channel opening during high-frequency tetanus stimulation."*
    - Prof. Henderson's Strict Grading Criteria: 3 numbered rubric points (Resting Potential Block -70mV, Sustained AMPA Depolarization -30mV, Electrostatic Repulsion).
    - Common Pitfall Alert: Crimson warning callout explaining why 42% lost marks on diffusion vs repulsion.
    - Correlated Lecture Timestamp: `Lecture 14 [04:12 - 08:30]` with "Jump to Video / Transcript" button that opens `LectureWorkspaceView`.
- **Right Column (5 cols)**:
  - *Topic Weighting Matrix*:
    - Synaptic Plasticity & LTP: `32%` (Critical, Focus Area).
    - Action Potential Biophysics: `25%` (Mastered, 96% accuracy).
    - Neurotransmitter Release Mechanics: `22%` (Good, Review SNAREpins).
    - Glial Support & Ion Homeostasis: `11%` (Low Yield).
  - *Circular Exam Simulation Dial*:
    - 88.5% exam simulation coverage ring with verified notes tag.

---

### 2. Adaptive Study Planner & Calendar View (`StudyPlannerView.tsx`)
- **Top Urgency Ribbon (Grid 8/4 cols)**:
  - Left (Col 8): Exam Countdown Alert:
    - `Priority 1 Assessment: Cellular Neurobiology Midterm Exam (Friday, Oct 31 • In 4 Days)`
    - Estimated Prep Hours: `14.5 hrs needed • 11.2 hrs scheduled`
    - Coverage Deficit: `-3.3 hrs` in Crimson
    - "Auto-Fill Gap" primary button: automatically schedules 3 revision blocks to eliminate the deficit.
  - Right (Col 4): Today's Daily Target:
    - `2.0 / 3.5 hrs (57% Done)`, Deep Study 1.5h, FSRS Drill 0.5h with linear progress track.
- **Planner Action Controls Bar**:
  - Segmented View Switcher: `Week View` (active), `Month`, `Agenda`.
  - Date Navigator: `Today`, `< Oct 27 – Nov 02 >`.
  - "LMS Sync" button (Canvas / Blackboard sync simulation).
  - "Add Study Block" CTA.
- **7-Day Interactive Weekly Schedule Grid (Col 8)**:
  - Header row: Time column + 7 day columns (Mon 27, Tue 28, Wed 29, Thu 30, Fri 31, Sat 01, Sun 02).
  - Time slots from 08:00 to 22:00.
  - Color-coded study blocks:
    - *Live Lecture* (Indigo border & fill): e.g. Mon 09:00–10:30 NEURO 301 Lecture.
    - *FSRS Review* (Teal/Sky): e.g. Tue 14:00–15:00 Synaptic Plasticity Deck (28 cards).
    - *Deep Study* (Emerald): e.g. Wed 16:00–18:00 Ion Channel Formula Derivations.
    - *AI Tutor Drill* (Purple): e.g. Thu 11:00–12:00 Exam Q&A Simulation.
    - *Exam Milestone* (Crimson): Fri 09:00–12:00 NEURO 301 Midterm Exam.
  - Clicking any study block opens `StudyBlockModal`.
- **Right Panel: Backlog & Spaced Repetition Horizon (Col 4)**:
  - FSRS Review Due Queue: 28 cards due today, 14 tomorrow.
  - Upcoming Exam Milestones: Physics 402 Final in 18 days, Macroeconomics Midterm in 24 days.
  - Neural Scheduler Optimization telemetry.

---

## Keyboard Controls & Accessibility

- **`Spacebar`**: In modal, toggle completion status.
- **`Esc`**: Close inspect/upload modals.
- **`Tab` / `Shift+Tab`**: Navigate between calendar days and action pills.
- **ARIA Attributes**: `role="grid"` on calendar schedule, `role="region"` on question inspector, `aria-label` on time slots and difficulty badges.
