---
phase: "2"
slug: "local-ai-bridge-multimodal-ingestion-hub"
status: draft
shadcn_initialized: false
preset: "apple-hig-glassmorphism"
created: "2026-09-28"
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for Phase 2 (Local AI Bridge & Multimodal Ingestion Hub).
> Derived from Google Stitch project `projects/11893050174269724482` (screen `402b1ce7bbd84b36bd262a1f528d857b`) and refined per `design-taste-frontend`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Custom Design System (Stitch Tokens + Vanilla CSS Modules) |
| Preset | Apple HIG Glassmorphism (Honest Web Approximation) |
| Component library | None (Framework-free native React components) |
| Icon library | `lucide-react` (Strict 1.5px stroke width throughout) |
| Font | Poppins (Google Fonts) globally; JetBrains Mono / SF Mono for timecodes & code |

---

## Component Inventory

> Custom component architecture implementing Google Stitch screen `402b1ce7bbd84b36bd262a1f528d857b`.
> Enumerated from Stitch project `projects/11893050174269724482` on 2026-09-28.

| Component | Import Path | Notes |
|-----------|-------------|-------|
| `IngestionHubView` | `src/views/IngestionHubView.tsx` | Main multimodal ingestion workspace in the sidebar rail (`ingest` view) with dual-pane layout |
| `UploadLectureModal` | `src/components/ingestion/UploadLectureModal.tsx` | Quick frosted modal dialog triggered by "+ Upload Lecture" in the header across any view |
| `PdfUploader` | `src/components/ingestion/PdfUploader.tsx` | Drag-and-drop dropzone for PDF slide decks with page count and extraction preview |
| `AudioUploader` | `src/components/ingestion/AudioUploader.tsx` | Audio/video upload (MP3, WAV, M4A, MP4) with live transcription progress bar and ETA |
| `YouTubeUploader` | `src/components/ingestion/YouTubeUploader.tsx` | YouTube lecture URL input with video thumbnail preview and automated caption fetch |
| `ManualTranscriptEditor` | `src/components/ingestion/ManualTranscriptEditor.tsx` | Instant fallback rich-text editor for manual transcript paste with word counter |
| `LectureInspectorDrawer` | `src/components/ingestion/LectureInspectorDrawer.tsx` | 4-column right-hand drawer with speaker diarization breakdown, slide deck previews, formulas, and export suite |
| `ProcessingStateOverlay` | `src/components/ingestion/ProcessingStateOverlay.tsx` | Multi-step animated progress overlay ("Uploading" → "Whisper STT" → "Chunking" → "Ready") |

---

## Spacing Scale

Declaring values adhering strictly to the 4px baseline grid:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Internal icon-to-label gaps, badge paddings, waveform bar gaps |
| sm | 8px | Tab switcher padding, course filter pill gaps, input field padding |
| md | 16px | Standard card padding, modal content gap, dropzone internal margin |
| lg | 24px | Major card container padding, section header gaps, modal body padding |
| xl | 32px | Primary section divisions, split-pane grid gaps |
| 2xl | 48px | Viewport padding, bottom drawer boundary |
| 3xl | 64px | Page-level outer boundaries on ultra-wide screens |

Exceptions:
- None. All margins, paddings, and dimensions adhere to 4px multiples.

---

## Typography

Universal typography strictly powered by **Poppins** with optical tracking:

| Role | Font Family | Size | Weight | Line Height | Tracking | Usage |
|------|-------------|------|--------|-------------|----------|-------|
| Display | Poppins | 36px | 700 (Bold) | 1.15 | `-0.025em` | Page title ("Lecture Library & Media Vault") |
| Headline | Poppins | 24px | 600 (SemiBold) | 1.3 | `-0.02em` | Selected lecture titles, modal headers |
| Title | Poppins | 16px | 600 (SemiBold) | 1.4 | `-0.01em` | Card titles, tab labels, action buttons |
| Body | Poppins | 14px | 400 (Regular) | 1.6 | `-0.006em` | Summaries, descriptions, transcript text |
| Label | Poppins | 12px | 500 (Medium) | 1.35 | `+0.01em` | Filter pills, status badges, secondary metadata |
| Micro | Poppins | 11px | 600 (SemiBold) | 1.3 | `+0.02em` | Course codes ("NEURO 301"), tags |
| Code / Timecode | JetBrains Mono / SF Mono | 12px | 500 (Medium) | 1.4 | `0em` | Audio timestamps ("00:18:42 / 00:52:30"), shortcuts (`⌘K`, `⌘F`) |

---

## Color: 60-30-10 Rule Distribution

| Role | Share | Value | Usage |
|------|-------|-------|-------|
| **Dominant** | **60%** | `#FBF8FF` (Canvas), `#FFFFFF` (Surface Container Lowest) | Viewport background, main panel surface, lecture cards |
| **Secondary** | **30%** | `#F4F2FD` (Tonal Inset), `rgba(255, 255, 255, 0.78)` (Glass), `#EEEDF7` (Tracks), `#E4E4E7` (Dividers) | Navigation rail backdrop, header glass bar, card wells, neutral borders |
| **Accent** | **10%** | `#4F46E5` (Primary Indigo) & `#0EA5E9` (Sky Blue) | Interactive focal points, active tab pills, and audio waveform bars ONLY |
| **Semantic Mastery** | Supplemental | `#10B981` (Emerald) / `#D1FAE5` (Mint container) | "Synced & Verified" status pills, 100% vector store sync indicators |
| **Destructive / Error**| Supplemental | `#BA1A1A` (Text) / `#FFDAD6` (Container) | Error toasts, YouTube caption unavailable warnings |

