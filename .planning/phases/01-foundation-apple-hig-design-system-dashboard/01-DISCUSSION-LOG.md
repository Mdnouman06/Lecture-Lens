# Phase 1: Foundation, Apple HIG Design System & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-28
**Phase:** 1-Foundation, Apple HIG Design System & Dashboard
**Areas discussed:** Dashboard Layout & Widget Hierarchy, Local AI Health Check & Offline Fallback, Pre-seeded Mock Lectures, Navigation Architecture

---

## Dashboard Layout & Widget Hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| Full Stitch 3-Pane Layout | Left navigation rail (240px), main lecture grid & stats, and right quick actions/activity panel | ✓ |
| 2-Pane Clean Layout | Left navigation rail and wide central canvas with stats cards on top and recent lectures grid below | |
| You decide | Match the Google Stitch design screens with best optical balance | |

**User's choice:** Full Stitch 3-Pane Layout (240px navigation rail, main lecture grid & stats, right quick actions & streak panel)
**Notes:** Establishes highest fidelity with Stitch screen `d9c68082013048039fecbeedb5afeb83`.

---

## Local AI Health Check & Offline Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Header Status Pill + Help Modal | Live status pill in header with clickable helper modal showing setup instructions and instant demo mode toggle | ✓ |
| Persistent Top Banner | Prominent glassmorphic banner whenever local AI is offline with quick-start steps | |
| Silent Auto-Switch | Auto-detect offline status and seamlessly fall back to rich sample lecture data without modal popups | |

**User's choice:** Header Status Pill + Help Modal
**Notes:** Non-intrusive indicator with clear setup guidance for beginner local development.

---

## Pre-seeded Mock Lectures

| Option | Description | Selected |
|--------|-------------|----------|
| 3 Diverse Academic Subjects | Full sample lectures across CS, Biology, and Economics with pre-built summaries, key concepts, transcripts, and flashcard decks | ✓ |
| Single Comprehensive Course | One deep technical lecture with 20+ flashcards and detailed notes | |
| Minimal Starter | 1 sample lecture and clean empty states encouraging immediate file upload | |

**User's choice:** 3 Diverse Academic Subjects (CS, Biology, Economics)
**Notes:** Allows immediate tangible verification of UI components and active recall tools.

---

## Navigation Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| State-Based View Switching | Controlled by activeView state; instant view switching, zero router boilerplate, and simple state persistence | ✓ |
| React Router DOM | Full URL routing with paths (/dashboard, /lecture/:id, /flashcards) supporting browser back/forward history | |
| Hash-based Routing | Simple hash navigation balancing URL links with zero server rewrite requirements | |

**User's choice:** State-Based View Switching
**Notes:** Ideal for beginner-friendly MVP with rapid iteration and zero routing misconfiguration bugs.

---

## Deferred Ideas

- Audio synchronization scrubber bar (deferred to v2 `SYNC-01`).
- Concept Mind Maps visualizer (deferred to v2 `GRAPH-01`).
