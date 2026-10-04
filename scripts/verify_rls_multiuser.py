#!/usr/bin/env python3
"""
Live Two-User Supabase RLS Isolation Smoke Test for LectureLens (SEC-01 / PROD-02).
Phase 18: Production Deployment, Smoke Testing & Release Checklist.

Validates against the live Supabase instance (configured via environment variables):
1. User A authenticates (sign up or sign in).
2. User B authenticates (sign up or sign in).
3. User A creates a lecture in public.lectures (with user_id = User A's uid).
4. User A can SELECT their own lecture.
5. User B attempts to SELECT User A's lecture -> must return 0 rows (RLS blocks read).
6. User B attempts to UPDATE User A's lecture -> must return 0 rows / error (RLS blocks write).
7. User B attempts to DELETE User A's lecture -> must return 0 rows / error (RLS blocks delete).
8. User A can still retrieve and update their own lecture.
9. Cleanup: User A deletes their lecture record.
"""

import os
import sys
import json
import uuid
import urllib.request
import urllib.error
from typing import Tuple, Optional, Dict, Any

# Configure via environment variables (never hardcode credentials in source):
#   SUPABASE_URL=https://your-project-ref.supabase.co
#   SUPABASE_ANON_KEY=your-anon-publishable-key
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

def supabase_request(
    endpoint: str,
    method: str = "GET",
    token: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
    prefer: Optional[str] = None
) -> Tuple[int, Any]:
    url = f"{SUPABASE_URL}{endpoint}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if prefer:
        headers["Prefer"] = prefer

    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            status = resp.status
            try:
                res_json = json.loads(body) if body else None
            except Exception:
                res_json = body
            return status, res_json
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            res_json = json.loads(body) if body else None
        except Exception:
            res_json = body
        return e.code, res_json
    except Exception as e:
        return 0, str(e)

def get_or_create_user(email_prefix: str) -> Tuple[Optional[str], Optional[str]]:
    """Sign up or sign in a test user and return (user_id, access_token)."""
    email = os.getenv("RLS_TEST_EMAIL_PREFIX", f"{email_prefix}_prodtest") + "@lecturelens.test"
    password = os.getenv("RLS_TEST_PASSWORD", f"TestP@ss_{email_prefix}_{uuid.uuid4().hex[:8]}")

    # Try sign up first
    status, res = supabase_request(
        "/auth/v1/signup",
        method="POST",
        payload={"email": email, "password": password}
    )
    if status in (200, 201) and isinstance(res, dict):
        access_token = res.get("access_token")
        user = res.get("user") or {}
        uid = user.get("id")
        if access_token and uid:
            return uid, access_token

    # If already registered or email confirm required, try sign in with password
    status, res = supabase_request(
        "/auth/v1/token?grant_type=password",
        method="POST",
        payload={"email": email, "password": password}
    )
    if status == 200 and isinstance(res, dict):
        access_token = res.get("access_token")
        user = res.get("user") or {}
        uid = user.get("id")
        return uid, access_token

    # Check anonymous sign in if password signup is blocked / requires email confirmation
    status, res = supabase_request(
        "/auth/v1/signup",
        method="POST",
        payload={"data": {"temp": True}}
    )
    if status in (200, 201) and isinstance(res, dict) and res.get("access_token"):
        return res["user"]["id"], res["access_token"]

    print(f"Auth notice for {email}: Status {status}, Res: {res}")
    return None, None

