---
phase: "4"
slug: "context-grounded-ai-tutor-copilot"
status: approved
shadcn_initialized: false
preset: "apple-hig-glassmorphism"
created: "2026-09-28"
---

# Phase 4 — UI Design Contract: Context-Grounded AI Tutor Copilot

> Visual and interaction contract for Phase 4 (Context-Grounded AI Tutor Copilot).
> Derived directly from Google Stitch project `projects/11893050174269724482` (screen `94b81da265c04d268fbca4274f1ce534` — *"AI Tutor & Smart Search — LectureLens"*) and refined per Apple Human Interface Guidelines and `design-taste-frontend`.

---

## Design System & Foundation

| Property | Value |
|----------|-------|
| Tool | Custom Design System (Stitch Tokens + Vanilla CSS Modules in `src/styles/tutor.css`) |
| Preset | Apple HIG Glassmorphism (Frosted acrylic surfaces, subtle 1px border lines, soft 0 1px 8px shadows) |
| Component library | None (Framework-free native React 19 components with TypeScript) |
| Icon library | `lucide-react` (Strict 1.5px stroke width throughout, unified academic iconography) |
| Font | **Poppins** (Google Fonts) applied universally across all UI elements; SF Mono / JetBrains Mono for timecodes, vector dimensions, and latency badges |

---

## Component Inventory

> Custom component architecture implementing Google Stitch screen `94b81da265c04d268fbca4274f1ce534` (*"AI Tutor & Smart Search — LectureLens"*, Width: 2560px, Height: 3034px).

| Component | File Path | Role & Purpose |
|-----------|-----------|----------------|
| `AiTutorView` | `src/views/AiTutorView.tsx` | Dedicated full-page workspace for cross-semester semantic intelligence, knowledge scoping, and AI tutoring (sidebar route `tutor`). |
| `AiTutorDrawer` | `src/components/tutor/AiTutorDrawer.tsx` | Slide-over 440px contextual drawer embedded inside `LectureWorkspaceView` for frictionless side-by-side tutoring during lecture review. |
| `TutorDialogueStream` | `src/components/tutor/TutorDialogueStream.tsx` | Interactive conversation thread rendering student questions and rich conceptual synthesis responses with auto-scroll. |
| `TutorSynthesisBubble` | `src/components/tutor/TutorSynthesisBubble.tsx` | Rich AI response card featuring topic badge, synthesis latency ("1.4s"), 3-step sequence breakdown, citations, PYQ alert, and follow-ups. |
| `CitationCard` | `src/components/tutor/CitationCard.tsx` | Multimodal citation card with "Listen (XXs)" CTA button, timecode range, quote snippet, and "Open Transcript" seek link. |
| `TutorInputDeck` | `src/components/tutor/TutorInputDeck.tsx` | Bottom sticky floating deck with prompt shortcuts, model selector pill ("Intelligence 2.5"), multi-line input, audio dictate, and send action. |
| `KnowledgeScopeFilter` | `src/components/tutor/KnowledgeScopeFilter.tsx` | Left column filter panel with course and document checkboxes (Enrolled Courses, Transcripts, Formula Decks, PYQ Rubrics). |
| `RecentQueriesList` | `src/components/tutor/RecentQueriesList.tsx` | Left column query history list with relative timecodes and click-to-rerun actions. |
| `VectorCorpusStatus` | `src/components/tutor/VectorCorpusStatus.tsx` | Left column card showing "100% Embedded" status, 38 tracks / 2,410 pages, 1,536-d HNSW dimension, and indexed books/slides. |

---

## Spacing Scale

Strictly adheres to the 4px baseline grid:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Internal icon-to-label gaps, badge paddings, prompt shortcut chip gap |
| `sm` | 8px | Action button padding, knowledge scope row padding, citation header gap |
| `md` | 16px | Standard card padding, input deck inner padding, bubble message padding |
| `lg` | 24px | Left/right panel column gap, section dividers, drawer header/footer padding |
| `xl` | 32px | Header bottom margin, full-view outer horizontal padding |
| `2xl` | 48px | Bottom clearance for floating input deck, page bottom padding |

---

## Typography Scale

Universal typography powered strictly by **Poppins** with optical tracking and tabular numerals for timecodes and latencies:

