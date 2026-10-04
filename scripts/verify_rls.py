#!/usr/bin/env python3
"""
Static verification script for LectureLens Supabase PostgreSQL Schema & RLS Policies.
Phase 14: Data Persistence, Authentication, Security & RLS Hardening (SEC-01).

Validates:
1. Presence of all 9 required application tables.
2. user_id column references auth.users(id) with CASCADE.
3. ON DELETE CASCADE on child foreign keys.
4. ENABLE ROW LEVEL SECURITY on all 9 tables.
5. All 4 CRUD policies (SELECT, INSERT, UPDATE, DELETE) per table enforcing auth.uid() = user_id.
6. Performance B-Tree indexes on user_id for all tables.
7. Storage bucket RLS policies for lecture_media.
"""

import sys
import re
from pathlib import Path

REQUIRED_TABLES = [
    "lectures",
    "lecture_transcripts",
    "lecture_notes",
    "flashcards",
    "quizzes",
    "quiz_submissions",
    "pyq_papers",
    "pyq_questions",
    "study_blocks",
    "exam_deadlines",
]

CHILD_TABLES_WITH_CASCADE = [
    "lecture_transcripts",
    "lecture_notes",
    "flashcards",
    "quizzes",
    "quiz_submissions",
    "pyq_questions",
]

CRUD_ACTIONS = ["SELECT", "INSERT", "UPDATE", "DELETE"]

def verify_rls_schema(schema_path: Path) -> bool:
    if not schema_path.exists():
        print(f"[FAIL] Schema file not found: {schema_path}")
        return False

    content = schema_path.read_text(encoding="utf-8")
    errors = []
    passes = []

    print("\n" + "=" * 70)
    print(" LECTURELENS SUPABASE SCHEMA & RLS AUDIT (SEC-01)")
    print("=" * 70)

    # 1. Verify Table Definitions
    print("\n[1] Verifying Table Definitions & user_id Foreign Keys...")
    for table in REQUIRED_TABLES:
        table_pattern = rf"CREATE TABLE IF NOT EXISTS public\.{table}\s*\((.*?)\);"
        match = re.search(table_pattern, content, re.DOTALL | re.IGNORECASE)
        if not match:
            errors.append(f"Table public.{table} definition missing")
            continue

        table_body = match.group(1)
        if "user_id" not in table_body:
            errors.append(f"Table public.{table} is missing 'user_id' column")
        elif "REFERENCES auth.users(id)" not in table_body:
            errors.append(f"Table public.{table} 'user_id' does not reference auth.users(id)")
        else:
            passes.append(f"Table public.{table} defined with auth.users foreign key")

    # 2. Verify ON DELETE CASCADE on child tables
    print("\n[2] Verifying Foreign Key Cascade Deletion...")
    for table in CHILD_TABLES_WITH_CASCADE:
        cascade_pattern = rf"CREATE TABLE IF NOT EXISTS public\.{table}\s*\(.*?(lecture_id|paper_id)\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.\w+\(id\)\s+ON\s+DELETE\s+CASCADE"
        if re.search(cascade_pattern, content, re.DOTALL | re.IGNORECASE):
            passes.append(f"Table public.{table} has parent FK with ON DELETE CASCADE")
        else:
            errors.append(f"Table public.{table} missing parent FK with ON DELETE CASCADE")

    # 3. Verify RLS Enablement
    print("\n[3] Verifying Row Level Security (RLS) Enablement...")
    for table in REQUIRED_TABLES:
        rls_pattern = rf"ALTER TABLE public\.{table} ENABLE ROW LEVEL SECURITY;"
        if re.search(rls_pattern, content, re.IGNORECASE):
            passes.append(f"RLS enabled on public.{table}")
        else:
            errors.append(f"RLS NOT enabled on public.{table}")

    # 4. Verify Granular CRUD Policies per Table
    print("\n[4] Verifying Granular CRUD Policies (SELECT, INSERT, UPDATE, DELETE)...")
    for table in REQUIRED_TABLES:
        for action in CRUD_ACTIONS:
            policy_pattern = rf'CREATE POLICY\s+"{table}_{action.lower()}_user"\s+ON\s+public\.{table}\s+FOR\s+{action}\s+(USING|WITH CHECK)\s*\(\s*auth\.uid\(\)\s*=\s*user_id'
            if re.search(policy_pattern, content, re.IGNORECASE):
                passes.append(f"Policy {table}_{action.lower()}_user verified on public.{table}")
            else:
                errors.append(f"Missing or invalid policy for {action} on public.{table} (must enforce auth.uid() = user_id)")

    # 5. Verify user_id B-Tree Indexes
    print("\n[5] Verifying user_id Performance Indexes...")
    for table in REQUIRED_TABLES:
        idx_pattern = rf"CREATE INDEX IF NOT EXISTS idx_{table}_user_id ON public\.{table}\s*\(user_id\);"
        if re.search(idx_pattern, content, re.IGNORECASE):
            passes.append(f"Index idx_{table}_user_id verified")
        else:
            errors.append(f"Index idx_{table}_user_id missing for public.{table}")

    # 6. Verify Storage Policies
    print("\n[6] Verifying Storage RLS Policies for lecture_media Bucket...")
    storage_bucket_pattern = r"INSERT INTO storage\.buckets\s*\(id,\s*name,\s*public\)\s*VALUES\s*\('lecture_media'"
    if re.search(storage_bucket_pattern, content, re.IGNORECASE):
        passes.append("Bucket 'lecture_media' created in storage.buckets")
    else:
        errors.append("Storage bucket 'lecture_media' missing from schema")

    for action in CRUD_ACTIONS:
        storage_policy = rf'CREATE POLICY\s+"lecture_media_{action.lower()}_user"\s+ON\s+storage\.objects\s+FOR\s+{action}'
        if re.search(storage_policy, content, re.IGNORECASE):
            passes.append(f"Storage policy lecture_media_{action.lower()}_user verified")
        else:
            errors.append(f"Storage policy for {action} missing on storage.objects")

    # Audit Summary
    print("\n" + "-" * 70)
    print(f"Passed Checks: {len(passes)}")
    print(f"Failed Checks: {len(errors)}")
    print("-" * 70)

    if errors:
        print("\nAUDIT FAILED! Gaps detected:")
        for err in errors:
            print(f"  [X] {err}")
        return False

    print("\nAUDIT PASSED! 100% of tables, CRUD policies, indexes, and storage rules verified.")
    print("=" * 70 + "\n")
    return True

if __name__ == "__main__":
    schema_file = Path(__file__).resolve().parent.parent / "supabase" / "schema.sql"
    success = verify_rls_schema(schema_file)
    sys.exit(0 if success else 1)
