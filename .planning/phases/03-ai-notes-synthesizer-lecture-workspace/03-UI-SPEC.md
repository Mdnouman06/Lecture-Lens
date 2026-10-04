---
phase: "3"
slug: "ai-notes-synthesizer-lecture-workspace"
status: draft
shadcn_initialized: false
preset: "apple-hig-glassmorphism"
created: "2026-09-28"
---

# Phase 3 — UI Design Contract: AI Notes Synthesizer & Lecture Workspace

> Visual and interaction contract for Phase 3 (AI Notes Synthesizer & Lecture Workspace).
> Derived from Google Stitch project `projects/11893050174269724482` (screen `840927a0efce4abc8d510d560c1d5994` — *"Lecture Processing & AI Notes — LectureLens"*) and refined per Apple Human Interface Guidelines and `design-taste-frontend`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Custom Design System (Stitch Tokens + Vanilla CSS Modules) |
| Preset | Apple HIG Glassmorphism (Frosted acrylic surfaces, subtle 1px borders, gentle elevations) |
| Component library | None (Framework-free native React components) |
| Icon library | `lucide-react` (Strict 1.5px stroke width throughout) |
| Font | Poppins (Google Fonts) globally; JetBrains Mono / SF Mono for timecodes, formulas & derivations |

---

## Component Inventory

> Custom component architecture implementing Google Stitch screen `840927a0efce4abc8d510d560c1d5994`.
> Screen title: *"Lecture Processing & AI Notes — LectureLens"* (Width: 2560px, Height: 3120px).

| Component | Import Path | Notes |
|-----------|-------------|-------|
| `LectureWorkspaceView` | `src/views/LectureWorkspaceView.tsx` | Main reading & notes workspace mounted in `App.tsx` when `activeView === 'workspace'` |
| `AudioScrubDeck` | `src/components/workspace/AudioScrubDeck.tsx` | Synchronized audio scrub bar with media controls, timecodes, speaker chips, speed picker, and 70-bar interactive waveform |
| `DiarizedTranscriptViewer` | `src/components/workspace/DiarizedTranscriptViewer.tsx` | Left column (~42% width) with live search and match counter, auto-scroll toggle, speaker cards, and active spoken line highlight |
| `SmartNotesWorkspace` | `src/components/workspace/SmartNotesWorkspace.tsx` | Right column (~58% width) with segmented note tabs, highlight palette, editable markdown toggle, and margin notes block |
| `ExecutiveNotesTab` | `src/components/workspace/ExecutiveNotesTab.tsx` | Executive abstract and Hebbian Synapse conceptual anchors with jump-to-timestamp links |
| `StructuredNotesTab` | `src/components/workspace/StructuredNotesTab.tsx` | Detailed study notes with markdown headers, LaTeX/monospaced formula callout boxes, and numbered sequences |
| `KeyConceptsTab` | `src/components/workspace/KeyConceptsTab.tsx` | Quick-review definitions card grid with mastery status indicators and exam alert badges |
| `SlideArtifactsTab` | `src/components/workspace/SlideArtifactsTab.tsx` | Attached slide deck thumbnails gallery with expandable scientific 3D diagram card |
| `BottomIntelligenceDock` | `src/components/workspace/BottomIntelligenceDock.tsx` | Floating bottom dock highlighting exam relevance ("NMDA Mg²⁺ block appeared on 2022 & 2024 Midterms") |

---

## Spacing Scale

Strictly adheres to the 4px baseline grid:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Internal icon-to-label gaps, badge paddings, waveform bar gaps |
| sm | 8px | Tab switcher padding, media control button gap, speaker chip padding |
| md | 16px | Standard card padding, audio deck padding, transcript block spacing |
| lg | 24px | Workspace split-pane grid gap, section divisions, modal body padding |
| xl | 32px | Sub-header bottom margin, main container padding |
| 2xl | 48px | Workspace bottom padding, docked dock clearance |
| 3xl | 64px | Page-level outer boundaries on ultra-wide screens |

---

## Typography

Universal typography strictly powered by **Poppins** with optical tracking and tabular numerals for timecodes:

| Role | Font Family | Size | Weight | Line Height | Tracking | Usage |
|------|-------------|------|--------|-------------|----------|-------|
| Title / Headline | Poppins | 24px | 700 | 1.25 | -0.02em | Lecture main title in ribbon |
| Section Header | Poppins | 18px | 600 | 1.3 | -0.015em | Section headings in smart notes, transcript column header |
| Card Title | Poppins | 15px | 600 | 1.35 | -0.01em | Speaker names, concept titles, equation callout headers |
| Body Text | Poppins | 14px | 400 | 1.6 | 0 | Transcript paragraphs, study note prose |
| Small Body | Poppins | 13px | 400 | 1.5 | 0 | Sub-captions, metadata descriptions, formula subtext |
| Caption / Micro | Poppins | 11px | 600 | 1.4 | +0.02em | Section tags (`SEC 01`), diarization chips, status badges |
| Tabular Code / Mono | SF Mono, JetBrains Mono | 12px | 600 | 1.4 | 0 | Audio timecodes (`04:18 / 52:30`), LaTeX formulas (`ΔV = (Q/C)...`) |

