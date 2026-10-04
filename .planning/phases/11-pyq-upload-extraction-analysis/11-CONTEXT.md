# Phase 11 Context: PYQ Upload, Question Extraction & Historical Analysis

**Phase:** 11 — PYQ Upload, Question Extraction & Historical Analysis  
**Milestone:** 2 — Production Readiness & Deployment  
**Status:** Planned  
**Requirements:** [ADV-01, ADV-02, ADV-04]  

---

## 1. Objective

Implement an authentic exam intelligence pipeline that parses real university Previous Year Question Paper (PYQ) PDFs with `pypdf`, extracts structured question blocks and grading rubrics using local Ollama (`qwen3:4b`), correlates questions to lecture concepts, and persists exam archives to Supabase PostgreSQL:
1. Upload PYQ exam PDFs (`POST /pyq/upload`) and extract clean text and page boundaries using `pypdf`.
2. Extract structured question records (`questionNumber`, `marks`, `problemStatement`, `topicTag`, `rubricCriteria`, `commonPitfall`, `recurrenceYears`, `midtermProbability`) using `qwen3:4b` with a robust regex boundary fallback.
3. Compute a dynamic Topic Weighting Matrix (`GET /pyq/topics`) based on uploaded exams, categorizing recurring topics by weight, predicted question count, and notes coverage.
4. Correlate extracted exam questions to student lecture transcripts and notes (`POST /pyq/match`), linking directly to audio timecodes.
5. Persist uploaded papers and extracted questions to Supabase PostgreSQL (`public.pyq_papers` and `public.pyq_questions`) under user ownership.
6. Replace static canned Henderson mock data in `PyqIntelligenceView.tsx` with live database hydration and an Apple-inspired empty state when no papers have been uploaded yet.

---

## 2. Architecture & Data Flow

```
[Student in Exam Preparation & PYQ Intelligence View]
       │
       ▼ (Uploads exam PDF via "Import PYQ Paper")
[PyqIntelligenceView.tsx / PyqPaperArchive.tsx]
       │
       ▼ (FormData: file + courseCode)
[Client Service: uploadPyqPaper in src/services/api.ts]
       │
       ▼ (POST /pyq/upload)
[FastAPI: backend/main.py]
       │
       ▼ (Extract text from PDF pages)
[backend/services/pyq.py: extract_pyq_pdf via pypdf.PdfReader]
       │
       ▼ (Prompts local Qwen3 with PYQ_EXTRACTION_PROMPT)
[Local Ollama: qwen3:4b on localhost:11434]
       │
       ▼ (Returns structured JSON: paper metadata, questions, rubrics, pitfalls)
[FastAPI normalizes paper & questions, aggregates topic weights]
       │
       ▼ (Client receives structured PyqPaper)
[Supabase Client: savePyqPaperToDb & savePyqQuestionsToDb]
       │
       ▼ (Persists to public.pyq_papers and public.pyq_questions)
[Supabase PostgreSQL Cloud DB]
       │
       ▼ (Interactive View Updates)
[PyqPaperArchive: displays newly indexed paper with real question count]
[PyqQuestionInspector: renders Henderson rubric steps & pitfall rate]
[PyqTopicWeightMatrix: renders calculated topic distribution]
       │
       ▼ (Clicking "Correlated Lecture Source")
[Lecture Workspace opens and seeks audio player to matching concept timestamp]
```

---

## 3. Key Decisions

1. **Hybrid AI + Regex Extraction**: Exam PDFs vary in formatting. The service will extract raw text via `pypdf`, chunk questions by recognizable numbering patterns (`Question 1`, `Q2`, `Part A`), and use `qwen3:4b` to structure problem statements, marks, grading rubrics, and pitfall analysis. If Ollama is offline or uninstalled, the regex parser provides instant structured fallback without crashing.
2. **Dynamic Topic Weighting**: Instead of hardcoded static neurobiology weights, `get_topic_weighting_matrix` dynamically aggregates topics from uploaded papers, computing frequency percentages and priority ratings (`critical`, `mastered`, `good`, `low`).
3. **Multi-Tenant Supabase Persistence**: Database operations in `src/services/lectures.ts` record `user_id` on all `pyq_papers` and `pyq_questions` rows. If tables are not yet created in the database, graceful fallback to client-side session state guarantees zero UI crashes.
4. **Authentic Lecture Grounding**: Extracted questions are correlated against the student's actual lectures by comparing topic tags and problem statement keywords with `key_concepts` in `lecture_notes` and transcript segments, allowing direct audio jumping.
5. **No Fake Default Exam Mocks**: The view renders real student-uploaded papers. If no papers are indexed yet, an inviting Apple HIG upload card is presented with clear instructions.

---

## 4. Work Breakdown (Plans)

- **11-01-PLAN**: Backend PDF Extraction Engine, Ollama Qwen3 PYQ Synthesis & FastAPI Endpoints (`backend/services/pyq.py`, `backend/services/ollama.py`, `backend/main.py`, `backend/test_api.py`).
- **11-02-PLAN**: Supabase Persistence Layer for PYQ Papers & Questions (`src/types/lecture.ts`, `src/services/lectures.ts`, `src/services/api.ts`).
- **11-03-PLAN**: PYQ Intelligence View Integration, Archive Hydration, Question Inspector & Lecture Linking (`src/views/PyqIntelligenceView.tsx`, `src/components/pyq/PyqPaperArchive.tsx`, `src/components/pyq/PyqQuestionInspector.tsx`, `src/components/pyq/PyqTopicWeightMatrix.tsx`).
