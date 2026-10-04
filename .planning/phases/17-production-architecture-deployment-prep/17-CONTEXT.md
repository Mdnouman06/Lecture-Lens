# Phase 17 Context: Production Architecture & Deployment Preparation

**Phase:** 17 — Production Architecture & Deployment Preparation  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [PROD-01]  

---

## 1. Objective

Prepare LectureLens for production architecture formalization, deployment readiness, and security hardening:

1. **Production Architecture Formalization (`PROD-01`)**:
   - Author `docs/ARCHITECTURE_PRODUCTION.md` distinguishing three explicit deployment modes:
     - **Mode A (Local-First MVP)**: Netlify frontend (or local Vite) → User's own local FastAPI bridge (`http://localhost:8000` / `http://127.0.0.1:8000`) → User's own `faster-whisper` + Ollama `qwen3:4b` → Supabase cloud database/auth. *Note: Netlify does NOT host the Whisper or Ollama ML engines.*
     - **Mode B (Hosted Production)**: Netlify frontend → Remotely hosted backend/inference service → Supabase.
     - **Mode C (Hybrid)**: Netlify frontend → Configurable API endpoint (`VITE_API_BASE_URL`) pointing either to a user's local FastAPI server (via direct localhost or Cloudflare Tunnel) or a hosted backend → Supabase.
   - **Explicit Limitation Documentation**: A web browser visiting a public Netlify deployment (`https://*.netlify.app`) cannot reach a developer's private `localhost` backend across the internet. A Cloudflare Quick Tunnel can bridge a local backend to the web for demonstration, but the host machine must remain on and the tunnel process active.

2. **Public Client Configuration vs Secret Hygiene (`PROD-01`)**:
   - `VITE_API_BASE_URL` is public client configuration, not a secret. It enables seamless switching between `http://127.0.0.1:8000`, a Cloudflare Quick Tunnel URL (`https://your-tunnel.trycloudflare.com`), or a future hosted backend.
   - Strictly forbid exposing Supabase service-role keys, Ollama credentials, or backend private tokens in any `VITE_*` variable. Only `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_URL` may be accessible in the client bundle.

3. **CORS Security Hardening (`PROD-01`)**:
   - Refactor `backend/main.py` CORS middleware to use an explicit, comma-separated allowlist via `CORS_ORIGINS`.
   - Do NOT use open wildcards (`*`) or arbitrary `*.netlify.app` / `*.trycloudflare.com` regex matchers in production.
   - Enforce exact origins with default local fallbacks (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`, `http://127.0.0.1:3000`) and explicit operator-configured domains.

4. **Vite Bundle Optimization & Cloudflare Tunnel Preservation (`PROD-01`)**:
   - Inspect current `vite.config.ts` and preserve `server.allowedHosts` for Cloudflare Quick Tunnels.
   - Measure bundle sizes first; implement sensible `manualChunks` (`vendor-react`, `vendor-supabase`, `vendor-ui`) so chunks stay under 500kB without excessive fragmentation.

5. **Static Hosting SPA Routing (`PROD-01`)**:
   - Deploy matching `public/_redirects` and `netlify.toml` with `/* /index.html 200` to support direct client-side route reloads on Netlify without conflicting rules.

6. **Automated Production Readiness Verification (`PROD-01`)**:
   - Author `scripts/verify_production_readiness.py` validating configuration correctness (actual chunk byte sizes < 500kB, exact CORS allowlists, absence of tracked secrets in git, and valid SPA rewrite syntax).

---

## 2. Technical Stack & Component Architecture

```
LectureLens Production Topologies
─────────────────────────────────────────────────────────────────────────────
[Mode A: Local-First MVP]
Netlify Web SPA  ──(Browser: http://localhost:8000)──> Local FastAPI (8000)
                                                             │
                                                  ┌──────────┴──────────┐
                                                  ▼                     ▼
                                            faster-whisper         Ollama qwen3:4b
                                            (CTranslate2 CPU)      (localhost:11434)
                                                  │
                                                  ▼
                                            Supabase Cloud (PostgreSQL + RLS)

─────────────────────────────────────────────────────────────────────────────
[Mode B: Hosted Production]
Netlify Web SPA  ──(HTTPS)──> Hosted Backend & AI Inference ──> Supabase Cloud

─────────────────────────────────────────────────────────────────────────────
[Mode C: Hybrid / Quick Tunnel]
Netlify Web SPA  ──(VITE_API_BASE_URL: https://tunnel.trycloudflare.com)──> 
                 Cloudflare Tunnel ──> Local Machine FastAPI (:8000) ──> Supabase
```

---

## 3. Plan Decomposition

- **Plan 17-01**: Production Architecture Formalization, Environment Configuration, Secret Hygiene & CORS Hardening
  - `docs/ARCHITECTURE_PRODUCTION.md`: 3 distinct modes, localhost limitations, data flow, security model.
  - `.env.example` and `backend/.env.example`: Public vs secret variable boundaries, exact CORS examples.
  - `backend/main.py`: Exact allowlist parsing for `CORS_ORIGINS` without arbitrary wildcards.
  - Git secret tracking audit.
- **Plan 17-02**: Vite Code-Splitting (< 500kB Chunks), Cloudflare Tunnel Preservation, Netlify SPA Routing & Production Readiness Suite
  - `vite.config.ts`: Preserve `server.allowedHosts`, add sensible `manualChunks` under 500kB.
  - `public/_redirects` and `netlify.toml`: Consistent SPA rewrite rules (`/* /index.html 200`).
  - `scripts/verify_production_readiness.py`: Validates actual chunk sizes, CORS parsing, SPA rules, secret exclusion.
  - Master test orchestrator verification via `scripts/run_all_tests.py`.

---

## 4. Acceptance Criteria

1. `docs/ARCHITECTURE_PRODUCTION.md` clearly explains Modes A, B, and C and explicitly warns about localhost limitations.
2. `backend/main.py` enforces exact comma-separated `CORS_ORIGINS` without wildcards.
3. Git index has zero tracked `.env` files or secrets; only publishable keys in client configs.
4. `vite.config.ts` preserves `allowedHosts` and splits vendor chunks under 500kB.
5. `public/_redirects` and `netlify.toml` align on `/* /index.html 200`.
6. `scripts/verify_production_readiness.py` and `scripts/run_all_tests.py` achieve 100% pass rate.
