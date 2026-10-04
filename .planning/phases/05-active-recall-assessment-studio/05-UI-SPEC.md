---
phase: "5"
slug: "active-recall-assessment-studio"
status: approved
shadcn_initialized: false
preset: "apple-hig-glassmorphism"
created: "2026-09-28"
---

# Phase 5 — UI Design Contract: Active Recall & Assessment Studio

> Visual and interaction contract for Phase 5 (Active Recall & Assessment Studio).
> Directly derived from Google Stitch project `projects/11893050174269724482` (screen `780bbb036c7d4c0f967b26d82e45a3f6` — *"Flashcards & Spaced Repetition — LectureLens"* and screen `d0d55bf76b054dc9973ffd286321aa5e` — *"Quiz & Assessment Center — LectureLens"*) and refined per Apple Human Interface Guidelines and `design-taste-frontend`.

---

## Design System & Foundation

| Property | Value |
|----------|-------|
| Tool | Custom Design System (Stitch Tokens + Vanilla CSS Modules in `src/styles/recall.css`) |
| Preset | Apple HIG Glassmorphism (Frosted acrylic surfaces, subtle 1px border lines, soft 0 1px 8px shadows, 3D card flips) |
| Component library | None (Framework-free native React 19 components with TypeScript) |
| Icon library | `lucide-react` (Strict 1.5px stroke width throughout, unified academic iconography) |
| Font | **Poppins** (Google Fonts) applied universally across all UI elements; SF Mono / JetBrains Mono for intervals, timecodes, retention ratings, and formula notation |
| Celebratory FX | `canvas-confetti` (Full-viewport celebratory particle burst on quiz completion) |

---

## Component Inventory

> Custom component architecture implementing Google Stitch screens `780bbb036c7d4c0f967b26d82e45a3f6` (Width: 2560px, Height: 3532px) and `d0d55bf76b054dc9973ffd286321aa5e` (Width: 2560px, Height: 3978px).

| Component | File Path | Role & Purpose |
|-----------|-----------|----------------|
| `ActiveRecallStudioView` | `src/views/ActiveRecallStudioView.tsx` | Main unified hub mounted on sidebar routes `flashcards` and `quiz`, featuring top retention telemetry and sub-tab switcher (`Flashcard Decks` vs `Quiz Assessments`). |
| `RetentionTelemetryStrip` | `src/components/recall/RetentionTelemetryStrip.tsx` | Top overview bar showing 28 cards due, 12-day study streak flame (`local_fire_department`), 94.2% memory stability badge, segmented course bar, and FSRS 4.5 retention decay SVG curve. |
| `FlashcardDeckRunner` | `src/components/recall/FlashcardDeckRunner.tsx` | Interactive 3D flip card centerpiece (`perspective: 1000px`, `transform-style: preserve-3d`) supporting card click and keyboard `Spacebar` flipping. |
| `FlashcardRatingBar` | `src/components/recall/FlashcardRatingBar.tsx` | Docked 4-level FSRS response rating bar: Again (`Key 1`, <10m), Hard (`Key 2`, 1.2d), Good (`Key 3`, 3.8d), Easy (`Key 4`, 8.5d) with interval prediction badges. |
| `RepetitionHorizonPanel` | `src/components/recall/RepetitionHorizonPanel.tsx` | Right-side intelligence panel displaying the 30-day spaced repetition review forecast and card difficulty breakdown. |
| `QuizAssessmentCenter` | `src/components/recall/QuizAssessmentCenter.tsx` | 5-question formative assessment runner calibrated against exam styles, with progress track, timer, problem statements, and context diagrams. |
| `QuizOptionCard` | `src/components/recall/QuizOptionCard.tsx` | Selectable multiple choice option card with instant verification styling: Emerald check for correct, Crimson cross for incorrect, and expandable academic rationale. |
| `QuizScoreModal` | `src/components/recall/QuizScoreModal.tsx` | Celebratory completion modal with performance percentage, cohort benchmark, review CTA, and `canvas-confetti` particle blast. |

---

## Spacing Scale

Strictly adheres to the 4px baseline grid:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Internal icon-to-label gaps, badge paddings, shortcut pill gaps |
| `sm` | 8px | Rating button gap, sub-tab button padding, concept chain flow pill padding |
| `md` | 16px | Standard card padding, option card padding, rating bar inner padding |
| `lg` | 24px | Split-pane grid gap, 3D card inner content padding, modal body padding |
| `xl` | 32px | Sub-header bottom margin, outer studio horizontal padding |
| `2xl` | 48px | Bottom clearance, page bottom padding |

---

## Typography Scale

Universal typography powered strictly by **Poppins** with optical tracking and tabular numerals for timecodes and intervals:

