-- =============================================================================
-- LectureLens Production Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Phase 14: Data Persistence, Authentication, Security & RLS Hardening (SEC-01)
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABLE DEFINITIONS
-- =============================================================================

-- 1.1 Lectures Table
CREATE TABLE IF NOT EXISTS public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Lecture',
    course_code TEXT NOT NULL DEFAULT 'ALL',
    course_name TEXT NOT NULL DEFAULT 'General Academic Subject',
    source_type TEXT NOT NULL CHECK (source_type IN ('audio', 'pdf', 'youtube', 'transcript')),
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('synced', 'processing', 'ready')),
    duration TEXT NOT NULL DEFAULT '00:00',
    duration_seconds NUMERIC NOT NULL DEFAULT 0,
    progress_seconds NUMERIC NOT NULL DEFAULT 0,
    has_audio BOOLEAN NOT NULL DEFAULT false,
    audio_url TEXT,
    pdf_url TEXT,
    source_file_name TEXT,
    word_count INT NOT NULL DEFAULT 0,
    page_count INT NOT NULL DEFAULT 0,
    summary TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.2 Lecture Transcripts Table (Diarized Segments)
CREATE TABLE IF NOT EXISTS public.lecture_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    segment_index INT NOT NULL DEFAULT 0,
    speaker TEXT NOT NULL DEFAULT 'Speaker 1',
    start_seconds NUMERIC NOT NULL DEFAULT 0,
    end_seconds NUMERIC NOT NULL DEFAULT 0,
    text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.3 Lecture Notes Table (Hierarchical Study Notes & Syntheses)
CREATE TABLE IF NOT EXISTS public.lecture_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL DEFAULT '',
    markdown TEXT NOT NULL DEFAULT '',
    key_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
    exam_relevance TEXT,
    margin_notes TEXT,
    highlights JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.4 Flashcards Table (Active Recall & FSRS Spaced Repetition)
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    mastered BOOLEAN NOT NULL DEFAULT false,
    difficulty NUMERIC DEFAULT 0.3,
    stability NUMERIC DEFAULT 1.0,
    next_review_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.5 Quiz Submissions Table (Self-Assessment Drills & Accuracy Scores)
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 5,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.5b Quizzes Table (Canonical Active Quiz per Lecture)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Exam Drill',
    course_code TEXT NOT NULL DEFAULT 'ALL',
    time_limit_minutes INT NOT NULL DEFAULT 25,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_quizzes_lecture UNIQUE (lecture_id)
);

-- 1.6 PYQ Exam Papers Table (Past Year Question Papers Archive)
CREATE TABLE IF NOT EXISTS public.pyq_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course_code TEXT NOT NULL,
    instructor TEXT,
    year INT DEFAULT 2024,
    term TEXT DEFAULT 'Fall 2024',
    exam_type TEXT DEFAULT 'midterm',
    extracted_count INT NOT NULL DEFAULT 0,
    short_ans_count INT NOT NULL DEFAULT 0,
    long_ans_count INT NOT NULL DEFAULT 0,
    historical_mean NUMERIC DEFAULT 72.0,
    syllabus_match_percent NUMERIC DEFAULT 85.0,
    ocr_fidelity_percent NUMERIC DEFAULT 99.0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.7 PYQ Questions Table (Individual Extracted Exam Questions with Rubrics)
CREATE TABLE IF NOT EXISTS public.pyq_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id UUID NOT NULL REFERENCES public.pyq_papers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_number TEXT NOT NULL,
    marks INT NOT NULL DEFAULT 5,
    problem_statement TEXT NOT NULL,
    topic_tag TEXT,
    recurrence_years TEXT[] DEFAULT '{}'::text[],
    midterm_probability NUMERIC DEFAULT 75.0,
    rubric_criteria JSONB DEFAULT '[]'::jsonb,
    common_pitfall JSONB DEFAULT '{}'::jsonb,
    correlated_lecture JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.8 Study Blocks Table (Adaptive 7-Day Academic Calendar & Review Blocks)
CREATE TABLE IF NOT EXISTS public.study_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_index INT NOT NULL CHECK (day_index BETWEEN 0 AND 6),
    day_label TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('lecture', 'fsrs', 'deep', 'tutor', 'exam')),
    time_display TEXT NOT NULL,
    start_hour NUMERIC NOT NULL,
    duration_hours NUMERIC NOT NULL,
    course_code TEXT NOT NULL,
    notes_id UUID REFERENCES public.lecture_notes(id) ON DELETE SET NULL,
    flashcard_queue_count INT DEFAULT 0,
    exam_title TEXT,
    is_autofilled BOOLEAN NOT NULL DEFAULT false,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.9 Exam Deadlines Table (Upcoming Tests & Deficit Calculation Target Dates)