def verify_two_user_rls() -> Tuple[int, int, list]:
    passed = 0
    failed = 0
    errors = []

    print("\n" + "=" * 74)
    print("      LECTURELENS LIVE TWO-USER SUPABASE RLS ISOLATION AUDIT")
    print(f"      Supabase Host: {SUPABASE_URL}")
    print("=" * 74)

    # 1. Authenticate User A and User B
    print("\n[1] Authenticating Distinct Test Users (User A & User B)...")
    salt = uuid.uuid4().hex[:6]
    uid_a, token_a = get_or_create_user(f"usera_{salt}")
    uid_b, token_b = get_or_create_user(f"userb_{salt}")

    if not uid_a or not token_a:
        failed += 1
        err = f"Failed to authenticate User A against live Supabase Auth"
        errors.append(err)
        print(f"  [FAIL] {err}")
        return passed, failed, errors

    if not uid_b or not token_b:
        failed += 1
        err = f"Failed to authenticate User B against live Supabase Auth"
        errors.append(err)
        print(f"  [FAIL] {err}")
        return passed, failed, errors

    print(f"  [PASS] User A Authenticated: UID = {uid_a}")
    print(f"  [PASS] User B Authenticated: UID = {uid_b}")
    assert uid_a != uid_b, "User A and User B must have distinct UIDs"
    passed += 1

    # 2. User A creates a lecture
    print("\n[2] User A Creating Private Lecture in public.lectures...")
    lecture_title = f"RLS Isolation Test Lecture - {uuid.uuid4().hex[:8]}"
    lecture_payload = {
        "user_id": uid_a,
        "title": lecture_title,
        "course_code": "CS101",
        "course_name": "Computer Science",
        "source_type": "audio",
        "status": "ready",
        "duration": "02:00",
        "duration_seconds": 120,
        "summary": "Multi-tenant RLS isolation verification lecture"
    }

    status, created_lecture = supabase_request(
        "/rest/v1/lectures",
        method="POST",
        token=token_a,
        payload=lecture_payload,
        prefer="return=representation"
    )

    if status not in (200, 201) or not created_lecture:
        failed += 1
        err = f"User A failed to insert lecture: HTTP {status} -> {created_lecture}"
        errors.append(err)
        print(f"  [FAIL] {err}")
        return passed, failed, errors

    lecture_id = created_lecture[0]["id"] if isinstance(created_lecture, list) else created_lecture.get("id")
    print(f"  [PASS] User A created lecture ID: {lecture_id} (Status: HTTP {status})")
    passed += 1

    # 3. User A can SELECT their own lecture
    print("\n[3] User A Reading Their Own Lecture...")
    status, read_a = supabase_request(
        f"/rest/v1/lectures?id=eq.{lecture_id}",
        method="GET",
        token=token_a
    )
    if status == 200 and isinstance(read_a, list) and len(read_a) == 1:
        print(f"  [PASS] User A successfully queried their own lecture (Retrieved 1 row)")
        passed += 1
    else:
        failed += 1
        err = f"User A could not read their own lecture: HTTP {status} -> {read_a}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 4. User B attempts to SELECT User A's lecture (must return 0 rows)
    print("\n[4] User B Attempting to READ User A's Lecture (RLS Isolation Check)...")
    status, read_b = supabase_request(
        f"/rest/v1/lectures?id=eq.{lecture_id}",
        method="GET",
        token=token_b
    )
    if status == 200 and isinstance(read_b, list) and len(read_b) == 0:
        print(f"  [PASS] User B received 0 rows! RLS successfully isolated User A's lecture from User B.")
        passed += 1
    else:
        failed += 1
        err = f"RLS LEAK! User B was able to read User A's lecture: HTTP {status} -> {read_b}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 5. User B attempts to UPDATE User A's lecture (must return 0 rows or error)
    print("\n[5] User B Attempting to UPDATE User A's Lecture (Tamper Resistance Check)...")
    status, update_b = supabase_request(
        f"/rest/v1/lectures?id=eq.{lecture_id}",
        method="PATCH",
        token=token_b,
        payload={"title": "Hacked Title by User B"},
        prefer="return=representation"
    )
    if status in (200, 204) and (update_b == [] or update_b is None):
        print(f"  [PASS] User B update affected 0 rows. RLS blocked unauthorized modification.")
        passed += 1
    elif status in (401, 403, 404):
        print(f"  [PASS] User B update blocked with HTTP {status} ({update_b})")
        passed += 1
    else:
        failed += 1
        err = f"RLS LEAK! User B was able to modify User A's lecture: HTTP {status} -> {update_b}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 6. User B attempts to DELETE User A's lecture (must return 0 rows or error)
    print("\n[6] User B Attempting to DELETE User A's Lecture (Destruction Prevention Check)...")
    status, delete_b = supabase_request(
        f"/rest/v1/lectures?id=eq.{lecture_id}",
        method="DELETE",
        token=token_b,
        prefer="return=representation"
    )
    if status in (200, 204) and (delete_b == [] or delete_b is None):
        print(f"  [PASS] User B delete affected 0 rows. RLS blocked unauthorized deletion.")
        passed += 1
    elif status in (401, 403, 404):
        print(f"  [PASS] User B delete blocked with HTTP {status} ({delete_b})")
        passed += 1
    else:
        failed += 1
        err = f"RLS LEAK! User B was able to delete User A's lecture: HTTP {status} -> {delete_b}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 7. User A verifies lecture is intact and cleans up
    print("\n[7] User A Verifying Integrity & Cleaning Up Test Record...")
    status, read_after = supabase_request(
        f"/rest/v1/lectures?id=eq.{lecture_id}",
        method="GET",
        token=token_a
    )
    if status == 200 and isinstance(read_after, list) and len(read_after) == 1:
        assert read_after[0]["title"] == lecture_title, "Lecture title was improperly altered!"
        print(f"  [PASS] Lecture intact: '{read_after[0]['title']}'")
        # Cleanup
        status, del_a = supabase_request(
            f"/rest/v1/lectures?id=eq.{lecture_id}",
            method="DELETE",
            token=token_a
        )
        print(f"  [PASS] User A cleaned up test lecture (Status: HTTP {status})")
        passed += 1
    else:
        failed += 1
        err = f"Lecture was missing or altered after User B attempts: HTTP {status} -> {read_after}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # Summary
    total = passed + failed
    print("\n" + "-" * 74)
    print(f"Live Two-User RLS Isolation Summary: {passed}/{total} Checks Passed ({failed} failures)")
    print("-" * 74)

    return passed, failed, errors

if __name__ == "__main__":
    passed, failed, errors = verify_two_user_rls()
    if failed > 0:
        print("\nRLS Isolation Failures:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\n>>> LIVE TWO-USER RLS ISOLATION VERIFIED (SEC-01 / PROD-02) <<<")
        sys.exit(0)
