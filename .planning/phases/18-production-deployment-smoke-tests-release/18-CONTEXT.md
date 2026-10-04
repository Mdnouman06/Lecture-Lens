# Phase 18 Context: Production Deployment, Smoke Testing & Release Checklist

**Phase:** 18 — Production Deployment, Smoke Testing & Release Checklist  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [PROD-02]  

---

## 1. Objective

Execute live production deployment, validate the end-to-end student study workflow against the live deployment, document database backup/recovery procedures, and deliver comprehensive student release documentation:

1. **Live Production Static Deployment (`PROD-02`)**:
   - Deploy the optimized production build (`dist/`) to Netlify utilizing Netlify tools.
   - Configure production client environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`).
   - Validate live HTTPS accessibility and zero-config SPA client-side routing on direct deep-links (`/`, `/workspace`, `/tutor`, `/recall`, `/planner`, `/pyq`).
2. **End-to-End Live Production Smoke Testing (`PROD-02`)**:
   - Perform end-to-end smoke verification of the full student workflow:
     1. User Authentication: Sign in, session recovery, and multi-tenant scoping.
     2. Multimodal Lecture Ingestion: Audio transcription via `faster-whisper`, PDF slide parsing, YouTube captions, and manual note submission.
     3. Smart Notes Workspace: Ollama `qwen3:4b` executive summary synthesis, concept table, and inline markdown persistence.
     4. Grounded AI Tutor: Contextual Q&A with exact `[MM:SS - MM:SS]` timestamp citations and audio seek synchronization.
     5. Active Recall Studio: 3D flip card runner with FSRS ratings and 5-question multiple choice drill scoring.
     6. Multi-Format Academic Exports: 1-click downloads for plain text transcripts (`.txt`), formatted study notes (`.md`), and Anki decks (`.tsv`).
3. **Database Backup & Disaster Recovery Procedures (`PROD-02`)**:
   - Author `docs/DISASTER_RECOVERY.md`:
     - Supabase automated daily backups and Point-In-Time Recovery (PITR).
     - CLI / logical database dumps (`pg_dump` / Supabase CLI) for table schemas and user data.
     - Storage bucket (`lecture_media`) backup policies and disaster recovery runbook.
4. **Student Release & Operations Documentation (`PROD-02`)**:
   - Author `docs/STUDENT_QUICK_START.md` (Student Release Guide):
     - Zero-to-hero local AI installation (`ollama serve`, `ollama pull qwen3:4b`, Python virtualenv setup).
     - Connecting public Netlify frontend to personal local AI or Cloudflare Quick Tunnel.
     - Keyboard shortcut guide (Spacebar flip, 1-4 ratings, Z undo, Esc dismiss, Tab navigation).
     - Troubleshooting guide for offline diagnostics, CORS errors, and audio codecs.
   - Update `README.md` with production deployment badges, architecture summary, and quickstart links.

---

## 2. Technical Stack & Deployment Architecture

```
LectureLens Production Release Architecture
┌────────────────────────────────────────────────────────────────────────┐
│                        Netlify Static CDN (HTTPS)                      │
│   Production URL: https://[project-name].netlify.app                   │
│   - Compiled Vite 8 assets with manualChunks (<500kB each)             │
│   - SPA rewrite rules: /* /index.html 200                              │
│   - Public client variables (Supabase URL, Anon Key, API Base URL)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
┌─────────────────────────────────┐ ┌────────────────────────────────────┐
│   Supabase Cloud (PostgreSQL)   │ │  Student Personal Machine / Tunnel │
│   - Multi-tenant auth & sessions│ │  - FastAPI Local Bridge (:8000)    │
│   - 36 RLS policies verified    │ │  - faster-whisper base.en (CPU)    │
│   - Lecture notes & transcripts │ │  - Ollama qwen3:4b (localhost)     │
│   - Automated daily backups     │ │  - Exact-origin CORS allowlist     │
└─────────────────────────────────┘ └────────────────────────────────────┘
```

---

## 3. Plan Decomposition

- **Plan 18-01**: Netlify Production Deployment, Live Smoke Testing & Multi-Tenant Verification
  - Netlify project creation, environment configuration, and static site deployment.
  - Live HTTPS route verification and SPA deep-link testing.
  - End-to-end functional smoke test across all 6 views and academic exports.
  - Live Supabase multi-tenant isolation audit.
- **Plan 18-02**: Disaster Recovery Runbook, Student Release Guide & Final Milestone Documentation
  - `docs/DISASTER_RECOVERY.md`: Supabase PostgreSQL backup, dump/restore, and rollback procedures.
  - `docs/STUDENT_QUICK_START.md`: Step-by-step student onboarding guide with prerequisites, shortcuts, and troubleshooting.
  - `scripts/verify_production_smoke.py`: Automated HTTP health and route validation script.
  - `README.md` update and final milestone completion summary.

---

## 4. Acceptance Criteria

1. LectureLens is deployed and live on Netlify over HTTPS with zero build errors.
2. All primary SPA routes (`/`, `/workspace`, `/tutor`, `/recall`, `/planner`, `/pyq`) load with HTTP 200 without 404 errors on browser refresh.
3. Complete student study cycle functions end-to-end without console errors.
4. `docs/DISASTER_RECOVERY.md` provides reproducible database backup and restore commands.
5. `docs/STUDENT_QUICK_START.md` provides clear setup and keyboard navigation instructions.
6. Overall milestone verification score is 100%, completing Milestone 2.
