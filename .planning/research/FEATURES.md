# Feature Research

**Domain:** AI Educational Assistant & Multimodal Lecture Processing
**Researched:** 2026-09-28
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| PDF Lecture Upload & Parsing | Most university materials are distributed as lecture slides or PDF handouts. | LOW | Extract clean text while skipping blank pages and headers. |
| Audio/Video File Upload & Transcription | Students record classroom audio or download lectures. | MEDIUM | `faster-whisper` converts speech to timestamped text. |
| AI Summary & Structured Notes | The core promise of an AI study tool is condensing 1-hour lectures into structured notes. | MEDIUM | Multi-section output: Executive Summary, Key Concepts, Action Items. |
| Interactive AI Tutor (Q&A) | Students get stuck on specific topics and need instant explanations grounded in lecture notes. | MEDIUM | Prompt-engineered RAG feeding lecture text into Ollama. |
| Flashcards & Spaced Recall | Active recall is proven most effective for exam study. | LOW | Generate Front/Back cards with 3D flip card UI. |
| Student Dashboard | Central hub showing recent lectures, stats, and quick actions. | LOW | Matching Stitch visual layout with Apple-inspired widgets. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 100% Local & Free AI (Ollama + Whisper) | Zero monthly API bills for students, complete data privacy, works offline. | MEDIUM | No OpenAI token limits or credit card requirements. |
| YouTube Lecture Ingestion with Smart Fallback | One-click import of recorded lectures from YouTube playlists. | LOW | Instant caption retrieval; fallback to manual transcript input if disabled. |
| PYQ (Previous Year Questions) Topic Mapper | Connects theoretical lecture concepts directly to actual university exam questions. | HIGH | Maps exam questions to lecture timestamps/topics (v2 priority). |
| Apple-Grade Glassmorphism (Stitch Fidelity) | Gorgeous, calm study environment with Poppins typography eliminating study fatigue. | MEDIUM | Strict adherence to the Stitch prototype tokens and layout. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Live Google Meet / Zoom Bot | "Automate everything" allure. | Fragile headless browsers, anti-bot captcha blocks, security and meeting permission issues. | Manual file upload of recorded audio/video or transcript export. |
| In-Browser WASM Whisper | Desired to avoid running Python backend. | Heavy 500MB+ downloads per session, high browser RAM crashes, sluggish performance. | Lightweight local Python FastAPI server. |
| Real-time Audio Streaming Transcription | Looks futuristic during recording. | Drops packets, high CPU spikes, difficult to error-recover if model lags. | Upload and process in batch with a clean progress bar. |

## Feature Dependencies

```
[PDF / Audio / YouTube Upload]
        └──produces──> [Clean Lecture Transcript / Text]
                               └──requires──> [Ollama Note Generation Engine]
                                                       ├──powers──> [AI Structured Notes & Summaries]
                                                       ├──powers──> [AI Tutor Q&A Chat]
                                                       ├──powers──> [Flashcards Generator]
                                                       └──powers──> [Quiz / Assessment Generator]
```

### Dependency Notes

- **Note Generation & AI Tutor require Clean Transcript:** Text extraction/transcription must succeed before any LLM operations can run.
- **Flashcards & Quizzes enhance Structured Notes:** Generated directly from the synthesized concepts.
- **PYQ Mapping requires Lecture Knowledge Base:** Cannot map past year questions without a reference lecture catalog.

## MVP Definition

### Launch With (v1 - 3-Day Scope)

Minimum viable product — what's needed to deliver the complete core student loop.

- [ ] **Modern Dashboard Shell:** Navigation rail, recent lecture cards, quick upload trigger.
- [ ] **Multimodal Ingestion Hub:** PDF upload + Audio file upload (`faster-whisper`) + YouTube link parser with manual fallback.
- [ ] **AI Note Synthesizer:** Structured summaries, key definitions, and takeaways generated via Ollama.
- [ ] **Lecture View & Notes Workspace:** Apple-inspired split view reading canvas with tabs (Summary, Full Text, Key Concepts).
- [ ] **AI Tutor Copilot:** Contextual chat panel answering questions strictly grounded in the active lecture.
- [ ] **Interactive Flashcard Deck:** Auto-generated question/answer cards with 3D flip interaction and study rating (Easy/Medium/Hard).

### Add After Validation (v1.x)

Features to add once core is working smoothly.

- [ ] **Quiz & MCQ Center:** 5-question multiple choice quizzes with instant grading and explanations.
- [ ] **Audio Scrubber Sync:** Interactive audio playback bar highlighting lecture transcript chunks in sync.

### Future Consideration (v2+)

Features to defer until student workflow is validated.

- [ ] **PYQ (Previous Year Question Paper) Analyzer:** Ingest past exam papers and tag high-yield lecture topics.
- [ ] **Study Planner & Calendar:** Automated exam countdown and daily study schedule generator.
- [ ] **Campus / Multi-User Collaboration:** Shared decks and cohort study rooms.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dashboard & Stitch Layout | HIGH | LOW | P1 |
| PDF Text Extractor | HIGH | LOW | P1 |
| Audio Whisper Transcription | HIGH | MEDIUM | P1 |
| YouTube Ingestion + Fallback | MEDIUM | LOW | P1 |
| AI Summaries & Structured Notes | HIGH | MEDIUM | P1 |
| AI Tutor Q&A | HIGH | MEDIUM | P1 |
| Flashcard Generator & Deck | HIGH | LOW | P1 |
| Quiz & MCQ Generator | MEDIUM | MEDIUM | P2 |
| PYQ Analysis Engine | HIGH | HIGH | P2 |
| Study Planner Calendar | MEDIUM | MEDIUM | P3 |

## Sources

- Google Stitch Prototype `projects/11893050174269724482`
- User requirements and constraints (3-day MVP, beginner friendly)
- Higher education study habits and student active recall research

---
*Feature research for: LectureLens AI Study Assistant*
*Researched: 2026-09-28*