CREATE TABLE IF NOT EXISTS public.exam_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    course_code TEXT NOT NULL,
    exam_date TIMESTAMPTZ NOT NULL,
    prep_hours_needed NUMERIC NOT NULL DEFAULT 10,
    syllabus_readiness NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 2. PERFORMANCE INDEXES (RLS Evaluation & Foreign Key Joins)
-- =============================================================================

-- user_id B-Tree indexes for fast O(1)/O(log N) RLS policy checks
CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON public.lectures (user_id);
CREATE INDEX IF NOT EXISTS idx_lecture_transcripts_user_id ON public.lecture_transcripts (user_id);
CREATE INDEX IF NOT EXISTS idx_lecture_notes_user_id ON public.lecture_notes (user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards (user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON public.quiz_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_papers_user_id ON public.pyq_papers (user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_user_id ON public.pyq_questions (user_id);
CREATE INDEX IF NOT EXISTS idx_study_blocks_user_id ON public.study_blocks (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_deadlines_user_id ON public.exam_deadlines (user_id);

-- Foreign key indexes for relational performance
CREATE INDEX IF NOT EXISTS idx_lecture_transcripts_lecture_id ON public.lecture_transcripts (lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_notes_lecture_id ON public.lecture_notes (lecture_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_lecture_id ON public.flashcards (lecture_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lecture_id ON public.quizzes (lecture_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_lecture_id ON public.quiz_submissions (lecture_id);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_paper_id ON public.pyq_questions (paper_id);
CREATE INDEX IF NOT EXISTS idx_study_blocks_notes_id ON public.study_blocks (notes_id);

-- =============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- 3.1 Enable RLS on all tables
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyq_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_deadlines ENABLE ROW LEVEL SECURITY;

-- 3.2 Granular CRUD Policies for lectures
DROP POLICY IF EXISTS "lectures_select_user" ON public.lectures;
CREATE POLICY "lectures_select_user" ON public.lectures FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lectures_insert_user" ON public.lectures;
CREATE POLICY "lectures_insert_user" ON public.lectures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lectures_update_user" ON public.lectures;
CREATE POLICY "lectures_update_user" ON public.lectures FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lectures_delete_user" ON public.lectures;
CREATE POLICY "lectures_delete_user" ON public.lectures FOR DELETE
    USING (auth.uid() = user_id);

-- 3.3 Granular CRUD Policies for lecture_transcripts
DROP POLICY IF EXISTS "lecture_transcripts_select_user" ON public.lecture_transcripts;
CREATE POLICY "lecture_transcripts_select_user" ON public.lecture_transcripts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lecture_transcripts_insert_user" ON public.lecture_transcripts;
CREATE POLICY "lecture_transcripts_insert_user" ON public.lecture_transcripts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lecture_transcripts_update_user" ON public.lecture_transcripts;
CREATE POLICY "lecture_transcripts_update_user" ON public.lecture_transcripts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lecture_transcripts_delete_user" ON public.lecture_transcripts;
CREATE POLICY "lecture_transcripts_delete_user" ON public.lecture_transcripts FOR DELETE
    USING (auth.uid() = user_id);

-- 3.4 Granular CRUD Policies for lecture_notes
DROP POLICY IF EXISTS "lecture_notes_select_user" ON public.lecture_notes;
CREATE POLICY "lecture_notes_select_user" ON public.lecture_notes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lecture_notes_insert_user" ON public.lecture_notes;
CREATE POLICY "lecture_notes_insert_user" ON public.lecture_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lecture_notes_update_user" ON public.lecture_notes;
CREATE POLICY "lecture_notes_update_user" ON public.lecture_notes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lecture_notes_delete_user" ON public.lecture_notes;
CREATE POLICY "lecture_notes_delete_user" ON public.lecture_notes FOR DELETE
    USING (auth.uid() = user_id);

-- 3.5 Granular CRUD Policies for flashcards
DROP POLICY IF EXISTS "flashcards_select_user" ON public.flashcards;
CREATE POLICY "flashcards_select_user" ON public.flashcards FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "flashcards_insert_user" ON public.flashcards;
CREATE POLICY "flashcards_insert_user" ON public.flashcards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "flashcards_update_user" ON public.flashcards;
CREATE POLICY "flashcards_update_user" ON public.flashcards FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "flashcards_delete_user" ON public.flashcards;
CREATE POLICY "flashcards_delete_user" ON public.flashcards FOR DELETE
    USING (auth.uid() = user_id);

-- 3.5b Granular CRUD Policies for quizzes
DROP POLICY IF EXISTS "quizzes_select_user" ON public.quizzes;
CREATE POLICY "quizzes_select_user" ON public.quizzes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "quizzes_insert_user" ON public.quizzes;
CREATE POLICY "quizzes_insert_user" ON public.quizzes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quizzes_update_user" ON public.quizzes;
CREATE POLICY "quizzes_update_user" ON public.quizzes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quizzes_delete_user" ON public.quizzes;
CREATE POLICY "quizzes_delete_user" ON public.quizzes FOR DELETE
    USING (auth.uid() = user_id);

-- 3.6 Granular CRUD Policies for quiz_submissions
DROP POLICY IF EXISTS "quiz_submissions_select_user" ON public.quiz_submissions;
CREATE POLICY "quiz_submissions_select_user" ON public.quiz_submissions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_submissions_insert_user" ON public.quiz_submissions;
CREATE POLICY "quiz_submissions_insert_user" ON public.quiz_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_submissions_update_user" ON public.quiz_submissions;
CREATE POLICY "quiz_submissions_update_user" ON public.quiz_submissions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_submissions_delete_user" ON public.quiz_submissions;
CREATE POLICY "quiz_submissions_delete_user" ON public.quiz_submissions FOR DELETE
    USING (auth.uid() = user_id);

-- 3.7 Granular CRUD Policies for pyq_papers
DROP POLICY IF EXISTS "pyq_papers_select_user" ON public.pyq_papers;
CREATE POLICY "pyq_papers_select_user" ON public.pyq_papers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pyq_papers_insert_user" ON public.pyq_papers;
CREATE POLICY "pyq_papers_insert_user" ON public.pyq_papers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pyq_papers_update_user" ON public.pyq_papers;
CREATE POLICY "pyq_papers_update_user" ON public.pyq_papers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pyq_papers_delete_user" ON public.pyq_papers;
CREATE POLICY "pyq_papers_delete_user" ON public.pyq_papers FOR DELETE
    USING (auth.uid() = user_id);

-- 3.8 Granular CRUD Policies for pyq_questions
DROP POLICY IF EXISTS "pyq_questions_select_user" ON public.pyq_questions;
CREATE POLICY "pyq_questions_select_user" ON public.pyq_questions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pyq_questions_insert_user" ON public.pyq_questions;
CREATE POLICY "pyq_questions_insert_user" ON public.pyq_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pyq_questions_update_user" ON public.pyq_questions;
CREATE POLICY "pyq_questions_update_user" ON public.pyq_questions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "pyq_questions_delete_user" ON public.pyq_questions;
CREATE POLICY "pyq_questions_delete_user" ON public.pyq_questions FOR DELETE
    USING (auth.uid() = user_id);

-- 3.9 Granular CRUD Policies for study_blocks
DROP POLICY IF EXISTS "study_blocks_select_user" ON public.study_blocks;
CREATE POLICY "study_blocks_select_user" ON public.study_blocks FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_blocks_insert_user" ON public.study_blocks;
CREATE POLICY "study_blocks_insert_user" ON public.study_blocks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_blocks_update_user" ON public.study_blocks;
CREATE POLICY "study_blocks_update_user" ON public.study_blocks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "study_blocks_delete_user" ON public.study_blocks;
CREATE POLICY "study_blocks_delete_user" ON public.study_blocks FOR DELETE
    USING (auth.uid() = user_id);

-- 3.10 Granular CRUD Policies for exam_deadlines
DROP POLICY IF EXISTS "exam_deadlines_select_user" ON public.exam_deadlines;
CREATE POLICY "exam_deadlines_select_user" ON public.exam_deadlines FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "exam_deadlines_insert_user" ON public.exam_deadlines;
CREATE POLICY "exam_deadlines_insert_user" ON public.exam_deadlines FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "exam_deadlines_update_user" ON public.exam_deadlines;
CREATE POLICY "exam_deadlines_update_user" ON public.exam_deadlines FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "exam_deadlines_delete_user" ON public.exam_deadlines;
CREATE POLICY "exam_deadlines_delete_user" ON public.exam_deadlines FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================================
-- 4. SUPABASE STORAGE BUCKET & ROW LEVEL SECURITY
-- =============================================================================

-- Ensure private storage bucket exists for lecture media
INSERT INTO storage.buckets (id, name, public)
VALUES ('lecture_media', 'lecture_media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can only SELECT/read their own uploaded files (folder = auth.uid())
DROP POLICY IF EXISTS "lecture_media_select_user" ON storage.objects;
CREATE POLICY "lecture_media_select_user" ON storage.objects FOR SELECT
    USING (
        bucket_id = 'lecture_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage RLS: Users can only INSERT/upload to their own folder
DROP POLICY IF EXISTS "lecture_media_insert_user" ON storage.objects;
CREATE POLICY "lecture_media_insert_user" ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'lecture_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage RLS: Users can only UPDATE their own files
DROP POLICY IF EXISTS "lecture_media_update_user" ON storage.objects;
CREATE POLICY "lecture_media_update_user" ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'lecture_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'lecture_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage RLS: Users can only DELETE their own files
DROP POLICY IF EXISTS "lecture_media_delete_user" ON storage.objects;
CREATE POLICY "lecture_media_delete_user" ON storage.objects FOR DELETE
    USING (
        bucket_id = 'lecture_media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