| Role | Font Family | Size | Weight | Line Height | Tracking | Usage |
|------|-------------|------|--------|-------------|----------|-------|
| Display / Headline | Poppins | 28px | 700 | 1.25 | -0.025em | Main studio title ("Spaced Repetition & Flashcards", "Adaptive Exam Quizzes") |
| Section Header | Poppins | 18px | 600 | 1.3 | -0.015em | Panel headers, deck title ("Neurobiology 301 — Synaptic Plasticity & LTP") |
| Card Title | Poppins | 16px | 600 | 1.35 | -0.01em | Question statement lead, option texts, score modal title |
| Body Text | Poppins | 14px | 400 | 1.6 | 0 | Flashcard verified model answers, quiz problem statements, rationale prose |
| Small Body | Poppins | 13px | 400 | 1.5 | 0 | Step descriptions, option subtext, shortcut hints |
| Caption / Micro | Poppins | 11px | 600 | 1.4 | +0.02em | Lecture source tag (`Lecture 14 [18:40]`), confidence score, key shortcuts |
| Tabular Code / Mono | SF Mono, JetBrains Mono | 12px | 600 | 1.4 | 0 | FSRS intervals (`1.2d`, `3.8d`, `8.5d`), queue counter (`Card 7 of 18`), timer (`08:42 / 25:00`) |

---

## Color Palette & Visual Tokens (60-30-10 Rule)

Directly mapped from Google Stitch design tokens in `src/styles/tokens.css`:

```
60% Dominant (Canvas & Backgrounds):
  --color-surface: #FBF8FF (Soft Apple lilac canvas)
  --color-surface-container-low: #F4F2FD (Translucent panel background)
  --color-surface-container: #EEEDF7 (Interactive row background)
  --color-surface-container-lowest: #FFFFFF (Pristine 3D card face fill)

30% Structural (Borders, Text & Dividers):
  --color-on-surface: #1A1B22 (Deep graphite typography)
  --color-on-surface-variant: #464555 (Muted slate secondary text)
  --color-outline: #777587 (Subtle border lines)
  --color-outline-variant: #C7C4D8 (Faint card perimeter strokes)

10% Accent (Interactive & Semantic Focus):
  --color-primary-container: #4F46E5 (Vibrant Indigo primary CTA & Good rating)
  --color-primary: #3525CD (Deep Indigo active tags & deck badges)
  --color-secondary: #006591 (Teal Hard rating & timecode pills)
  --color-secondary-container: #39B8FD (Vibrant cyan badge)
  --color-tertiary: #005338 (Deep Emerald Easy rating & correct answer feedback)
  --color-tertiary-container: #006E4B (Emerald badge fill)
  --color-error: #BA1A1A (Crimson Again rating, streak flame & incorrect option)
  --color-error-container: #FFDAD6 (Past exam alert & incorrect answer fill)
  --color-on-error-container: #93000A (Past exam alert title text)
```

---

## Layout & View Architectures

### 1. Unified Studio View (`ActiveRecallStudioView.tsx`)
- **Top Header Bar**:
  - Breadcrumbs: `LectureLens > Active Recall & Assessment Studio`
  - Engine Status Pill: Pulsing green dot with `Neural Rubric Adaptive Engine v3.4`
  - Sub-Tab Switcher: Segmented pill with `Flashcard Decks` (default) vs `Quiz Assessments`
  - Global Actions: "Anki Sync Now" button (with "2m ago" pill), "Generate from Lecture" modal CTA
- **Flashcards Tab Layout (`grid-cols-1 lg:grid-cols-12 gap-6`)**:
  - Top Strip (Full Width): `RetentionTelemetryStrip` with Queue Progress (28 Cards Due), 12-day streak flame, 94.2% stability, and SVG decay curve.
  - Left Centerpiece (col-span-8):
    - Deck Meta Bar with active deck badge (`DECK-BIO-14`), queue counter (`Card 7 of 18 in queue • 11 remaining`).
    - 3D Interactive Card Flip Container (`FlashcardDeckRunner.tsx`).
    - Docked 4-level FSRS Response Rating Bar (`FlashcardRatingBar.tsx`).
    - Session utility bar: Undo previous rating (`Z`), audio pronunciation, bury card.
  - Right Panel (col-span-4):
    - `RepetitionHorizonPanel`: 30-day review load forecast and memory stability factors.
- **Quiz Tab Layout (`grid-cols-1 lg:grid-cols-12 gap-6`)**:
  - Top Metric Strip (4 Stat Cards): Average Score (91.5%), Quizzes Completed (24), Mastery Level (88.4%), Upcoming Midterm Simulation.
  - Left Centerpiece (col-span-8):
    - Active Session Header: `LIVE DRILL`, `NEURO 301: Synaptic Plasticity`, Progress `Question 4 of 5`, Timer `08:42 / 25:00`.
    - Question Card: Topic tag, difficulty badge (`Exam Level (Hard)`), problem statement, and experimental setup diagram thumbnail.
    - 4 Option Cards (`QuizOptionCard.tsx`) with instant verification cues and expandable rationale.
    - Navigation: "Next Question →", "Flag Question", "Submit Assessment".
  - Right Panel (col-span-4):
    - Question palette grid (1-5 question jump dots) and cohort benchmark stats.

