# LectureLens Production Architecture & Deployment Specification

**Version:** 1.0  
**Phase:** 17 — Production Architecture & Deployment Preparation (`PROD-01`)  
**Status:** Approved  
**Last Updated:** 2026-10-01  

---

## 1. Executive Summary

LectureLens is an AI-powered lecture study assistant built with a **React 19 + TypeScript (Vite)** frontend client and a **Supabase PostgreSQL** cloud persistence layer. For AI inference—specifically speech-to-text audio transcription and large language model (LLM) summarization/Q&A—LectureLens utilizes a decoupled Python FastAPI bridge interfacing with `faster-whisper` and local Ollama (`qwen3:0.6b`).

To provide students with total data privacy and zero hosting fees while supporting cloud accessibility, this document formalizes the production deployment topology, delineates three distinct operating modes, documents key technical limitations, and defines the security boundary.

---

## 2. Deployment Modes

LectureLens explicitly supports three deployment modes:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THREE DEPLOYMENT MODES                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  [MODE A: Local-First MVP]                                                              │
│  Netlify Web SPA ──(Browser: http://localhost:8000)──> Student Local Machine            │
│                                                        ├── FastAPI Bridge (:8000)       │
│                                                        ├── faster-whisper (CPU/int8)    │
│                                                        └── Ollama qwen3:0.6b (:11434)    │
│                                                                    │                    │
│                                                                    ▼                    │
│                                                        Supabase Cloud (PostgreSQL + RLS)│
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  [MODE B: Hosted Production]                                                            │
│  Netlify Web SPA ──(HTTPS: https://api.lecturelens.edu)──> Remotely Hosted Backend      │
│                                                            ├── Containerized FastAPI    │
│                                                            └── Cloud AI Inference       │
│                                                                    │                    │
│                                                                    ▼                    │
│                                                        Supabase Cloud (PostgreSQL + RLS)│
│                                                                                         │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                         │
│  [MODE C: Hybrid / Remote Access]                                                       │
│  Netlify Web SPA ──(HTTPS: Cloudflare Tunnel)─────────> Student Local Machine           │
│                    (e.g. *.trycloudflare.com)         ├── cloudflared tunnel           │
│                                                        ├── FastAPI Bridge (:8000)       │
│                                                        ├── faster-whisper               │
│                                                        └── Ollama qwen3:0.6b              │
│                                                                    │                    │
│                                                                    ▼                    │
│                                                        Supabase Cloud (PostgreSQL + RLS)│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mode A: Local-First MVP (Recommended for Students)
- **Frontend**: Hosted on a public static CDN (e.g. Netlify, Cloudflare Pages) or run locally (`http://localhost:5173`).
- **Backend & AI**: Runs locally on the student's personal machine (`http://localhost:8000` / `http://127.0.0.1:8000`).
- **Database & Auth**: Supabase Cloud PostgreSQL, secured by Row Level Security (RLS) policies.
- **Important Distinction**: **Netlify hosts ONLY the static HTML, CSS, and JavaScript bundle.** Netlify does **NOT** run Python, faster-whisper, CTranslate2, or Ollama. All heavy ML inference executes 100% on the student's own hardware.
- **Benefits**: Zero cloud GPU costs, complete privacy for proprietary university recordings, and unlimited transcription and tutor interactions.

### Mode B: Hosted Production (Institutional / Multi-Tenant Cloud)
- **Frontend**: Hosted on Netlify or a university web domain.
- **Backend & AI**: FastAPI server deployed in a cloud container (e.g. Docker on a GPU-enabled VM or managed container service) providing a publicly accessible HTTPS endpoint (e.g. `https://api.lecturelens.edu`).
- **Database & Auth**: Supabase Cloud or self-hosted Supabase PostgreSQL.
- **Benefits**: Students can access AI features from any device (including smartphones and Chromebooks) without running local Python or Ollama services.

### Mode C: Hybrid / Cloudflare Tunnel (Remote Access to Personal AI)
- **Frontend**: Hosted on Netlify (`https://lecturelens.netlify.app`).
- **Backend & AI**: Runs on the student's personal home desktop/laptop, exposed to the web via a secure Cloudflare Quick Tunnel (`cloudflared tunnel --url http://localhost:8000`).
- **Frontend Configuration**: The student enters their tunnel URL (`https://your-tunnel.trycloudflare.com`) into `VITE_API_BASE_URL` or the in-app Local AI settings modal.
- **Database & Auth**: Supabase Cloud.
- **Benefits**: Allows testing or accessing personal local AI from university Wi-Fi or mobile devices without deploying expensive cloud GPU infrastructure.

---

## 3. Critical Architectural Limitations

### Localhost vs Remote Browser Origin Limitation
A web browser visiting a public website hosted on Netlify (e.g. `https://lecturelens.netlify.app`) cannot communicate with `http://localhost:8000` of a different machine. Specifically:
1. **Student's Own Machine**: If a student opens the Netlify URL in a browser on their own laptop, their browser *can* make requests to `http://localhost:8000` on that same laptop, provided the browser does not block mixed content (HTTP from an HTTPS origin).
2. **Third-Party Visitor**: If a classmate or professor visits the developer's public Netlify link from their own device, their browser will attempt to contact `http://localhost:8000` on *their own device*, not the developer's computer. Unless they have LectureLens FastAPI running locally, local AI endpoints will fail.
3. **Tunnel Dependency**: A Cloudflare Quick Tunnel solves this by giving the local backend a public HTTPS hostname (e.g. `https://*.trycloudflare.com`). However:
   - The developer's physical computer must remain powered on and connected to the internet.
   - The `cloudflared` process and FastAPI bridge (`python backend/main.py`) must remain running.
   - If the computer sleeps, the tunnel disconnects immediately.

### Offline & Simulation Fallback Tier
LectureLens is engineered so that when the local AI bridge is unreachable, the application **never crashes or hangs**:
- The frontend detects backend unavailability within 2 seconds.
- The UI displays an actionable, Apple-inspired status pill and diagnostic modal with exact setup commands (`ollama serve`, `ollama pull qwen3:0.6b`, `python backend/main.py`).
- Pre-computed intelligent simulations and fallback notes/quizzes allow full inspection of the UI, study tools, flashcard runner, and calendar even without local AI running.

---

## 4. Configuration & Secret Boundaries

### Public Client Configuration (`VITE_*`)
The Vite frontend compiles environment variables prefixed with `VITE_` into public client JavaScript. Anyone inspecting the browser bundle can read these values.

| Variable | Classification | Description | Sample Production Value |
|---|---|---|---|
| `VITE_API_BASE_URL` | **Public Config** | URL of the FastAPI bridge. Can point to `http://127.0.0.1:8000`, a Cloudflare tunnel, or a hosted backend. | `http://localhost:8000` or `https://tunnel.trycloudflare.com` |
| `VITE_SUPABASE_URL` | **Public Config** | Public Supabase project endpoint. | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Public Anon Key** | Supabase anonymous client API key. Safe for client exposure because all data access is gated by PostgreSQL Row Level Security (RLS). | `eyJhbGciOi...` |

### Strictly Forbidden in Client Bundles (Secrets)
The following credentials must **NEVER** be assigned to `VITE_*` variables or committed to version control:
- `SUPABASE_SERVICE_ROLE_KEY` (Bypasses all Row Level Security policies; full database admin rights).
- `SUPABASE_DB_PASSWORD` or direct PostgreSQL connection strings.
- Ollama API keys, Cloudflare account tokens, or SSH credentials.

---

## 5. CORS Security Architecture

Cross-Origin Resource Sharing (CORS) in `backend/main.py` prevents unauthorized web applications from issuing cross-origin requests to a student's local AI bridge.

### Strict Origin Allowlist Rules
- The backend reads `CORS_ORIGINS` from the environment as an explicit, comma-separated list of exact allowed origins.
- **No Wildcard Domains**: `allow_origin_regex` wildcard matchers for arbitrary `*.netlify.app` or `*.trycloudflare.com` domains are strictly disabled in production. Every permitted origin must be explicitly listed.
- **Development Fallbacks**: When `CORS_ORIGINS` is not set, the backend safely defaults to local development origins:
  - `http://localhost:5173` (Vite dev server)
  - `http://127.0.0.1:5173`
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
- **Configured Origins Example**:
  ```env
  CORS_ORIGINS=http://localhost:5173,https://lecturelens.netlify.app,https://my-study-tunnel.trycloudflare.com
  ```

---

## 6. Static Hosting & SPA Routing

When deployed to static CDNs such as Netlify or Cloudflare Pages, single-page application (SPA) client-side routing requires all route paths (e.g. `/workspace`, `/tutor`, `/recall`, `/planner`) to serve `index.html` with an HTTP 200 response rather than returning a 404 Not Found error.

LectureLens provides dual, non-conflicting configurations:
1. `public/_redirects`: Canonical static CDN rewrite rule copied directly to `dist/_redirects` during build:
   ```
   /* /index.html 200
   ```
2. `netlify.toml`: Formal Netlify build configuration specifying publish directory, build command, and redirect rules:
   ```toml
   [build]
     publish = "dist"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

Both files declare identical `/* /index.html 200` semantics, ensuring consistent deployment behavior across Netlify, Vercel, and Cloudflare Pages.
