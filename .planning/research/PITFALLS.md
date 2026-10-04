# Pitfalls Research

**Domain:** AI Educational Assistant & Multimodal Lecture Processing
**Researched:** 2026-09-28
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Browser HTTP Timeout on Long Audio Transcription

**What goes wrong:**
Transcribing a 45-minute lecture using `faster-whisper` on a CPU can take 2–5 minutes. A standard synchronous HTTP POST request times out, leaving the student staring at a broken UI.

**Why it happens:**
Default browser `fetch` or Axios timeouts fire after 60–120 seconds if the connection remains silent.

**How to avoid:**
Implement an asynchronous processing task pattern or a polling/SSE endpoint in FastAPI (`/transcribe/status/{job_id}`) or keep the client timeout explicitly extended while rendering an animated progress indicator with informative micro-steps ("Extracting audio", "Transcribing with Whisper", "Synthesizing notes with Ollama").

**Warning signs:**
`ERR_CONNECTION_RESET` or `TimeoutError` in browser console after 60 seconds on files > 10MB.

**Phase to address:**
Phase 2 (Lecture Ingestion & Local AI Bridge).

---

### Pitfall 2: Ollama JSON Formatting Breakdown & Context Truncation

**What goes wrong:**
When asking small local models (e.g. `llama3.2:3b` or `mistral:7b`) to return complex structured JSON containing notes, key concepts, and 10 flashcards in one prompt, the model often drops closing brackets, outputs trailing conversational text, or truncates.

**Why it happens:**
Small parameter models struggle with complex JSON schema adherence when prompts are very long or unconstrained.

**How to avoid:**
1. Use Ollama's `format: "json"` parameter in the API call.
2. Structure generation into focused modular prompts: (a) Generate Summary & Key Points, (b) Generate Flashcards.
3. Include regex-based fallback cleanup in Python to strip any markdown backticks before JSON parsing.

**Warning signs:**
`JSONDecodeError: Expecting ',' delimiter` in FastAPI logs when parsing Ollama response.

**Phase to address:**
Phase 3 (AI Notes & Flashcards Engine).

---

### Pitfall 3: YouTube Captions Disabled or Blocked

**What goes wrong:**
Student pastes a YouTube lecture URL, but the video creator disabled captions or YouTube's automated rate limits block the IP, resulting in an unhandled crash.

**Why it happens:**
`youtube-transcript-api` throws `NoTranscriptFound` or `TranscriptsDisabled` exceptions on videos without captions.

**How to avoid:**
Catch exceptions cleanly in Python and return a friendly structured response (`{ "status": "no_captions", "message": "No automated captions found for this video." }`). In the React UI, automatically switch the input to a manual transcript paste textarea or audio upload alternative.

**Warning signs:**
500 Internal Server Error when importing certain YouTube links.

**Phase to address:**
Phase 2 (Lecture Ingestion & Local AI Bridge).

---

### Pitfall 4: Local AI Disconnection Leaving UI in a Broken State

**What goes wrong:**
If Ollama or the FastAPI backend is not started, the React app crashes or shows perpetual loading spinners when users click "Generate Notes" or "Ask Tutor".

**Why it happens:**
Frontend assumes local services are always running without prior health verification.

**How to avoid:**
Add a lightweight heartbeat check (`GET http://localhost:8000/health`) on app launch. Display a polite status pill in the top header:
- `🟢 Local AI Ready`
- `🟡 Local AI Offline (Using Interactive Demo Mode)`
Provide one-click instructions to start the local services, plus high-quality sample lecture data so the app can be explored even before local AI is booted.

**Warning signs:**
`net::ERR_CONNECTION_REFUSED` in console and unclickable buttons.

**Phase to address:**
Phase 1 (Dashboard & Project Shell).

---

### Pitfall 5: Styling Drift from Google Stitch Designs & Font Inconsistency

**What goes wrong:**
App ends up with generic browser fonts, mismatched button padding, and lack of visual polish, breaking the Apple-inspired aesthetic.

**Why it happens:**
Ad-hoc styling without establishing core CSS tokens (colors, blur filters, shadows, and Poppins font hierarchy) at the very start.

**How to avoid:**
Extract the exact CSS variables and typography tokens directly from Google Stitch project `11893050174269724482` into `tokens.css`. Enforce `font-family: 'Poppins', sans-serif` globally on `*`, `button`, `input`, and `select`.

**Warning signs:**
Times New Roman or default system fonts appearing on buttons or inputs; harsh opaque gray borders instead of subtle translucency.

**Phase to address:**
Phase 1 (Dashboard & Project Shell).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| In-memory store instead of Supabase during Day 1 | Faster initial component assembly | Loss of lecture state on page refresh | Acceptable during initial UI prototyping; replace with Supabase in Phase 2 |
| Single monolithic FastAPI file | Quick setup for 3 endpoints | Hard to navigate when adding RAG tutor logic | Only during Day 1; refactor into modular services by Day 2 |
| Passing entire raw transcript to Ollama without chunking | Simple prompt string | Crashes or hallucinated summaries on 2-hour lectures | Acceptable only on short test files (< 10 min) |

## "Looks Done But Isn't" Checklist

- [ ] **PDF Upload:** Often works on simple text PDFs but fails on scanned images — verify proper error messaging for non-extractable PDFs.
- [ ] **Audio Whisper Transcription:** Often tested only with 15-second clips — verify with a realistic 15-to-30-minute lecture audio file.
- [ ] **Flashcards:** Flip animation works on desktop hover but gets stuck on mobile touch — verify click-to-flip behavior.
- [ ] **AI Tutor:** Answers generic knowledge questions well, but hallucinates when asked about specific lecture details — verify prompt grounding on lecture text.

---
*Pitfalls research for: LectureLens AI Study Assistant*
*Researched: 2026-09-28*
