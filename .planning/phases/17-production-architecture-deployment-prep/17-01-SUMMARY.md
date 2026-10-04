# Plan Summary: 17-01 Production Architecture Formalization, Environment Configuration, Secret Hygiene & CORS Hardening

**Phase:** 17 — Production Architecture & Deployment Preparation  
**Plan:** 01  
**Status:** Complete  
**Date:** 2026-10-01  
**Requirements Addressed:** `PROD-01`  

---

## 1. Executive Summary

Plan 17-01 formalized the production deployment architecture across three distinct operating modes in `docs/ARCHITECTURE_PRODUCTION.md`, standardized production environment variable templates, enforced exact-origin allowlist CORS security in `backend/main.py`, and verified git secret hygiene. The architecture explicitly distinguishes between static frontend hosting on Netlify and heavy ML computation (Whisper & Ollama) running locally on the student's hardware or in an institutional container.

---

## 2. Key Deliverables & Changes

1. **Production Architecture Specification (`docs/ARCHITECTURE_PRODUCTION.md`)**:
   - Delineates 3 distinct deployment modes:
     - **Mode A (Local-First MVP)**: Netlify frontend → student's own FastAPI bridge (`localhost:8000`) → student's own `faster-whisper` + Ollama `qwen3:4b` → Supabase cloud database/auth. Netlify does **not** host the ML engines.
     - **Mode B (Hosted Production)**: Netlify frontend → remotely hosted backend & AI inference service → Supabase.
     - **Mode C (Hybrid / Quick Tunnel)**: Netlify frontend → configurable `VITE_API_BASE_URL` pointing via Cloudflare Quick Tunnel to the student's local machine → Supabase.
   - Explicitly documents the localhost limitation: a remote browser visiting the public Netlify link cannot communicate with a developer's localhost across the internet without an active tunnel on a running machine.
   - Outlines the 2-second offline fallback tier with actionable diagnostic setup commands and simulated study tools.

2. **Standardized Environment Templates (`.env.example` & `backend/.env.example`)**:
   - Documented `VITE_API_BASE_URL` as public client configuration (not a secret).
   - Documented `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (anon public key only).
   - Added explicit security warnings forbidding `SUPABASE_SERVICE_ROLE_KEY` in frontend bundles.
   - Documented `CORS_ORIGINS` as an explicit comma-separated list of exact allowed origins.

3. **CORS Security Hardening (`backend/main.py`)**:
   - Removed wildcard regex domain matchers (`allow_origin_regex`).
   - Implemented exact-origin allowlist parsing from `CORS_ORIGINS` with safe local development defaults (`localhost:5173`, `127.0.0.1:5173`, `localhost:3000`, `127.0.0.1:3000`).

4. **Git Secret Hygiene & Tracking Audit**:
   - Verified that `git ls-files` tracks zero `.env`, `.env.local`, or `backend/.env` files.
   - Verified that `git grep` finds zero occurrences of service-role keys.

---

## 3. Verification Evidence

- Backend REST & Route Integration: `python -m unittest backend.test_api backend.test_integration` passed (51/51 OK).
- Git tracking: `git ls-files .env backend/.env` returned 0 tracked files.
- Secret audit: `git grep -i "service_role"` returned 0 occurrences.

---

## 4. Next Step

Proceed to **Plan 17-02**: Vite Vendor Code-Splitting (< 500kB Chunks), Cloudflare Tunnel Preservation, Netlify SPA Routing & Production Readiness Suite.