---

## Component Visual Specs

### 1. 3D Apple-Grade Flashcard Runner (`FlashcardDeckRunner.tsx`)
- **CSS 3D Engine**:
  ```css
  .card-3d-wrapper {
    perspective: 1000px;
    width: 100%;
  }
  .card-flip-inner {
    position: relative;
    width: 100%;
    min-height: 460px;
    transform-style: preserve-3d;
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 20px;
    cursor: pointer;
  }
  .card-flip-inner.is-flipped {
    transform: rotateY(180deg);
  }
  .card-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 20px;
    background: #FFFFFF;
    border: 1px solid rgba(199, 196, 216, 0.4);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .card-face-back {
    transform: rotateY(180deg);
  }
  ```
- **Front Face Anatomy**:
  - Header: Source tag pill `Lecture 14 [18:40] • Slide 22` (`Video` icon in Teal), Subtopic tag `LTP Induction Mechanism`, "Front" pill, Bookmark icon.
  - Body: Centered uppercase tag `Concept Recall Prompt`, 22px bold question text, bouncing `Space` key indicator ("Click card or press Space to reveal answer").
  - Footer: `Active Recall • FSRS-4.5` icon, "Click anywhere to flip".
- **Back Face Anatomy**:
  - Header: `Verified Model Answer` (`CheckCircle` in Emerald), `Recall Accuracy: 96%` monospaced tag, "Answer" pill, Edit button.
  - Body: Bold answer lead (*"Autophosphorylation at Threonine 286 (Thr286)."*), full physiological explanation, 2-step concept progression chips (*"Thr286 Phosphorylation → Unlocks Catalytic Domain"*).
  - Footer: "Select your recall quality below", "Keys 1 - 4".

### 2. Docked 4-Level FSRS Rating Bar (`FlashcardRatingBar.tsx`)
- **Container**: White rounded-2xl card docked below the 3D card with 1px border and soft shadow.
- **Shortcuts Indicator**: `Space: Flip • Keys 1-4: Rate`.
- **4 Action Buttons**:
  1. `Again` (Key 1): `<10m` tag, Crimson hover border and fill (`#FFDAD6`).
  2. `Hard` (Key 2): `1.2d` tag, Cyan/Teal hover border and fill (`#39B8FD/20`).
  3. `Good` (Key 3): `3.8d` tag, Primary Indigo background (`#4F46E5`), white text, Star icon, 2px ring.
  4. `Easy` (Key 4): `8.5d` tag, Emerald hover border and fill (`#006E4B/15`).

### 3. Quiz Option Card (`QuizOptionCard.tsx`)
- **Default State**: White card with 1px border `var(--color-outline-variant)`, letter badge (A, B, C, D) in Slate.
- **Hover State**: Background `var(--color-surface-container-low)`, subtle scale `1.01`.
- **Selected Correct State**:
  - Border: 2px solid var(--color-tertiary, #005338).
  - Background: `rgba(0, 83, 56, 0.06)`.
  - Icon: `CheckCircle2` in Emerald.
  - Letter Badge: Filled Emerald with white letter.
- **Selected Incorrect State**:
  - Border: 2px solid var(--color-error, #BA1A1A).
  - Background: `rgba(186, 26, 26, 0.06)`.
  - Icon: `XCircle` in Crimson.
  - Letter Badge: Filled Crimson with white letter.
- **Academic Rationale Card**:
  - Slides open beneath the selected option.
  - Emerald callout card citing lecture slide/transcript with detailed physiological explanation of why the answer is correct or incorrect.

### 4. Celebratory Quiz Score Modal (`QuizScoreModal.tsx`)
- **Trigger**: Displayed upon completing Question 5.
- **Confetti Effect**: Invokes `confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })`.
- **Score Header**: Large 48px bold percentage (`100%` or `80%`), "5 / 5 Correct" in Emerald.
- **Cohort Benchmark**: "Top 4% of Class • Prof. Henderson Midterm Benchmark".
- **Action CTAs**: "Review Missed Concepts", "Retake Quiz", "Return to Flashcards".

---

## Keyboard Controls & Accessibility

- **`Spacebar`**: Flip flashcard between front and back.
- **`1`**: Rate as "Again" (<10m).
- **`2`**: Rate as "Hard" (1.2d).
- **`3`**: Rate as "Good" (3.8d).
- **`4`**: Rate as "Easy" (8.5d).
- **`Z`**: Undo previous card rating.
- **ARIA Attributes**: `aria-expanded` on card flip, `role="radiogroup"` on quiz options, `aria-live="polite"` on quiz feedback announcements.
