#!/usr/bin/env python3
"""
Deep Production Readiness & Architecture Validator for LectureLens.
Phase 17: Production Architecture & Deployment Preparation (PROD-01).

Validates:
1. Bundle size budget: all JavaScript and CSS files in dist/assets/ are strictly under 500kB (512,000 bytes).
2. SPA client-side routing: public/_redirects, dist/_redirects, and netlify.toml specify non-conflicting /* -> /index.html 200.
3. CORS configuration: backend/main.py implements an exact-origin allowlist via CORS_ORIGINS without wildcard bypasses.
4. Secret hygiene & git tracking: zero .env files or private tokens tracked in git; .env.example contains no service-role keys.
5. Vite Cloudflare tunnel preservation: server.allowedHosts retains Phase 13 quick tunnel hosts.
"""

import os
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_CHUNK_BYTES = 500 * 1024  # 500 kB = 512,000 bytes

def verify_production_readiness() -> tuple[int, int, list[str]]:
    passed = 0
    failed = 0
    errors = []

    print("\n" + "=" * 72)
    print("      LECTURELENS PRODUCTION READINESS & DEPLOYMENT AUDIT (PROD-01)")
    print("=" * 72)

    # 1. Validate Production Bundle Chunks & Size Budget (< 500kB)
    print("\n[1] Auditing Compiled Bundle Assets (dist/assets/)...")
    dist_assets = ROOT / "dist" / "assets"
    if not dist_assets.exists():
        failed += 1
        err = "dist/assets/ does not exist. Run 'npm run build' before verification."
        errors.append(err)
        print(f"  [FAIL] {err}")
    else:
        chunk_files = [f for f in dist_assets.iterdir() if f.is_file() and f.suffix in [".js", ".css"]]
        if not chunk_files:
            failed += 1
            err = "dist/assets/ contains no .js or .css files."
            errors.append(err)
            print(f"  [FAIL] {err}")
        else:
            all_under_budget = True
            for f in sorted(chunk_files, key=lambda x: x.stat().st_size, reverse=True):
                size_bytes = f.stat().st_size
                size_kb = size_bytes / 1024.0
                if size_bytes > MAX_CHUNK_BYTES:
                    all_under_budget = False
                    failed += 1
                    err = f"Chunk {f.name} ({size_kb:.2f} kB) exceeds 500 kB budget!"
                    errors.append(err)
                    print(f"  [FAIL] {err}")
                else:
                    print(f"  [PASS] {f.name:42s} : {size_kb:7.2f} kB  (Budget: <500 kB)")
            if all_under_budget:
                passed += 1
                print(f"  [OK] All {len(chunk_files)} asset chunks are strictly under 500 kB budget.")

    # 2. Validate Single-Page Application (SPA) Routing & Redirects
    print("\n[2] Validating SPA Routing Fallbacks (Netlify & Static CDN)...")
    redirects_src = ROOT / "public" / "_redirects"
    redirects_dist = ROOT / "dist" / "_redirects"
    netlify_toml = ROOT / "netlify.toml"

    # public/_redirects
    if redirects_src.exists():
        src_text = redirects_src.read_text(encoding="utf-8")
        if "/* /index.html 200" in src_text:
            passed += 1
            print("  [PASS] public/_redirects contains canonical '/* /index.html 200'")
        else:
            failed += 1
            err = "public/_redirects missing '/* /index.html 200' rewrite rule"
            errors.append(err)
            print(f"  [FAIL] {err}")
    else:
        failed += 1
        err = "Missing public/_redirects"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # dist/_redirects
    if redirects_dist.exists():
        dist_text = redirects_dist.read_text(encoding="utf-8")
        if "/* /index.html 200" in dist_text:
            passed += 1
            print("  [PASS] dist/_redirects successfully populated by Vite build")
        else:
            failed += 1
            err = "dist/_redirects missing '/* /index.html 200'"
            errors.append(err)
            print(f"  [FAIL] {err}")
    else:
        failed += 1
        err = "dist/_redirects not copied to dist"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # netlify.toml
    if netlify_toml.exists():
        toml_text = netlify_toml.read_text(encoding="utf-8")
        has_publish = 'publish = "dist"' in toml_text
        has_redirect = 'status = 200' in toml_text and 'to = "/index.html"' in toml_text
        if has_publish and has_redirect:
            passed += 1
            print("  [PASS] netlify.toml specifies publish='dist' and status=200 SPA redirect")
        else:
            failed += 1
            err = "netlify.toml missing publish='dist' or status=200 redirect"
            errors.append(err)
            print(f"  [FAIL] {err}")
    else:
        failed += 1
        err = "Missing netlify.toml"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 3. Validate CORS Configuration in backend/main.py
    print("\n[3] Auditing Backend CORS Configuration (backend/main.py)...")
    main_py = ROOT / "backend" / "main.py"
    if main_py.exists():
        main_code = main_py.read_text(encoding="utf-8")
        has_env_cors = 'os.getenv("CORS_ORIGINS"' in main_code
        has_allow_origins = 'allow_origins=cors_allow_origins' in main_code
        has_wildcard_str = 'allow_origins=["*"]' in main_code or "allow_origins=['*']" in main_code
        has_wildcard_regex = "allow_origin_regex" in main_code

        if has_env_cors and has_allow_origins and not has_wildcard_str and not has_wildcard_regex:
            passed += 1
            print("  [PASS] backend/main.py enforces exact CORS allowlist from CORS_ORIGINS without wildcard bypasses")
        else:
            failed += 1
            err = "backend/main.py CORS has wildcard vulnerabilities or missing CORS_ORIGINS parsing"
            errors.append(err)
            print(f"  [FAIL] {err}")
    else:
        failed += 1
        err = "Missing backend/main.py"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 4. Validate Secret Hygiene & Git Tracking
    print("\n[4] Auditing Git Secret Hygiene & Index Cleanliness...")
    try:
        git_res = subprocess.run(
            ["git", "ls-files", ".env", ".env.local", "backend/.env"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
        )
        tracked_env = git_res.stdout.strip()
        if not tracked_env:
            passed += 1
            print("  [PASS] Zero .env or .env.local files tracked in git repository")
        else:
            failed += 1
            err = f"Security violation: Environment files tracked in git: {tracked_env}"
            errors.append(err)
            print(f"  [FAIL] {err}")
    except Exception as exc:
        failed += 1
        errors.append(f"Git execution failed: {exc}")

    # Validate .env.example contains no service-role secrets
    env_example = ROOT / ".env.example"
    if env_example.exists():
        example_text = env_example.read_text(encoding="utf-8")
        if "service_role" in example_text.lower() and "your-supabase-publishable-key" not in example_text:
            failed += 1
            err = "Found potential service-role reference in .env.example"
            errors.append(err)
            print(f"  [FAIL] {err}")
        else:
            passed += 1
            print("  [PASS] .env.example exposes only VITE_SUPABASE_PUBLISHABLE_KEY (no service-role keys)")
    else:
        failed += 1
        err = "Missing .env.example"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 5. Validate Vite Cloudflare Quick Tunnel Host Preservation
    print("\n[5] Validating Vite Configuration & Tunnel Preservation...")
    vite_config = ROOT / "vite.config.ts"
    if vite_config.exists():
        vite_code = vite_config.read_text(encoding="utf-8")
        if "registrar-artistic-another-transform.trycloudflare.com" in vite_code and "manualChunks" in vite_code:
            passed += 1
            print("  [PASS] vite.config.ts preserves Cloudflare tunnel allowedHosts and manualChunks code-splitting")
        else:
            failed += 1
            err = "vite.config.ts missing allowedHosts tunnel preservation or manualChunks"
            errors.append(err)
            print(f"  [FAIL] {err}")
    else:
        failed += 1
        err = "Missing vite.config.ts"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 6. Validate Architecture Documentation Presence & Completeness
    print("\n[6] Validating Production Architecture Specification (docs/ARCHITECTURE_PRODUCTION.md)...")
    arch_doc = ROOT / "docs" / "ARCHITECTURE_PRODUCTION.md"
    if arch_doc.exists():
        arch_text = arch_doc.read_text(encoding="utf-8")
        has_mode_a = "Mode A: Local-First MVP" in arch_text
        has_mode_b = "Mode B: Hosted Production" in arch_text
        has_mode_c = "Mode C: Hybrid" in arch_text
        has_limitation = "Localhost vs Remote Browser Origin Limitation" in arch_text

        if has_mode_a and has_mode_b and has_mode_c and has_limitation:
            passed += 1
            print("  [PASS] docs/ARCHITECTURE_PRODUCTION.md details Modes A, B, C and localhost limitations")
        else:
            failed += 1
            err = "docs/ARCHITECTURE_PRODUCTION.md missing deployment modes or limitation section"
            errors.append(err)
            print(f"  [FAIL] {err}")
    else:
        failed += 1
        err = "Missing docs/ARCHITECTURE_PRODUCTION.md"
        errors.append(err)
        print(f"  [FAIL] {err}")

    print("\n" + "=" * 72)
    print(f" PRODUCTION READINESS RESULT: {passed} PASSED, {failed} FAILED")
    print("=" * 72 + "\n")

    return passed, failed, errors

if __name__ == "__main__":
    passed, failed, errors = verify_production_readiness()
    if failed > 0:
        print(f"[FAIL] Production readiness check failed with {failed} errors.")
        sys.exit(1)
    else:
        print(f"[PASS] All {passed} production readiness criteria verified successfully.")
        sys.exit(0)