---

## Color Palette & Visual Tokens (60-30-10 Rule)

Directly mapped from Google Stitch tokens in `src/styles/tokens.css`:

```
60% Dominant (Canvas & Backgrounds):
  --color-surface: #FBF8FF (Soft Apple lilac canvas)
  --color-surface-container-low: #F4F2FD (Translucent panel background)
  --color-surface-container-lowest: #FFFFFF (Pristine card fill)

30% Structural (Borders, Text & Dividers):
  --color-on-surface: #1A1B22 (Deep graphite typography)
  --color-on-surface-variant: #464555 (Muted slate secondary text)
  --color-outline: #777587 (Subtle border lines)
  --color-outline-variant: #C7C4D8 (Faint card perimeter strokes)

10% Accent (Interactive & Semantic Focus):
  --color-primary-container: #4F46E5 (Vibrant Indigo primary CTA & playhead)
  --color-primary: #3525CD (Deep Indigo active speaker & links)
  --color-primary-fixed: #E2DFFF (Soft lavender highlight pill)
  --color-secondary: #006591 (Teal secondary speaker & highlight)
  --color-tertiary-container: #006E4B (Emerald sync verification & highlight)
```

---

## Workspace Layout & Grid Hierarchy

1. **Top Sub-header & Lecture Ribbon**:
   - Breadcrumb trail (`LectureLens > NEURO 301 > Lecture 14`).
   - Latency / status pill: `Synced & Verified` and `Whisper-v3 Diarized`.
   - Title: `Synaptic Plasticity & Long-Term Potentiation (LTP)`.
   - Utility action bar: `Export` (PDF/Markdown/Notion/Anki), `Share`, `AI Copilot` toggle, and `Focus Mode` toggle.

2. **Synchronized Audio Scrub Deck**:
   - Media controls: `Replay 10s`, large `Play/Pause` toggle with elevation, `Forward 10s`.
   - Timecode display: `04:18 / 52:30` (tabular numerals).
   - Speaker Chip: `Prof. Henderson • NMDA Kinetics`.
   - Speed Segmented Control: `1.0x`, `1.25x`, `1.5x`, `2.0x`.
   - Interactive Waveform: 70 vertical bars with gradient fill and draggable playhead scrubber. Clicking any bar seeks playback and jumps the transcript line.

3. **Dual-Column Flagship Split-Grid**:
   - **Left Column (42% width, ~5 of 12 cols)**: `DiarizedTranscriptViewer`
     - Live search bar with real-time match counter ("3 matches") and instant term highlight.
     - Auto-scrolling toggle with status indicator.
     - Timestamped speaker cards (`Prof. Henderson`, `Student (Sarah Chen)`).
     - Active spoken line with ambient indigo glow and quick inline action toolbar:
       - `Make Card` (generates flashcard draft).
       - `Ask AI` (opens tutor query grounded in this sentence).
       - `Highlight` (applies student annotation color).
       - `Copy Timestamp` (`[04:12]`).
     - "Download Full VTT / TXT" action.
   - **Right Column (58% width, ~7 of 12 cols)**: `SmartNotesWorkspace`
     - Tab navigation: `Executive Notes`, `Derivations & Formulas`, `Takeaways (Key Concepts)`, `Slide Artifacts`.
     - Highlighter palette: Teal, Lavender, Mint.
     - Inline Edit mode toggle (switch between rendered Markdown and editable Markdown textarea).
     - Section cards with LaTeX monospaced equations and numbered sequence steps.
     - Margin Notes placeholder with `⌘N` shortcut trigger.

4. **Docked Intelligence Strip**:
   - Fixed to bottom center: Apple-style floating pill with 24px backdrop blur.
   - High Exam Relevance flag: *"NMDA Mg²⁺ block mechanism appeared on 2022 & 2024 Midterms (Question #4)"*.
   - Quick action to open AI Tutor or Jump to Flashcards.

---

## Responsive Breakpoints & Adaptations

- **Desktop (>= 1200px)**: 12-column dual-pane layout (Left 5 cols for Transcript, Right 7 cols for Smart Notes).
- **Tablet (< 1200px)**: Stacked single-column layout with sticky segment switcher between Transcript and Smart Notes.
- **Mobile (< 768px)**: Compact audio scrub deck with essential controls, full-width tabbed reading view, and bottom floating exam relevance badge.

---

## Verification & Polish Checklist

- [ ] Universal Poppins font embedded across all elements with zero unstyled serif/sans fallbacks.
- [ ] Frosted acrylic surfaces (`backdrop-filter: blur(20px)`) applied on audio deck and bottom dock.
- [ ] Active spoken transcript line smoothly highlights with ambient glow and quick action toolbar.
- [ ] Audio waveform accurately displays 70 bars with gradient progress fill and draggable scrub node.
- [ ] Notes toggle cleanly between formatted Markdown view and in-place editable textarea.
- [ ] Multi-format export (Markdown, PDF, Notion, Anki) functions smoothly.
- [ ] `tsc -b && vite build` succeeds with zero errors.
