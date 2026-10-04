# LectureLens Student Quick Start & Release Guide

**Welcome to LectureLens!**  
LectureLens is an AI-powered study assistant that transforms your lecture recordings, PDFs, YouTube videos, and class notes into structured summaries, context-grounded tutor dialogues, spaced-repetition flashcards, and adaptive exam schedules.

---

## 1. Architecture Overview (How LectureLens Runs)

LectureLens operates in **Mode A (Local-First MVP)**:
- **Web Interface**: Hosted statically on Netlify CDN at [`https://lecturelens-app.netlify.app`](https://lecturelens-app.netlify.app).
- **Cloud Database & Sync**: Multi-tenant PostgreSQL and secure file storage hosted on Supabase Cloud.
- **AI Processing (Private & Free)**: Speech transcription (`faster-whisper`) and language model synthesis (`qwen3:0.6b`) run **locally on your machine**. Your audio recordings and notes are never sent to third-party commercial AI APIs!

```
┌─────────────────────────────────────────────────────────────┐
│                 LectureLens Architecture                     │
│                                                             │
│   Netlify Static Frontend (https://lecturelens-app.netlify.app)
│              │                                  │           │
│              ▼                                  ▼           │
│   Supabase Cloud (Auth & DB)         Student Personal Laptop│
│   - Multi-tenant student accounts    - FastAPI Bridge (:8000│
│   - Encrypted note storage           - faster-whisper (CPU) │
│   - Flashcard review history         - Ollama qwen3:0.6b    │
└─────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> Because AI processing runs on your own hardware, you must start the local AI bridge on your computer when you want to transcribe lectures or ask the AI Tutor questions.

---

## 2. 3-Step Quick Launch

### Step 1: Install & Launch Ollama
1. Download Ollama from [ollama.com](https://ollama.com) (Windows, macOS, or Linux).
2. Open your terminal and pull the compact, high-accuracy Qwen3 model:
   ```bash
   ollama pull qwen3:0.6b
   ```
3. Ensure Ollama is running (it runs in the background automatically, or launch via `ollama serve`).

### Step 2: Launch the Local AI Bridge
1. Open a terminal in the LectureLens directory and activate your Python environment:
   ```bash
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux:
   source .venv/bin/activate
   ```
2. Start the local bridge:
   ```bash
   uvicorn backend.main:app --port 8000 --reload
   # Or directly:
   python backend/main.py
   ```
3. Verify it is running by opening `http://localhost:8000/health` in your browser. You will see:
   `{"status": "ok", "model": "qwen3:0.6b", "whisperEngine": "faster-whisper", ...}`

### Step 3: Open the Live Application
Navigate to **[`https://lecturelens-app.netlify.app`](https://lecturelens-app.netlify.app)**:
1. Click **Sign In** or **Sign Up** to create your private account.
2. In the top navigation bar, the AI indicator should display **"AI Connected"** (green beacon).
3. Start studying!

---

## 3. Remote & Mobile Study (Cloudflare Quick Tunnel)

Want to study from your phone or campus library while your home computer handles AI processing?

1. Install Cloudflare Tunnel CLI (`cloudflared`):
   - Windows: `winget install Cloudflare.cloudflared`
   - macOS: `brew install cloudflare/cloudflare/cloudflared`
2. Expose your local AI bridge with a free, temporary tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
3. Cloudflare will output a public HTTPS URL like:  
   `https://random-words-here.trycloudflare.com`
4. In LectureLens, open the **Local AI Settings Modal** and paste your tunnel URL into the `API Endpoint` field.
5. Your mobile phone or laptop can now access full AI features anywhere!

> [!WARNING]
> Your home computer must remain powered on with both `cloudflared` and `backend/main.py` running for remote AI requests to succeed.

---

## 4. Student Keyboard Shortcuts Reference

Study faster with built-in Apple HIG keyboard shortcuts:

### Active Recall & Flashcard Deck Runner
| Shortcut | Action | Description |
|---|---|---|
| <kbd>Space</kbd> | **Flip Card** | Reveal the back of the active flashcard |
| <kbd>1</kbd> | **Again** | Mark card as failed (<1 day FSRS interval) |
| <kbd>2</kbd> | **Hard** | Mark card as challenging |
| <kbd>3</kbd> | **Good** | Mark card as remembered successfully |
| <kbd>4</kbd> | **Easy** | Mark card as effortless (>4 day interval) |
| <kbd>Z</kbd> | **Undo Rating** | Roll back the previous card rating |
| <kbd>R</kbd> | **Restart Deck** | Reset the current study deck to card 1 |

### Audio Player & AI Tutor Dialogue
| Shortcut | Action | Description |
|---|---|---|
| <kbd>Space</kbd> | **Play / Pause** | Toggle playback when audio player is focused |
| <kbd>←</kbd> / <kbd>→</kbd> | **Seek ±5s** | Skip backward or forward in audio |
| <kbd>Click Citation</kbd> | **Jump to Timecode** | Click any `[MM:SS]` citation in Tutor or Notes to instantly seek audio |

### Accessibility & Navigation
| Shortcut | Action | Description |
|---|---|---|
| <kbd>Tab</kbd> / <kbd>Shift + Tab</kbd> | **Cycle Focus** | Move between accessible buttons, cards, and inputs |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | **Activate** | Submit form, open modal, or trigger action |
| <kbd>Esc</kbd> | **Dismiss** | Close active modal dialog or sliding drawer |

---

## 5. Troubleshooting & Diagnostics

### Problem 1: AI indicator shows "AI Offline"
- **Cause**: The Python FastAPI bridge is not running on port 8000, or Ollama is stopped.
- **Fix**:
  1. Open a terminal and run `ollama list`. Confirm `qwen3:0.6b` is installed.
  2. Run `.\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000`.
  3. Refresh `https://lecturelens-app.netlify.app`.

### Problem 2: YouTube video import says "Captions unavailable"
- **Cause**: Some YouTube videos disable auto-generated or official English captions.
- **Fix**: LectureLens automatically detects this and presents the pre-filled **Manual Transcript Fallback Editor**. Simply paste the lecture description, transcript, or your personal notes, and click **Generate Notes**.

### Problem 3: Browser console reports "CORS request blocked"
- **Cause**: The local backend is running with a restricted CORS list that does not include your frontend origin.
- **Fix**: Check `backend/main.py` or `backend/.env`. By default, `http://localhost:5173`, `http://localhost:3000`, and `https://lecturelens-app.netlify.app` are in the approved origin list.

### Problem 4: Audio file upload fails with "Unsupported format"
- **Cause**: File extension is not an approved lecture format.
- **Fix**: LectureLens supports `.mp3`, `.wav`, `.m4a`, `.mp4`, `.aac`, `.flac`, `.ogg`, and `.webm`. Convert proprietary voice memos to `.m4a` or `.mp3` before uploading.
