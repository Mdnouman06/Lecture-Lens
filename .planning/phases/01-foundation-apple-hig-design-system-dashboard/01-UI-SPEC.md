---
phase: "1"
slug: "foundation-apple-hig-design-system-dashboard"
status: draft
shadcn_initialized: false
preset: "apple-hig-glassmorphism"
created: "2026-09-28"
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for Phase 1 (Foundation, Apple HIG Design System & Dashboard).
> Derived from Google Stitch project `projects/11893050174269724482` (screen `d9c68082013048039fecbeedb5afeb83`) and refined per `design-taste-frontend`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Custom Design System (Stitch Tokens + Vanilla CSS Modules) |
| Preset | Apple HIG Glassmorphism (Honest Web Approximation) |
| Component library | None (Framework-free native React components) |
| Icon library | `lucide-react` (Strict 1.5px stroke width throughout) |
| Font | Poppins (Google Fonts) globally; JetBrains Mono / SF Mono for timecodes & LaTeX |

---

## Component Inventory

> Custom component architecture implementing Google Stitch screen `d9c68082013048039fecbeedb5afeb83`.

Enumerated by manual extraction from Stitch project `projects/11893050174269724482` on 2026-09-28.

| Component | Import Path | Notes |
|-----------|-------------|-------|
| `Shell` | `src/components/layout/Shell.tsx` | Main responsive 3-pane desktop grid wrapper |
| `Sidebar` | `src/components/layout/Sidebar.tsx` | 240px navigation rail with active glow indicator, workspace tag, and storage meter |
| `Header` | `src/components/layout/Header.tsx` | Breadcrumbs, live Local AI status pill, `⌘K` search bar, and "+ Upload Lecture" CTA |
| `WelcomeBanner` | `src/components/dashboard/WelcomeBanner.tsx` | Student greeting, exam countdown chip, retention readiness badge, and resume quick action |
| `BentoStats` | `src/components/dashboard/BentoStats.tsx` | 4-card metric strip (Study Velocity with SVG sparkline, Digital Corpus, Mastery, 14-Day Streak with day pills) |
| `IntelligenceHub` | `src/components/dashboard/IntelligenceHub.tsx` | Quick action cards linking to Smart Notes, AI Tutor, Quizzes, Flashcards, and PYQs |
| `RecentLectures` | `src/components/dashboard/RecentLectures.tsx` | Course filter pills, dropzone upload bar, and lecture cards with status tags & actions |
| `LocalAiModal` | `src/components/common/LocalAiModal.tsx` | Frosted dialog with terminal launch instructions, ping latency, and demo data switch |
| `GlassCard` | `src/components/common/GlassCard.tsx` | Reusable Apple HIG frosted card container with highlight border and subtle shadow |
| `StatusBadge` | `src/components/common/StatusBadge.tsx` | Semantic pill indicators (Synced, Live, Due, High Probability) |

---

## Spacing Scale

Declared values (multiples of 4 strictly enforced):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Internal icon-to-label gaps, badge paddings, audio waveform bar spacing |
| sm | 8px | Form input inner padding, filter pill padding, list item gaps |
| md | 16px | Standard card internal padding, button spacing, standard layout grid gap |
| lg | 24px | Major card container padding, section header gaps, modal body padding |
| xl | 32px | Primary section divisions, hero card margins |
| 2xl | 48px | Landmark separation, bottom dashboard viewport padding |
| 3xl | 64px | Page-level outer boundaries on ultra-wide screens |

Exceptions:
- None. All spacing increments adhere to the 4px baseline grid.

---

## Typography

Universal typography strictly powered by **Poppins** with optical tracking:

| Role | Font Family | Size | Weight | Line Height | Tracking | Usage |
|------|-------------|------|--------|-------------|----------|-------|
| Display | Poppins | 36px | 700 (Bold) | 1.15 | `-0.02em` | Large KPI numbers ("94.2%", "38", "24.5h") |
| Headline | Poppins | 24px | 600 (SemiBold) | 1.3 | `-0.015em` | Page greetings ("Welcome back, Alex") & section headers |
| Title | Poppins | 16px | 600 (SemiBold) | 1.4 | `-0.01em` | Lecture titles, card titles, button labels |
| Body | Poppins | 14px | 400 (Regular) | 1.6 | `-0.005em` | Lecture descriptions, explanatory paragraphs, summaries |
| Label | Poppins | 12px | 500 (Medium) | 1.35 | `+0.01em` | Filter pills, status badges, secondary metadata |
| Micro | Poppins | 11px | 600 (SemiBold) | 1.3 | `+0.02em` | Course codes ("NEURO 301"), small tags |
| Code / Timecode | JetBrains Mono / SF Mono | 12px | 500 (Medium) | 1.4 | `0em` | Audio timestamps ("48:12 / 52:30"), keyboard shortcuts (`⌘K`) |

---

## Color: 60-30-10 Rule Distribution

