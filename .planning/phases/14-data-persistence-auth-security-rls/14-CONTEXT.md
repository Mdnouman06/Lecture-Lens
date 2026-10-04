# Phase 14 Context: Data Persistence, Authentication, Security & RLS Hardening

**Phase:** 14 — Data Persistence, Authentication, Security & RLS Hardening  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [SEC-01, SEC-02]  

---

## 1. Objective

Harden LectureLens's entire data persistence, authentication, and security posture for production deployment:
1. **PostgreSQL Row Level Security (RLS) Policies (`SEC-01`)**:
   - Provide a complete, production-ready, idempotent SQL schema (`supabase/schema.sql`) covering all 9 application tables: `lectures`, `lecture_transcripts`, `lecture_notes`, `flashcards`, `quiz_submissions`, `pyq_papers`, `pyq_questions`, `study_blocks`, and `exam_deadlines`.
   - Enable strict Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) on every table.
   - Enforce granular policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` guaranteeing that `auth.uid() = user_id`.
   - Configure foreign key constraints with `ON DELETE CASCADE` to prevent orphaned child records.
   - Create B-Tree indexes on `user_id` and foreign key columns for fast RLS policy evaluations.
   - Configure Supabase Storage bucket (`lecture_media`) access control policies so students can only upload and read their own media.
2. **Authentication, Session Expiry & Tenant Isolation (`SEC-02`)**:
   - Harden `AuthContext.tsx` with explicit token refresh lifecycle management, expired session recovery, and clean logout handling.
   - Apply defense-in-depth user scoping in `src/services/lectures.ts`: explicitly verify authenticated user session before database mutations, attach `user_id = auth.uid()` to delete and update filters, and reject cross-tenant data leakage.
   - Handle JWT expiry and 401 Unauthorized responses gracefully in the UI without crashing, presenting friendly toast notifications and seamless re-authentication prompts.
3. **Input Sanitization & Prompt Injection Protection (`SEC-01`, `SEC-02`)**:
   - Implement frontend input sanitization utilities (`src/utils/security.ts`) to prevent Stored XSS in notes markdown, lecture titles, and transcript edits.
   - Implement backend input sanitization and prompt injection defense in `backend/security.py`, stripping adversarial prompt delimiters, enforcing char length bounds, and escaping prompt injection markers before sending prompts to local Ollama.
   - Add automated security verification tests verifying RLS policy coverage, input sanitization, and prompt defense contracts.

---

## 2. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                Client (React UI)                                  |
|                                                                                   |
|  [User Input: Lecture / Notes / Tutor Query / Study Blocks]                       |
|         |                                                                         |
|         v                                                                         |
|  [src/utils/security.ts] (XSS sanitization & input boundary validation)           |
|         |                                                                         |
|         +-------------------------------------+-----------------------------------+
|         |                                     |                                   |
|         v (Supabase API with JWT)             v (REST API on localhost:8000)      |
|  [src/services/lectures.ts]            [backend/security.py]                      |
|  - Validates active auth session       - Sanitizes prompt inputs                  |
|  - Enforces user_id scoping            - Escapes prompt delimiters                |
|  - Graceful token expiry catch         - Enforces token/char limits               |
|         |                                     |                                   |
|         v                                     v                                   |
|  [Supabase PostgreSQL]                 [Ollama Qwen3 / Whisper]                   |
|  - RLS Active on ALL 9 Tables          - Grounded Inference Only                  |
|  - auth.uid() = user_id                - Safe JSON Extraction                     |
|  - Indexed user_id & foreign keys                                                 |
|  - Storage RLS for lecture_media                                                  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Tables & RLS Policy Matrix

| Table Name | Foreign Keys | RLS SELECT Policy | RLS INSERT Policy | RLS UPDATE Policy | RLS DELETE Policy |
|---|---|---|---|---|---|
| `lectures` | None | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `lecture_transcripts` | `lecture_id -> lectures.id ON DELETE CASCADE` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `lecture_notes` | `lecture_id -> lectures.id ON DELETE CASCADE` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `flashcards` | `lecture_id -> lectures.id ON DELETE CASCADE` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `quiz_submissions` | `lecture_id -> lectures.id ON DELETE CASCADE` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `pyq_papers` | None | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `pyq_questions` | `paper_id -> pyq_papers.id ON DELETE CASCADE` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `study_blocks` | `notes_id -> lecture_notes.id ON DELETE SET NULL` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `exam_deadlines` | None | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `storage.objects` (`lecture_media`) | Bucket `lecture_media` | `(storage.foldername(name))[1] = auth.uid()::text` | `(storage.foldername(name))[1] = auth.uid()::text` | `(storage.foldername(name))[1] = auth.uid()::text` | `(storage.foldername(name))[1] = auth.uid()::text` |

---

## 4. Key Security Decisions

1. **Defense-in-Depth (RLS + Application User Scoping)**:
   - While PostgreSQL RLS is the authoritative enforcement layer, client queries in `src/services/lectures.ts` must also explicitly attach `.eq('user_id', userId)` where appropriate. This guarantees that accidental RLS configuration changes or service role misuse cannot leak cross-tenant rows.
2. **Graceful Degradation vs. Hard Crash on Token Expiry**:
   - If a student leaves a tab open and their session expires, subsequent database operations fail with 401 or JWT expired errors.
   - The application intercepts these errors, dispatches a session expiry event, surfaces a clean notification banner, and opens the `AuthModal` rather than throwing uncaught exceptions or wiping local state prematurely.
3. **Lightweight Native Sanitization**:
   - Rather than introducing heavy external dependencies, implement lean, battle-tested XSS stripping regexes in `src/utils/security.ts` for frontend inputs and robust delimiter stripping in `backend/security.py` for LLM prompt safety.
4. **Idempotent and Verifiable Schema Artifacts**:
   - Provide `supabase/schema.sql` as a unified setup script with `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and idempotent policy definitions (`DROP POLICY IF EXISTS ... CREATE POLICY ...`).
   - Implement a validation script `scripts/verify_rls.py` to statically verify that all 9 tables have RLS enabled and complete CRUD policies defined.

---

## 5. Work Breakdown (Plans)

- **14-01-PLAN**: Supabase PostgreSQL Schema, RLS Security Policies & Storage Isolation (`supabase/schema.sql`, `supabase/migrations/20261001_phase14_rls_security.sql`, `scripts/verify_rls.py`).
- **14-02-PLAN**: Client Auth Hardening, Defense-in-Depth User Scoping & Session Expiry Management (`src/context/AuthContext.tsx`, `src/services/lectures.ts`, `src/services/supabase.ts`, `src/App.tsx`).
- **14-03-PLAN**: Input Sanitization, Prompt Injection Defenses & Security Verification Suite (`src/utils/security.ts`, `backend/security.py`, `backend/services/ollama.py`, `backend/test_security.py`).