| Role | Font Family | Size | Weight | Line Height | Tracking | Usage |
|------|-------------|------|--------|-------------|----------|-------|
| Display / Headline | Poppins | 28px | 700 | 1.25 | -0.025em | Main view title ("AI Tutor & Cross-Semester Semantic Search") |
| Section Header | Poppins | 18px | 600 | 1.3 | -0.015em | Panel headers, knowledge scope title, synthesis section titles |
| Card Title | Poppins | 15px | 600 | 1.35 | -0.01em | Citation titles, 3-step sequence card headers, PYQ alert title |
| Body Text | Poppins | 14px | 400 | 1.6 | 0 | Dialogue prose, tutor explanations, user prompt text |
| Small Body | Poppins | 13px | 400 | 1.5 | 0 | Citation quote snippets, scope sub-descriptions, prompt shortcut text |
| Caption / Micro | Poppins | 11px | 600 | 1.4 | +0.02em | Discipline badge (`Cellular Neurobiology`), scope tag (`PYQ`), follow-up labels |
| Tabular Code / Mono | SF Mono, JetBrains Mono | 12px | 600 | 1.4 | 0 | Latency badge (`Synthesized in 1.4s`), timecodes (`04:12 - 04:58`), vector dimension (`1,536-d HNSW`) |

---

## Color Palette & Visual Tokens (60-30-10 Rule)

Mapped directly from Google Stitch design tokens in `src/styles/tokens.css`:

```
60% Dominant (Canvas & Backgrounds):
  --color-surface: #FBF8FF (Soft Apple lilac canvas)
  --color-surface-container-low: #F4F2FD (Translucent panel background)
  --color-surface-container: #EEEDF7 (Interactive row background)
  --color-surface-container-lowest: #FFFFFF (Pristine card fill)

30% Structural (Borders, Text & Dividers):
  --color-on-surface: #1A1B22 (Deep graphite typography)
  --color-on-surface-variant: #464555 (Muted slate secondary text)
  --color-outline: #777587 (Subtle border lines)
  --color-outline-variant: #C7C4D8 (Faint card perimeter strokes)

10% Accent (Interactive & Semantic Focus):
  --color-primary-container: #4F46E5 (Vibrant Indigo primary CTA & playhead)
  --color-primary: #3525CD (Deep Indigo active badges & links)
  --color-primary-fixed: #E2DFFF (Soft lavender citation pill)
  --color-secondary: #006591 (Deep Teal secondary speaker & listen CTA)
  --color-secondary-container: #39B8FD (Vibrant cyan badge)
  --color-tertiary: #005338 (Deep Emerald mastery & vector status)
  --color-tertiary-container: #006E4B (Emerald badge fill)
  --color-error: #BA1A1A (High-yield exam alert border & icon)
  --color-error-container: #FFDAD6 (Past exam alert background)
  --color-on-error-container: #93000A (Past exam alert title text)
```

---

## Layout & View Architectures

### 1. Dedicated Full-Page Workspace (`AiTutorView.tsx`)
Direct implementation of Stitch screen `94b81da265c04d268fbca4274f1ce534`:
- **Top Header Bar**:
  - Breadcrumbs: `LectureLens > Workspace > AI Tutor`
  - Engine Status Pill: Pulsing green dot with `Neural Retrieval Engine Online • Fall 2025`
  - Mode Switcher Segmented Control: `Tutor Dialogue Mode` (default) vs `Deep Semantic Search`
- **Main 12-Column Grid (`grid-cols-1 xl:grid-cols-12 gap-6`)**:
  - **Left Sidebar (col-span-4)**:
    - Card 1: `KnowledgeScopeFilter` with course checkboxes (`All 4 Enrolled Courses`, `NEURO 301 Transcripts`, `PHYS 402 Formula Decks`, `Past 5-Year Exam Rubrics [PYQ]`).
    - Card 2: `RecentQueriesList` with search history (`LTP Calcium cascade (2h ago)`, `Bloch sphere state vector (Yesterday)`).
    - Card 3: `VectorCorpusStatus` with `100% Embedded` badge, document list (`Kandel 6th Ed`, `Henderson Slides`, `Whisper Audio`), and `1,536-d (HNSW)` dimension chip.
  - **Right Main Panel (col-span-8)**:
    - Session Header: Model badge (`Intelligence v2.5 High Reasoning`), active ground truth indicator, session restart button, and export conversation button.
    - Conversation Thread: User message bubbles and AI response cards.
    - Floating Sticky Input Deck: Prompt shortcuts, multi-line input textarea, file attachment button, dictate button, and submit button.