| Role | Share | Value | Usage |
|------|-------|-------|-------|
| **Dominant** | **60%** | `#FBF8FF` (Canvas), `#FFFFFF` (Surface Container Lowest) | Viewport background, main panel surface, lecture card white bases |
| **Secondary** | **30%** | `#F4F2FD` (Tonal Inset), `rgba(255, 255, 255, 0.78)` (Glass), `#EEEDF7` (Input Tracks), `#E4E4E7` (Dividers) | Navigation rail backdrop, header glass bar, card wells, neutral borders |
| **Accent** | **10%** | `#4F46E5` (Primary Indigo) & `#0EA5E9` (Sky Blue) | Interactive focal points, active states, and audio indicators ONLY |
| **Semantic Mastery** | Supplemental | `#10B981` (Emerald) / `#D1FAE5` (Mint bg) | "Synced & Verified" badges, retention score gains, checkmarks |
| **Destructive** | Supplemental | `#BA1A1A` (Text) / `#FFDAD6` (Container) | Danger dialogs, lecture deletion confirmation |

### Accent Reservation Rule
`--color-primary-container` (`#4F46E5`) is strictly reserved for:
1. Primary `+ Upload Lecture` button in the top header
2. Active navigation link background tile in the sidebar (`Sidebar.tsx`)
3. `Resume Active Lecture` primary button in the welcome banner
4. Search focus ring (`0 0 0 3px rgba(79, 70, 229, 0.15)`)
5. Audio progress bar elapsed indicator

It must **never** be used for general body text, card borders, or inactive navigation icons.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| **Primary Header CTA** | `+ Upload Lecture` |
| **Quick Action 1** | `Resume Active Lecture` (subcopy: `04:18 left`) |
| **Quick Action 2** | `Review Flashcards` (badge: `28 due`) |
| **Quick Action 3** | `Ask Tutor` |
| **Quick Action 4** | `Import PYQ` |
| **Search Placeholder** | `Search lectures, transcripts, concepts...` |
| **Dropzone Headline** | `Drop lecture recording or lecture slides here` |
| **Dropzone Subcopy** | `MP4, M4A, Zoom recordings, or PDF slide decks • AI transcription in <60s` |
| **Local AI Status (Online)** | `🟢 Local AI Ready (Ollama + Whisper)` |
| **Local AI Status (Offline)** | `🟡 Demo Mode (Local AI Offline)` |
| **Empty State Heading** | `No Lectures Indexed Yet` |
| **Empty State Body** | `Drop a PDF slide deck or audio recording above to generate your first set of structured notes and flashcards.` |
| **Error State** | `Cannot connect to local AI service at http://localhost:8000. Operating in Interactive Demo Mode with pre-seeded sample courses.` |
| **Destructive Confirmation** | `Delete Lecture: Are you sure you want to delete this lecture? All generated summaries and flashcards will be permanently removed.` |

---

## UI Considerations

> State coverage across primary Phase 1 surfaces.

Applicable state considerations resolved: 5 covered, 2 backstop, 0 unresolved.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| `empty` | `RecentLectures` | ✅ covered | When no lectures exist, render the clean dropzone card with the documented empty state copy and a "Load Sample Lectures" shortcut button. |
| `loading` | `RecentLectures` | ✅ covered | On initial load or filter switch, render 3 glassmorphic skeleton shimmer cards with pulse animations. |
| `error` | `LocalAiHealth` | ✅ covered | If `http://localhost:8000/health` fails, set header status pill to `🟡 Demo Mode` and trigger a non-blocking toast inviting the user to view setup instructions. |
| `long-text` | `LectureCard` | ✅ covered | Lecture titles truncate at 2 lines (`line-clamp-2`); description truncated at 1 line (`line-clamp-1`) with ellipsis. |
| `partial` | `BentoStats` | ✅ covered | When a new course has no audio duration or flashcards yet, display `—` instead of `0.0%` or broken NaN figures. |
| `overflow` | `Sidebar` | 🧪 backstop | On screens < 1200px width, sidebar collapses to icon-only rail (68px); on screens < 768px, sidebar hides behind mobile hamburger drawer. |
| `focus-visible` | All buttons & inputs | 🧪 backstop | Keyboard navigation reveals a prominent 2px indigo outline offset by 2px (`outline: 2px solid #4F46E5; outline-offset: 2px;`). |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| None (Vanilla CSS) | Custom CSS Modules | Built from validated design tokens; no third-party registry vulnerabilities |
| Google Fonts | Poppins (400, 500, 600, 700) | Standard Google Fonts stylesheet embed in `index.html` with `display=swap` |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS (Specific action verbs, precise empty/error/destructive strings)
- [x] Dimension 2 Visuals: PASS (Strict 4px spacing scale, honest Apple glassmorphism approximation)
- [x] Dimension 3 Color: PASS (60-30-10 distribution respected; accent explicitly reserved)
- [x] Dimension 4 Typography: PASS (Global Poppins font hierarchy with monospace tabular exception)
- [x] Dimension 5 Spacing: PASS (Strict 4px/8px multiples, no arbitrary margin hacks)
- [x] Dimension 6 Registry Safety: PASS (No unvetted third-party blocks)
- [x] Dimension 7 Inventory Provenance: PASS (Extracted directly from Stitch project 11893050174269724482)

**Approval:** approved 2026-09-28