### Accent Reservation Rule
`--color-primary-container` (`#4F46E5`) is strictly reserved for:
1. Primary `+ Upload Lecture` button in the header
2. Active tab indicator in the Ingestion Hub (`PDF`, `Audio`, `YouTube`, `Manual`)
3. Primary "Process & Index Lecture" action button
4. Active audio playback scrub head and elapsed waveform bars
5. Search bar focus ring

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| **Page Title** | `Lecture Library & Media Vault` |
| **Page Subtitle** | `Academic Vault > Media & Knowledge Repository` |
| **Metric 1** | `14 Lectures Indexed` |
| **Metric 2** | `38h 42m Recorded Audio` |
| **Metric 3** | `4 Active Subjects` |
| **Metric 4** | `100% Synced to Vector Store` |
| **Tab 1 Label** | `Slide Deck & Handouts (PDF)` |
| **Tab 2 Label** | `Audio / Video Recording` |
| **Tab 3 Label** | `YouTube Lecture URL` |
| **Tab 4 Label** | `Manual Transcript / Notes` |
| **PDF Dropzone Headline** | `Drop PDF lecture slides or handouts here` |
| **PDF Dropzone Subcopy** | `Extracts full slide text, table data, and speaker notes • Up to 100MB` |
| **Audio Dropzone Headline** | `Drop lecture recording or video file here` |
| **Audio Dropzone Subcopy** | `MP3, WAV, M4A, MP4, Zoom recordings • Local faster-whisper transcription` |
| **YouTube Input Placeholder** | `https://www.youtube.com/watch?v=...` |
| **YouTube Fetch Button** | `Fetch Captions` |
| **Manual Fallback Warning** | `Automated captions unavailable. You can paste the transcript or lecture notes directly below.` |
| **Processing Step 1** | `Uploading lecture media (100%)...` |
| **Processing Step 2** | `Transcribing audio via faster-whisper (CTranslate2)...` |
| **Processing Step 3** | `Extracting key concepts, formulas & definitions...` |
| **Processing Step 4** | `Lecture ready! Indexed into Academic Vault.` |
| **Drawer Header** | `Active Lecture Inspector` |
| **Drawer Speaker Title** | `Speaker Diarization` |
| **Drawer Speaker 1** | `Prof. Marcus Henderson (82%)` |
| **Drawer Speaker 2** | `Student Q&A (18%)` |
| **CTA to Phase 3** | `Open Smart Notes in Workspace` |

---

## UI Considerations

> State coverage across primary Phase 2 surfaces.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| `empty` | `LectureLibrary` | ✅ covered | When no lectures match a course filter, render a calm dropzone prompt with a "Reset Filter" button. |
| `loading` | `AudioUploader` | ✅ covered | Displays animated multi-step progress overlay with pulsing beacon and simulated/actual percentage. |
| `error` | `YouTubeUploader` | ✅ covered | If video has disabled captions or fails, automatically slide down the Manual Transcript Editor with pre-filled video title. |
| `long-text` | `LectureCard` | ✅ covered | Lecture titles truncate at 2 lines; descriptions at 2 lines with ellipsis (`line-clamp-2`). |
| `offline-fallback` | `All Uploaders` | ✅ covered | When `localhost:8000` is offline, frontend seamlessly simulates realistic upload/transcription pipeline with pre-seeded templates. |
| `focus-visible` | All inputs & buttons | 🧪 backstop | Prominent 2px indigo outline offset by 2px (`outline: 2px solid #4F46E5; outline-offset: 2px;`). |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| None (Vanilla CSS) | Custom CSS Modules | Built from validated design tokens; no third-party registry vulnerabilities |
| Google Fonts | Poppins (400, 500, 600, 700) | Standard Google Fonts stylesheet embed in `index.html` with `display=swap` |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS (Explicit, authentic academic terminology; exact Stitch strings)
- [x] Dimension 2 Visuals: PASS (Strict 4px baseline grid, Apple HIG glassmorphic material depth)
- [x] Dimension 3 Color: PASS (60-30-10 distribution strictly observed; primary accent reserved)
- [x] Dimension 4 Typography: PASS (Global Poppins font hierarchy with JetBrains Mono for timecodes)
- [x] Dimension 5 Spacing: PASS (Strict 4px/8px multiples, no arbitrary spacing overrides)
- [x] Dimension 6 Registry Safety: PASS (No unvetted third-party blocks)
- [x] Dimension 7 Inventory Provenance: PASS (Extracted directly from Stitch screen `402b1ce7bbd84b36bd262a1f528d857b`)

**Approval:** approved 2026-09-28
