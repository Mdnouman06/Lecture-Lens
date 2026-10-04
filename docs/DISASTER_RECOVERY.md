# LectureLens Supabase PostgreSQL Disaster Recovery & Backup Runbook

**Document Version:** 1.0.0  
**Effective Date:** 2026-10-01  
**Target Infrastructure:** Supabase Cloud PostgreSQL & S3 Storage (`lecture_media`)  
**Project Reference:** `your-project-ref`  
**Classification:** Operational Security & Business Continuity (`PROD-02`)

---

## 1. Executive Summary & Tier Capabilities

LectureLens persists all relational student metadata, academic notes, active recall flashcards, quiz submissions, and exam planners in a managed Supabase PostgreSQL instance with 36 Row-Level Security (RLS) policies. To guarantee data preservation and business continuity against human error, data corruption, or platform incidents, this runbook defines backup procedures, disaster recovery protocols, and post-restoration verification steps.

### Supabase Tier Capabilities & Realities

> [!IMPORTANT]
> **Tier Distinction Notice**: Backup mechanisms vary strictly according to the Supabase subscription tier. Do NOT assume second-level PITR is available on Free Tier projects.

| Feature | Supabase Free Tier | Supabase Pro Tier / Enterprise | LectureLens Implementation |
|---|---|---|---|
| **Automated Backups** | Daily snapshots managed by Supabase infrastructure | Daily snapshots managed by Supabase | Enabled (Daily automated snapshots retained for 7 days) |
| **Point-In-Time Recovery (PITR)** | **Not Available** (Cannot roll back to arbitrary seconds) | **Available** (Granular WAL archiving down to second) | Documented; required if upgrading to Pro |
| **Manual Logical Dumps** | Supported via Supabase CLI & `pg_dump` | Supported via Supabase CLI & `pg_dump` | **Primary Recommended Student/Admin Recovery Method** |
| **Database Restore** | Manual import via SQL dump or dashboard restore | 1-click restore to any point in time (PITR) | Scripted `psql` restore pipeline |
| **Storage Bucket Backups** | Manual sync via Storage REST / S3 API | Automated storage replication | S3-compatible export script for `lecture_media` |

---

## 2. Automated & Scheduled Backup Procedures

### 2.1 Supabase Native Daily Backups (Free & Pro Tiers)
1. Supabase automatically takes daily physical snapshots of the database around 00:00 UTC.
2. In the Supabase Dashboard, navigate to:  
   `Project Settings` → `Database` → `Backups`
3. Daily snapshots are displayed with timestamps and download links (7-day rolling window on Free tier).
4. Download the latest `.sql.gz` snapshot locally before performing major database migrations or schema adjustments.

### 2.2 Point-In-Time Recovery (PITR) (Pro Tier Only)
If the project is upgraded to Supabase Pro:
1. Navigate to `Project Settings` → `Database` → `Backups` → `Point in Time`.
2. Select the exact recovery date, hour, minute, and second (e.g., `2026-10-01 14:32:00 UTC`).
3. Supabase will provision an isolated database clone replaying Write-Ahead Logs (WAL) up to the specified second without data loss.

---

## 3. Manual Logical Database Backups (Self-Serve CLI)

Logical database dumps are the most flexible, portable recovery asset because they can be restored into any PostgreSQL instance (local Docker, Supabase, AWS RDS, or GCP Cloud SQL).

### 3.1 Prerequisites
- Supabase CLI installed (`npm install -g supabase` or `brew install supabase/tap/supabase`).
- Standard PostgreSQL client tools (`pg_dump`, `psql` v15+).
- Supabase Database Connection String (available in `Project Settings` → `Database` → `Connection string`).

### 3.2 Full Database Schema & Data Dump (Supabase CLI)

```bash
# Login to Supabase CLI
supabase login

# Link to the LectureLens cloud project
supabase link --project-ref your-project-ref

# 1. Export Complete Public Schema (Tables, Views, RLS Policies, Indexes)
supabase db dump --project-ref your-project-ref --schema public -f backup_schema_$(date +%Y%m%d).sql

# 2. Export Public Table Data Only
supabase db dump --project-ref your-project-ref --data-only --schema public -f backup_data_$(date +%Y%m%d).sql
```

### 3.3 Direct `pg_dump` Command (Standard PostgreSQL)

```bash
# Set PostgreSQL environment password (from Supabase DB Password)
export PGPASSWORD="your-supabase-db-password"

# Comprehensive Compressed Plain-Text Dump
pg_dump \
  -h db.your-project-ref.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --schema=public \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -F p \
  -v \
  -f "lecturelens_backup_$(date +%Y%m%d_%H%M%S).sql"
```

---

## 4. Storage Bucket Backup (`lecture_media`)

LectureLens stores recorded student audio (`.mp3`/`.wav`) and slide PDFs in the `lecture_media` Supabase Storage bucket.

### 4.1 Syncing Storage Objects Locally via S3-Compatible API

Supabase Storage supports the AWS S3 protocol. Objects can be mirrored locally:

```bash
# Configure temporary AWS CLI credentials using Supabase Storage S3 keys
export AWS_ACCESS_KEY_ID="your-supabase-storage-access-key"
export AWS_SECRET_ACCESS_KEY="your-supabase-storage-secret-key"

# Mirror all lecture media files to a local backup directory
aws s3 sync s3://lecture_media ./backups/storage/lecture_media/ \
  --endpoint-url https://your-project-ref.supabase.co/storage/v1/s3
```

---

## 5. Disaster Recovery & Restoration Procedure

In the event of database corruption, accidental table drop, or security incident:

### Step 1: Declare Incident & Lock Client Access
Temporarily set visitor access controls on Netlify to require password or redirect to a maintenance banner to prevent concurrent writes during recovery.

### Step 2: Database Restoration Sequence
Because relational tables enforce foreign key cascades, tables must be dropped and restored in strict topological order:

1. **Schema Restoration**:
   ```bash
   psql -h db.your-project-ref.supabase.co -U postgres -d postgres -f supabase/schema.sql
   ```
2. **Data Restoration**:
   ```bash
   # Restore data using transactional single transaction flag
   psql -h db.your-project-ref.supabase.co -U postgres -d postgres --single-transaction -f backup_data.sql
   ```
3. **Storage Bucket Re-Sync**:
   ```bash
   aws s3 sync ./backups/storage/lecture_media/ s3://lecture_media \
     --endpoint-url https://your-project-ref.supabase.co/storage/v1/s3
   ```

---

## 6. Post-Restoration Verification Checklist

Following restoration, verify database health before reopening the application to students:

- [ ] **Table Count**: Exactly 9 public application tables exist (`lectures`, `lecture_transcripts`, `lecture_notes`, `flashcards`, `quiz_submissions`, `pyq_papers`, `pyq_questions`, `study_blocks`, `exam_deadlines`).
- [ ] **RLS Enforcement**: Run `python scripts/verify_rls.py` to assert that all 9 tables have RLS enabled with 36 CRUD policies active.
- [ ] **Multi-Tenant Isolation**: Run `python scripts/verify_rls_multiuser.py` to confirm User B cannot access User A's data.
- [ ] **Storage Bucket Access**: Upload and playback a sample audio file in the live Netlify application.
- [ ] **Log Cleared**: Inspect Supabase Dashboard logs (`Database` → `Logs`) for foreign key errors or connection pool exhaustion.
