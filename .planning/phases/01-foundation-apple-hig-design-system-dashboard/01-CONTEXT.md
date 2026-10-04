# Phase 1: Foundation, Apple HIG Design System & Dashboard - Context

**Gathered:** 2026-09-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the core client application shell, Apple-grade visual design system using Google Stitch tokens with Poppins typography, navigation rail, study stats widgets, and local AI engine health indicator.
Deliverables:
- Vite + React + TypeScript application initialization
- Google Stitch design system token implementation (`tokens.css`, `global.css`) with global Poppins typography
- 3-Pane Dashboard view with study stats, quick action bar, and recent lecture catalog
- Local AI health checker (`http://localhost:8000/health`) with header status pill and setup modal
- Pre-seeded rich mock lecture dataset (Computer Science, Biology, Economics)

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout & Widget Hierarchy
- **D-01:** Implement the full Google Stitch 3-pane responsive desktop grid layout: 240px fixed/collapsible navigation rail on the left, central canvas for study stats and recent lecture cards (6–8 columns), and right-hand quick actions & study streak panel (4 columns). — **Reversibility:** costly — changes top-level CSS layout and container grid.
- **D-02:** Use Apple-grade glassmorphism tokens (`backdrop-filter: blur(20px) saturate(180%)`, translucent card backgrounds `rgba(255, 255, 255, 0.75)`, 1px subtle zinc borders `#E4E4E7`, and soft indigo-tinted drop shadows) matching Stitch screen `d9c68082013048039fecbeedb5afeb83`.

### Local AI Health Check & Offline Fallback
- **D-03:** Display an interactive status pill in the top header (`🟢 Local AI Ready` / `🟡 Demo Mode (Local AI Offline)`). Clicking the pill opens a frosted modal dialog with one-click terminal commands to run the Python FastAPI backend and Ollama, plus a toggle to explore with mock lecture data. — **Reversibility:** reversible — modular status indicator.
- **D-04:** Check `http://localhost:8000/health` on initial load and periodically (every 30 seconds) without blocking UI rendering or showing disruptive error alerts.

### Pre-seeded Mock Lectures
- **D-05:** Pre-populate client state with 3 diverse academic subjects:
  1. *CS 106B: Graph Theory & BFS/DFS Algorithms* (Lecture duration: 52 min, with full summary, 4 key concepts, transcript timestamps, and 8 flashcards).
  2. *BIO 101: Cellular Respiration & ATP Synthesis* (Lecture duration: 44 min, with summary, definitions, transcript, and 6 flashcards).
  3. *ECON 201: Macroeconomic Policy & Inflation Controls* (Lecture duration: 38 min, with summary, key formulas, transcript, and 5 flashcards).
  Allows immediate, tactile verification of all study tools before running local AI.

### Navigation Architecture
- **D-06:** Implement state-based view switching using a central `activeView` state (`'dashboard' | 'ingest' | 'workspace' | 'flashcards' | 'quiz' | 'pyq' | 'planner'`) and `selectedLectureId` in React state/context. Eliminates URL routing complexity while guaranteeing instant view transitions and clean state continuity for beginner development. — **Reversibility:** costly — would require refactoring to react-router-dom if route URLs are needed later.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual Design System & Stitch Specs
- `Stitch Project`: `projects/11893050174269724482` — "LectureLens Apple-Inspired Design System"
- `Stitch Screen d9c68082013048039fecbeedb5afeb83` — "Dashboard — LectureLens Student Workspace"
- `Stitch Screen 402b1ce7bbd84b36bd262a1f528d857b` — "Lecture Library & Management — LectureLens"
- `.planning/research/STACK.md` — Stack selections and library dependencies
- `.planning/research/PITFALLS.md` — Failure mode mitigations (styling drift, AI health check)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield project — no existing client code.

### Established Patterns
- Pure Vanilla CSS / CSS Modules with design tokens in `tokens.css`.
- Global Poppins font family applied to `*`, `button`, `input`, and `select`.
- `@supabase/supabase-js` client structure ready for integration in Phase 2/5.

### Integration Points
- `http://localhost:8000/health` endpoint for local AI backend status.

</code_context>

<specifics>
## Specific Ideas

- Apple-style squircle curvature (`border-radius: 12px` to `16px` on cards, `9999px` on status pills).
- Top header with search bar, local AI status indicator, and quick "New Lecture" CTA button (`#4F46E5`).
- Study Streak widget ("🔥 5 Day Streak • 140 min studied this week") on the right dashboard rail.

</specifics>

<deferred>
## Deferred Ideas

- Audio synchronization scrubber bar (deferred to v2 `SYNC-01`).
- Concept Mind Maps visualizer (deferred to v2 `GRAPH-01`).

</deferred>

---

*Phase: 1-Foundation, Apple HIG Design System & Dashboard*
*Context gathered: 2026-09-28*
