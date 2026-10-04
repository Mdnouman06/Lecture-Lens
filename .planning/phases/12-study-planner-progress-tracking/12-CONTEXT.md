# Phase 12 Context: Adaptive Study Planner & Progress Tracking

**Phase:** 12 — Adaptive Study Planner & Progress Tracking  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [ADV-03, ADV-05]  

---

## 1. Objective

Deliver an authentic, interactive 7-day academic study planner and calendar dashboard tracking upcoming review sessions, calculating real preparation deficits around exam milestones and memory decay curves, and persisting study blocks and exam deadlines to Supabase PostgreSQL:
1. Generate dynamic 7-day study schedules (`GET /planner/schedule` and `POST /planner/schedule`) calculating authentic coverage deficits based on upcoming exam deadlines and scheduled revision hours.
2. Provide an intelligent auto-fill engine (`POST /planner/autofill`) that scans for open time windows (08:00 to 20:00) and schedules high-yield revision blocks (Deep Study, FSRS Spaced Review, and AI Tutor Drills) grounded in the student's actual lecture concepts and due flashcards.
3. Persist study blocks and exam milestones to Supabase PostgreSQL (`public.study_blocks` and `public.exam_deadlines`) under user ownership with optimistic UI updates and resilient offline fallback.
4. Support full study block lifecycle: adding custom blocks, editing time slots, deleting sessions, and toggling session completion (`isCompleted`) with dynamic daily target progress calculation.
5. Connect `StudyBacklogPanel` with real student flashcard queues and upcoming exams, replacing static mock backlogs with live academic progress indicators.

---

## 2. Architecture & Data Flow

```
[Student in Adaptive Study Planner View]
       │
       ▼ (Loads calendar on mount)
[StudyPlannerView.tsx]
       │
       ├──► [fetchStudyBlocks & fetchExamDeadlines from src/services/lectures.ts]
       │           │
       │           ▼ (Queries public.study_blocks & public.exam_deadlines)
       │    [Supabase PostgreSQL Cloud DB] (Falls back to baseline if empty/unmigrated)
       │
       ├──► [fetchFlashcards from src/services/lectures.ts]
       │           │
       │           ▼ (Determines actual due cards for FSRS queue)
       │    [StudyBacklogPanel: displays real due card count & exam milestones]
       │
       ▼ (Clicks "Auto-Fill Gap" to eliminate prep deficit)
[StudyUrgencyRibbon.tsx: triggers handleAutoFill]
       │
       ▼ (POST /planner/autofill with existing blocks, lectures & deadlines)
[FastAPI: backend/services/planner.py]
       │
       ▼ (Calculates deficit, finds open calendar slots, schedules targeted review)
[FastAPI returns updated schedule with newly scheduled blocks]
       │
       ▼ (Batch persists new blocks to Supabase)
[saveBatchStudyBlocksToDb in src/services/lectures.ts]
       │
       ▼ (Calendar UI updates immediately)
[StudyCalendarGrid.tsx: renders color-coded blocks across Week/Day/Agenda views]
       │
       ▼ (Student completes session: clicks block -> "Mark as Completed")
[StudyBlockModal.tsx: toggles isCompleted]
       │
       ▼ (updateStudyBlockInDb in src/services/lectures.ts)
[Supabase: updates is_completed column]
       │
       ▼ (Urgency ribbon recalculates Daily Target % Done)
[Daily Target updates to reflect completed study hours]
```

---

## 3. Key Decisions

1. **Dynamic Deficit & Daily Target Computation**:
   - Deficit is calculated as `prepHoursScheduled - prepHoursNeeded`. If the student has an exam requiring 14 hours of prep and has only 10.7 hours scheduled across deep study, tutor drills, and FSRS reviews, a -3.3h deficit is flagged with Priority 1 status.
   - Today's Daily Target dynamically aggregates scheduled vs completed hours for the current day, driving the progress bar (`percentComplete`).
2. **Intelligent Conflict-Free Auto-Fill**:
   - Instead of static hardcoded blocks, `autofill_schedule_deficit` analyzes existing blocks on each day, detects open time intervals between 08:00 and 20:00, and injects balanced study sessions (Deep Study for lecture concepts, FSRS flashcard sweeps for due cards, AI Tutor drills) without overlapping existing commitments.
3. **Multi-Tenant Supabase Persistence**:
   - `study_blocks` table records `id`, `user_id`, `day_index` (0-6), `day_label`, `title`, `category`, `time_display`, `start_hour`, `duration_hours`, `course_code`, `notes_id`, `flashcard_queue_count`, `exam_title`, `is_autofilled`, `is_completed`, and `created_at`.
   - `exam_deadlines` table records `id`, `user_id`, `title`, `course_code`, `exam_date`, `prep_hours_needed`, and `created_at`.
   - Both tables enforce `user_id` scoping with resilient client fallback if offline or during local testing.
4. **Interactive Block Completion Lifecycle**:
   - Students can mark blocks as completed, delete unwanted blocks, or add custom study sessions directly from the calendar or modal inspector.
5. **Backlog Synchronization**:
   - `StudyBacklogPanel` reflects the student's real deck count from `fetchFlashcards`, connecting the Active Recall studio directly into the weekly study timetable.

---

## 4. Work Breakdown (Plans)

- **12-01-PLAN**: Backend Dynamic Schedule & Deficit Engine (`backend/services/planner.py`, `backend/main.py`, `backend/test_api.py`).
- **12-02-PLAN**: Supabase Persistence Layer for Study Blocks & Exam Deadlines (`src/types/lecture.ts`, `src/services/lectures.ts`, `src/services/api.ts`).
- **12-03-PLAN**: Interactive Study Planner UI, Calendar Completion & Milestone Tracking (`src/views/StudyPlannerView.tsx`, `src/components/planner/StudyCalendarGrid.tsx`, `src/components/planner/StudyBlockModal.tsx`, `src/components/planner/StudyBacklogPanel.tsx`, `src/styles/advanced.css`).