### 2. Slide-over Contextual Drawer (`AiTutorDrawer.tsx`)
Integrated inside `LectureWorkspaceView`:
- **Width**: `440px` (smooth slide-in from right edge, `transform: translateX(0)` with 280ms cubic-bezier transition).
- **Header**:
  - Lecture Context Pill: Active lecture title (`NEURO 301 • Lec 14: Synaptic Plasticity & LTP`).
  - Close button (`X` icon or `Esc` key).
  - Clear conversation button (`RotateCcw`).
- **Body**:
  - Pre-seeded question suggestions based on active lecture.
  - Compact message thread with streamlined citation cards.
  - Seamless jump to audio playback: Clicking "Listen" in the drawer immediately updates the main workspace's audio scrub deck and scrolls the transcript line into view.
- **Footer**: Compact prompt input box with "Ask active lecture..." placeholder and send button.

---

## Component Visual Specs

### 1. Student User Message Bubble
- **Alignment**: Right-aligned, max-width `75%`.
- **Background**: `var(--color-surface-container-high)` (#E8E7F1), rounded-2xl with bottom-right corner sharp (`rounded-br-xs`).
- **Typography**: Poppins 14px, line-height 1.6, color `var(--color-on-surface)`.
- **Meta Footer**: Right-aligned timestamp (`10:42 AM`) with double checkmark icon (`CheckCheck` in 14px slate).

### 2. AI Tutor Response Card (`TutorSynthesisBubble`)
- **Alignment**: Left-aligned, full width with 32px circular gradient avatar (`Sparkles` icon in Indigo).
- **Surface**: `var(--color-surface-container-low)` (#F4F2FD) with 1px border `rgba(79, 70, 229, 0.08)` and rounded-2xl (`rounded-tl-xs`).
- **Header**:
  - Discipline Pill: `Cellular Neurobiology` with purple dot.
  - Title: `Conceptual Synthesis`.
  - Latency Pill: Monospaced `Synthesized in 1.4s` on the right.
- **Body Content**:
  - Rich narrative explanation formatted with bold keywords.
  - **3-Step Sequence Card Grid (`grid grid-cols-1 md:grid-cols-3 gap-3 my-3`)**:
    - Step 1: `Presynaptic` (Icon: `Radio` in Indigo, Action potential triggers glutamate release).
    - Step 2: `Postsynaptic` (Icon: `Zap` in Teal, AMPA receptor depolarizes dendritic spine to -30 mV).
    - Step 3: `Coincidence` (Icon: `RefreshCw` in Mint, Electrostatic expulsion of Mg²⁺ block allows Ca²⁺ influx).
  - Hebbian Postulate closing summary.

### 3. Direct Multimodal Citation Cards (`CitationCard`)
- **Grid Layout**: 2-column responsive grid (`grid grid-cols-1 md:grid-cols-2 gap-3 mt-3`).
- **Surface**: `var(--color-surface-container-lowest)` (#FFFFFF) with 1px border `var(--color-outline-variant)` and gentle hover elevation (`box-shadow: 0 4px 12px rgba(0,0,0,0.06)`).
- **Card Header**:
  - Source Pill: `NEURO 301 • Lec 14` (Lavender pill) or `Kandel Textbook` (Slate pill).
  - Timecode / Section: Monospaced `04:12 - 04:58` or `Ch. 67 • p. 1422`.
- **Card Title**: `Prof. Henderson: "The Mg2+ Ion Plug"` or `Principles of Neural Science (6th Ed.)`.
- **Quote Snippet**: Italicized 2-line clamped excerpt with subtle quotes.
- **Card Footer**:
  - **Primary CTA**: Button `Listen (46s)` with `Play` icon in Teal (`#006591`), text `#FFFFFF`.
  - **Secondary Action**: Clickable link `Open Transcript ↗` or `View Excerpt ↗`.
  - Relevance Score: `High Relevance 98%`.

### 4. High-Yield Past Exam Alert (PYQ Alert)
- **Surface**: `var(--color-error-container)` (#FFDAD6) at 60% opacity with 1px border `rgba(186, 26, 26, 0.2)` and rounded-xl padding.
- **Icon**: `AlertTriangle` in Crimson Red (`#BA1A1A`) 20px.
- **Title**: `High-Yield Past Exam Alert (PYQ)` in bold Crimson Red.
- **Description**: "This exact molecular mechanism appeared in **Question 3B of the 2023 Midterm** ('Explain how Mg²⁺ block removal facilitates LTP'). Average cohort score was only **68%** due to students missing the simultaneous membrane depolarization step."

### 5. Recommended Follow-up Chips
- **Layout**: Horizontal flex wrap with label `Recommended Follow-ups:`.
- **Chip 1**: `Generate 3 Flashcards on this` with `Layers` icon in Indigo (bridges directly to Phase 5 Flashcards).
- **Chip 2**: `Test me with a hard MCQ` with `HelpCircle` icon in Teal (bridges directly to Phase 5 Quizzes).
- **Chip 3**: `Add to Midterm Review Sheet` with `BookmarkPlus` icon in Mint.
- **Style**: White pill with subtle border, 12px Poppins font, hover elevation.

### 6. Floating Input Deck (`TutorInputDeck`)
- **Container**: Sticky bottom card with `backdrop-filter: blur(20px)` and gentle top border.
- **Prompt Shortcuts Bar**: Horizontal scrollable chips:
  - `Derive formula`
  - `Explain simply`
  - `Find exam question`
  - `Give a real-world analogy`
- **Input Box**:
  - Multi-line textarea (auto-expands up to 160px).
  - Placeholder: `Ask anything across your lectures, slides, and syllabus...`
  - Left Toolbar: Model pill `Intelligence 2.5 High Reasoning` (`Sparkles`), `Paperclip` attachment, `Mic` dictate button.
  - Right Action: Keyboard shortcut hint `Return ↵ to query` + circular Indigo send button (`ArrowUp` icon) with active scale transition.

---

## Interaction States & Micro-interactions

| Element | Interaction State | Visual Feedback |
|---------|-------------------|-----------------|
| **Citation "Listen" Button** | Hover | Opacity 92%, subtle scale `1.02` |
| **Citation "Listen" Button** | Click | Triggers audio playback seek in `LectureWorkspaceView` at `timeStart`, visual feedback checkmark |
| **Prompt Shortcut Chip** | Click | Populates input textarea instantly, focuses cursor, smoothly scrolls to bottom |
| **Follow-up Chip** | Click | Dispatches new tutor query or triggers milestone action notification |
| **Send Button** | Hover / Active | Background `#4338CA`, active scale `0.96` |
| **AI Synthesis Card** | Streaming State | Pulsing three-dot indicator or progressive word streaming with simulated latency |
| **Slide-over Drawer** | Open / Close | CSS transform slide from `translateX(100%)` to `translateX(0)` with 280ms cubic-bezier(0.16, 1, 0.3, 1) |

---

## Responsive Breakdowns

| Viewport | Layout Strategy |
|----------|-----------------|
| **Desktop Ultra-wide (>1440px)** | Full 12-column grid (4 cols left knowledge panel, 8 cols right conversation thread). Drawer 460px in workspace. |
| **Desktop Standard (1024px - 1439px)** | 12-column grid with compact cards. Drawer 400px in workspace. |
| **Tablet (<1024px)** | Stacked layout: Top knowledge scope pills in horizontal scrollbar; full-width conversation thread below. Drawer overlays workspace at 100% width. |

---

## Accessibility & Keyboard Shortcuts

- **`Enter`**: Submit prompt in textarea (unless `Shift` is held).
- **`Shift + Enter`**: Insert line break in textarea.
- **`⌘K` / `Ctrl+K`**: Global shortcut focusing the AI Tutor input from anywhere in the app.
- **`Esc`**: Close the slide-over AI Tutor drawer.
- **ARIA Attributes**: `aria-expanded` on drawer, `role="log"` on dialogue stream, `aria-live="polite"` on AI response streaming.
