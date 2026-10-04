/**
 * Supabase Lectures Database Service
 * Provides typed CRUD operations for the signed-in user's lectures.
 * Direct PostgreSQL RLS guarantees users only access and create their own records.
 */

import { supabase } from './supabase';
export { isAuthError } from './supabase';

export class UnauthorizedError extends Error {
  constructor(message = 'User is not authenticated with Supabase') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Cross-tenant data access blocked') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Check if string conforms to standard UUID format
 */
export function isUuid(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Validates that an active user session exists in Supabase.
 * If expectedUserId is provided, ensures it matches the authenticated session's user ID.
 * Returns the verified user ID.
 */
export async function ensureAuthenticatedUser(expectedUserId?: string): Promise<string> {
  if (!supabase) {
    throw new UnauthorizedError('Supabase client is not configured');
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new UnauthorizedError(error?.message || 'Authentication required');
  }

  if (expectedUserId && expectedUserId !== user.id) {
    throw new ForbiddenError(`Mismatched user session. Expected: ${expectedUserId}, authenticated: ${user.id}`);
  }

  return user.id;
}
import type {
  Lecture,
  TranscriptSegment,
  StudyNotes,
  KeyConcept,
  NoteHighlight,
  FlashcardItem,
  FsrsRating,
  QuizAssessment,
  QuizSubmission,
  QuizResult,
  DbFlashcardRow,
  DbQuizSubmissionRow,
  PyqPaper,
  PyqQuestionItem,
  DbPyqPaperRow,
  DbPyqQuestionRow,
  StudyBlock,
  DbStudyBlockRow,
  ExamDeadline,
  DbExamDeadlineRow,
} from '../types/lecture';

import {
  fetchPersistedFlashcards,
  savePersistedFlashcards,
  updatePersistedCardMastery,
  fetchPersistedQuiz,
  savePersistedQuiz,
  fetchPersistedQuizResults,
  savePersistedQuizResult,
  fetchPersistedLectureNotes,
  saveLectureNotes,
  fetchPersistedLectureTranscript,
  savePersistedLectureTranscript,
  fetchPersistedLectureProgress,
  savePersistedLectureProgress,
} from './api';

export type {
  DbFlashcardRow,
  DbQuizSubmissionRow,
  DbPyqPaperRow,
  DbPyqQuestionRow,
  DbStudyBlockRow,
  DbExamDeadlineRow,
  ExamDeadline,
};

export interface DbLectureNotesRow {
  id: string;
  lecture_id: string;
  user_id: string;
  summary: string;
  markdown: string;
  key_concepts: any; // JSONB array of KeyConcept
  exam_relevance: string | null;
  margin_notes: string | null;
  highlights: any | null; // JSONB array of NoteHighlight
  created_at: string;
  updated_at: string;
}

export interface DbTranscriptRow {
  id: string;
  lecture_id: string;
  user_id: string;
  segment_index: number;
  speaker: string;
  start_seconds: number;
  end_seconds: number;
  text: string;
  created_at: string;
}

export interface DbLectureRow {
  id: string;
  user_id: string;
  title: string;
  course_code: string;
  course_name: string;
  source_type: 'audio' | 'pdf' | 'youtube' | 'transcript';
  status: 'synced' | 'processing' | 'ready';
  duration: string;
  duration_seconds: number;
  progress_seconds: number;
  has_audio: boolean;
  audio_url: string | null;
  pdf_url: string | null;
  source_file_name: string | null;
  word_count: number;
  page_count: number;
  summary: string;
  created_at: string;
  updated_at?: string;
  lecture_transcripts?: DbTranscriptRow[];
}

/**
 * Maps a Supabase PostgreSQL row (snake_case) to the frontend Lecture interface (camelCase).
 */
export function mapDbRowToLecture(
  row: DbLectureRow,
  fallbackTranscripts?: TranscriptSegment[]
): Lecture {
  let transcript: TranscriptSegment[] = [];

  if (row.lecture_transcripts && row.lecture_transcripts.length > 0) {
    transcript = [...row.lecture_transcripts]
      .sort((a, b) => (a.segment_index ?? a.start_seconds) - (b.segment_index ?? b.start_seconds))
      .map((t) => ({
        id: t.id,
        startSeconds: Number(t.start_seconds) || 0,
        endSeconds: Number(t.end_seconds) || 0,
        speaker: t.speaker || 'Speaker 1',
        text: t.text || '',
      }));
  } else if (fallbackTranscripts && fallbackTranscripts.length > 0) {
    transcript = fallbackTranscripts;
  }

  return {
    id: row.id,
    title: row.title,
    courseCode: row.course_code,
    courseName: row.course_name,
    date: new Date(row.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    duration: row.duration,
    durationSeconds: Number(row.duration_seconds) || 0,
    progressSeconds: Number(row.progress_seconds) || 0,
    summary: row.summary || '',
    concepts: [],
    transcript,
    flashcards: [],
    status: row.status,
    hasAudio: row.has_audio,
    sourceType: row.source_type,
    pageCount: row.page_count ?? 0,
    wordCount: row.word_count ?? 0,
    audioUrl: row.audio_url || undefined,
    pdfUrl: row.pdf_url || undefined,
  };
}

/**
 * Fetch all lectures owned by the currently authenticated user, including their transcript segments.
 * Protected by Row Level Security (RLS) on PostgreSQL and defense-in-depth client user scoping.
 */
export async function fetchUserLectures(userId?: string): Promise<Lecture[]> {
  if (!supabase) return [];

  let targetUserId = userId;
  if (!targetUserId) {
    try {
      targetUserId = await ensureAuthenticatedUser();
    } catch {
      return [];
    }
  }

  const { data, error } = await supabase
    .from('lectures')
    .select('*, lecture_transcripts(id, lecture_id, user_id, segment_index, speaker, start_seconds, end_seconds, text, created_at)')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch lectures from Supabase:', error.message);
    throw error;
  }

  return (data || []).map((row: DbLectureRow) => mapDbRowToLecture(row));
}

/**
 * Fetch transcript segments for a specific lecture ID across Supabase, backend SQLite, and localStorage.
 */
export async function fetchLectureTranscript(lectureId: string, userId?: string): Promise<TranscriptSegment[]> {
  if (!lectureId) return [];

  // 1. Supabase PostgreSQL
  if (supabase) {
    try {
      let query = supabase
        .from('lecture_transcripts')
        .select('id, lecture_id, user_id, segment_index, speaker, start_seconds, end_seconds, text, created_at')
        .eq('lecture_id', lectureId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('segment_index', { ascending: true });

      if (!error && data && data.length > 0) {
        const segments = data.map((t: DbTranscriptRow) => ({
          id: t.id,
          startSeconds: Number(t.start_seconds) || 0,
          endSeconds: Number(t.end_seconds) || 0,
          speaker: t.speaker || 'Speaker 1',
          text: t.text || '',
        }));
        try {
          localStorage.setItem(`lecturelens_transcript_${lectureId}`, JSON.stringify(segments));
        } catch {}
        return segments;
      }
    } catch (err: any) {
      console.warn('Failed to fetch lecture transcripts from Supabase:', err?.message);
    }
  }

  // 2. Backend SQLite storage
  try {
    const backendSegments = await fetchPersistedLectureTranscript(lectureId);
    if (backendSegments && backendSegments.length > 0) {
      try {
        localStorage.setItem(`lecturelens_transcript_${lectureId}`, JSON.stringify(backendSegments));
      } catch {}
      return backendSegments;
    }
  } catch (err: any) {
    console.warn('Failed to fetch lecture transcripts from backend SQLite:', err?.message);
  }

  // 3. LocalStorage cache fallback
  try {
    const cached = localStorage.getItem(`lecturelens_transcript_${lectureId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // 4. Find in cached lectures array
  try {
    const rawLectures = localStorage.getItem('lecturelens_lectures');
    if (rawLectures) {
      const parsed = JSON.parse(rawLectures);
      if (Array.isArray(parsed)) {
        const match = parsed.find((l: any) => l.id === lectureId);
        if (match && Array.isArray(match.transcript) && match.transcript.length > 0) {
          return match.transcript;
        }
      }
    }
  } catch {}

  return [];
}

/**
 * Insert a new lecture into Supabase for the current user, along with its transcript segments.
 */
export async function createUserLecture(
  lecture: Partial<Lecture>,
  userId: string
): Promise<Lecture> {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const verifiedUserId = await ensureAuthenticatedUser(userId);

  const payload = {
    user_id: verifiedUserId,
    title: lecture.title || 'Untitled Lecture',
    course_code: lecture.courseCode || 'ALL',
    course_name: lecture.courseName || 'General Academic Subject',
    source_type: (lecture.sourceType as DbLectureRow['source_type']) || 'transcript',
    status: (lecture.status as DbLectureRow['status']) || 'ready',
    duration: lecture.duration || '00:00',
    duration_seconds: lecture.durationSeconds || 0,
    progress_seconds: lecture.progressSeconds || 0,
    has_audio: lecture.hasAudio ?? false,
    audio_url: lecture.audioUrl || null,
    pdf_url: lecture.pdfUrl || null,
    source_file_name: lecture.filename || null,
    word_count: lecture.wordCount || 0,
    page_count: lecture.pageCount || 0,
    summary: lecture.summary || '',
  };

  const { data, error } = await supabase
    .from('lectures')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Failed to create lecture in Supabase:', error.message);
    throw error;
  }

  const createdLectureRow = data as DbLectureRow;
  let savedTranscripts: TranscriptSegment[] = [];

  // Persist transcript segments to lecture_transcripts table if present (YouTube, audio, or manual notes)
  if (lecture.transcript && lecture.transcript.length > 0) {
    const transcriptPayload = lecture.transcript.map((seg, idx) => ({
      lecture_id: createdLectureRow.id,
      user_id: verifiedUserId,
      segment_index: idx,
      speaker: seg.speaker || 'Speaker',
      start_seconds: Number(seg.startSeconds) || 0,
      end_seconds: Number(seg.endSeconds) || 0,
      text: seg.text || '',
    }));

    const { data: insertedSegments, error: transcriptError } = await supabase
      .from('lecture_transcripts')
      .insert(transcriptPayload)
      .select();

    if (transcriptError) {
      console.error('Failed to insert transcript segments to Supabase:', transcriptError.message);
      // Keep in-memory transcript so user does not lose data during current session
      savedTranscripts = lecture.transcript;
    } else if (insertedSegments && insertedSegments.length > 0) {
      savedTranscripts = (insertedSegments as DbTranscriptRow[])
        .sort((a, b) => a.segment_index - b.segment_index)
        .map((t) => ({
          id: t.id,
          startSeconds: Number(t.start_seconds) || 0,
          endSeconds: Number(t.end_seconds) || 0,
          speaker: t.speaker || 'Speaker',
          text: t.text || '',
        }));
    }

    // Also persist transcripts to backend SQLite for resilient local storage
    savePersistedLectureTranscript(createdLectureRow.id, lecture.transcript, lecture.fullText).catch((err) => {
      console.warn('Failed to save transcript to backend SQLite:', err);
    });
  }

  // Auto-initialize structured slide notes in lecture_notes for PDF decks (INGEST-06)
  if (lecture.sourceType === 'pdf' || lecture.notesMarkdown) {
    const initialMarkdown = lecture.notesMarkdown || (
      `# ${createdLectureRow.title}\n\n` +
      `**Source:** PDF Slide Deck (${createdLectureRow.page_count || 1} Slides)\n\n` +
      (lecture.summary ? `> ${lecture.summary}\n\n` : '') +
      (lecture.transcript && lecture.transcript.length > 0
        ? lecture.transcript.map((t) => `### ${t.speaker}\n${t.text}`).join('\n\n')
        : 'Extracted lecture slides ready for synthesis.')
    );

    const notesPayload = {
      lecture_id: createdLectureRow.id,
      user_id: verifiedUserId,
      summary: lecture.summary || `Extracted ${createdLectureRow.page_count || 1} slides from ${createdLectureRow.source_file_name || 'PDF document'}.`,
      markdown: initialMarkdown,
      key_concepts: lecture.concepts || [],
      exam_relevance: null,
      margin_notes: '',
      highlights: [],
      updated_at: new Date().toISOString(),
    };

    const { error: notesError } = await supabase
      .from('lecture_notes')
      .upsert(notesPayload, { onConflict: 'lecture_id' });

    if (notesError) {
      console.warn('Could not auto-create lecture_notes row for PDF:', notesError.message);
    }
  }

  return mapDbRowToLecture(createdLectureRow, savedTranscripts);
}

/**
 * Delete a lecture from Supabase with cascading deletion of child records.
 */
export async function deleteLectureFromDb(
  lectureId: string,
  userId?: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('id', lectureId)
      .eq('user_id', verifiedUserId);

    if (error) {
      console.warn('Failed to delete lecture from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Error deleting lecture from Supabase:', err?.message);
    return false;
  }
}


/**
 * Maps a Supabase PostgreSQL lecture_notes row to the frontend StudyNotes interface.
 */
export function mapDbRowToStudyNotes(row: DbLectureNotesRow): StudyNotes {
  let keyConcepts: KeyConcept[] = [];
  if (Array.isArray(row.key_concepts)) {
    keyConcepts = row.key_concepts;
  } else if (typeof row.key_concepts === 'string') {
    try {
      keyConcepts = JSON.parse(row.key_concepts);
    } catch {
      keyConcepts = [];
    }
  }

  let highlights: NoteHighlight[] = [];
  if (Array.isArray(row.highlights)) {
    highlights = row.highlights;
  } else if (typeof row.highlights === 'string') {
    try {
      highlights = JSON.parse(row.highlights);
    } catch {
      highlights = [];
    }
  }

  return {
    id: row.id,
    lectureId: row.lecture_id,
    userId: row.user_id,
    summary: row.summary || '',
    markdown: row.markdown || '',
    keyConcepts,
    examRelevance: row.exam_relevance || undefined,
    marginNotes: row.margin_notes || '',
    highlights,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSimulated: false,
  };
}

/**
 * Fetch saved notes for a specific lecture ID across Supabase, backend SQLite, and localStorage.
 * Returns null only if no notes exist anywhere.
 */
export async function fetchLectureNotes(lectureId: string, userId?: string): Promise<StudyNotes | null> {
  if (!lectureId) return null;

  // 1. Supabase PostgreSQL (if configured, authenticated, and valid UUID)
  if (supabase && isUuid(lectureId)) {
    try {
      let query = supabase
        .from('lecture_notes')
        .select('*')
        .eq('lecture_id', lectureId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        const mapped = mapDbRowToStudyNotes(data as DbLectureNotesRow);
        try {
          localStorage.setItem(`lecturelens_notes_${lectureId}`, JSON.stringify(mapped));
        } catch {}
        return mapped;
      }
    } catch (err: any) {
      console.warn('Error reading lecture notes from Supabase:', err?.message);
    }
  }

  // 2. Backend SQLite persistent storage
  try {
    const sqliteNotes = await fetchPersistedLectureNotes(lectureId);
    if (sqliteNotes && (sqliteNotes.summary || sqliteNotes.markdown || (sqliteNotes.keyConcepts && sqliteNotes.keyConcepts.length > 0))) {
      try {
        localStorage.setItem(`lecturelens_notes_${lectureId}`, JSON.stringify(sqliteNotes));
      } catch {}
      return sqliteNotes;
    }
  } catch (err: any) {
    console.warn('Error reading lecture notes from backend SQLite:', err?.message);
  }

  // 3. LocalStorage cache fallback
  try {
    const cached = localStorage.getItem(`lecturelens_notes_${lectureId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.summary || parsed.markdown || (parsed.keyConcepts && parsed.keyConcepts.length > 0))) {
        return parsed as StudyNotes;
      }
    }
  } catch (err: any) {
    console.warn('Error reading cached notes from localStorage:', err?.message);
  }

  return null;
}

/**
 * Persist student notes, markdown edits, key concepts, margin notes, and highlights across
 * LocalStorage, backend SQLite, and Supabase PostgreSQL.
 */
export async function saveLectureNotesToDb(
  lectureId: string,
  notes: StudyNotes,
  userId?: string,
  marginNotes?: string,
  highlights?: NoteHighlight[]
): Promise<StudyNotes | null> {
  if (!lectureId || !notes) return null;

  const effectiveMargin = marginNotes !== undefined ? marginNotes : (notes.marginNotes || '');
  const effectiveHighlights = highlights || notes.highlights || [];
  const fullNotes: StudyNotes = {
    ...notes,
    lectureId,
    marginNotes: effectiveMargin,
    highlights: effectiveHighlights,
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediate LocalStorage caching (instant offline guarantee)
  try {
    localStorage.setItem(`lecturelens_notes_${lectureId}`, JSON.stringify(fullNotes));
  } catch (e) {
    console.warn('Could not cache notes to localStorage:', e);
  }

  // Also update lecture in lecturelens_lectures array if cached
  try {
    const rawLectures = localStorage.getItem('lecturelens_lectures');
    if (rawLectures) {
      const parsed = JSON.parse(rawLectures);
      if (Array.isArray(parsed)) {
        const idx = parsed.findIndex((l: any) => l.id === lectureId);
        if (idx !== -1) {
          parsed[idx].notes = fullNotes;
          localStorage.setItem('lecturelens_lectures', JSON.stringify(parsed));
        }
      }
    }
  } catch {}

  // 2. Durable Backend SQLite persistence
  try {
    await saveLectureNotes(lectureId, fullNotes, effectiveMargin, effectiveHighlights);
  } catch (err) {
    console.warn('Could not save notes to backend SQLite:', err);
  }

  // 3. Supabase PostgreSQL update/insert if authenticated & valid UUID
  if (supabase && userId && isUuid(lectureId)) {
    try {
      const verifiedUserId = await ensureAuthenticatedUser(userId);
      const payload = {
        lecture_id: lectureId,
        user_id: verifiedUserId,
        summary: notes.summary || '',
        markdown: notes.markdown || '',
        key_concepts: notes.keyConcepts || [],
        exam_relevance: notes.examRelevance || null,
        margin_notes: effectiveMargin,
        highlights: effectiveHighlights,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('lecture_notes')
        .select('id')
        .eq('lecture_id', lectureId)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('lecture_notes')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();

        if (!error && data) {
          return mapDbRowToStudyNotes(data as DbLectureNotesRow);
        }
      } else {
        const { data, error } = await supabase
          .from('lecture_notes')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          return mapDbRowToStudyNotes(data as DbLectureNotesRow);
        }
      }
    } catch (err: any) {
      console.warn('Error saving notes to Supabase:', err?.message);
    }
  }

  return fullNotes;
}


/**
 * Update and persist audio playback progress for a lecture.
 */
export async function updateLectureProgress(
  lectureId: string,
  progressSeconds: number,
  userId?: string,
  completed?: boolean
): Promise<void> {
  if (!lectureId) return;

  const validSecs = Math.max(0, Math.round(progressSeconds));

  // 1. Immediate localStorage caching
  try {
    localStorage.setItem(`lecturelens_progress_${lectureId}`, String(validSecs));
  } catch {}

  // Also update lecture in lecturelens_lectures array if cached
  try {
    const rawLectures = localStorage.getItem('lecturelens_lectures');
    if (rawLectures) {
      const parsed = JSON.parse(rawLectures);
      if (Array.isArray(parsed)) {
        const idx = parsed.findIndex((l: any) => l.id === lectureId);
        if (idx !== -1) {
          parsed[idx].progressSeconds = validSecs;
          localStorage.setItem('lecturelens_lectures', JSON.stringify(parsed));
        }
      }
    }
  } catch {}

  // 2. Backend SQLite persistence
  savePersistedLectureProgress(lectureId, validSecs, completed).catch((err) => {
    console.warn('Failed to save lecture progress to backend SQLite:', err);
  });

  // 3. Supabase update if authenticated
  if (supabase && userId) {
    try {
      await supabase
        .from('lectures')
        .update({
          progress_seconds: validSecs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lectureId);
    } catch (err: any) {
      console.warn('Failed to update progress in Supabase:', err?.message);
    }
  }
}

/**
 * Fetch persisted audio playback progress for a lecture.
 */
export async function fetchLectureProgress(
  lectureId: string,
  userId?: string
): Promise<number> {
  if (!lectureId) return 0;

  // 1. Check localStorage first for instant restore
  try {
    const cached = localStorage.getItem(`lecturelens_progress_${lectureId}`);
    if (cached !== null) {
      const parsed = Number(cached);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {}

  // 2. Check backend SQLite
  try {
    const backendProg = await fetchPersistedLectureProgress(lectureId);
    if (backendProg && typeof backendProg.progressSeconds === 'number') {
      try {
        localStorage.setItem(`lecturelens_progress_${lectureId}`, String(backendProg.progressSeconds));
      } catch {}
      return backendProg.progressSeconds;
    }
  } catch {}

  // 3. Check Supabase
  if (supabase) {
    try {
      let query = supabase
        .from('lectures')
        .select('progress_seconds')
        .eq('id', lectureId);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data } = await query.maybeSingle();
      if (data && typeof data.progress_seconds === 'number') {
        try {
          localStorage.setItem(`lecturelens_progress_${lectureId}`, String(data.progress_seconds));
        } catch {}
        return Number(data.progress_seconds);
      }
    } catch {}
  }

  return 0;
}

/**
 * Maps a Supabase flashcard row to frontend FlashcardItem
 */
export function mapDbRowToFlashcard(row: any): FlashcardItem {
  let parsedBack: Record<string, any> = {};
  if (row.back && typeof row.back === 'string') {
    try {
      if (row.back.startsWith('{') || row.back.startsWith('[')) {
        parsedBack = JSON.parse(row.back);
      }
    } catch {
      parsedBack = {};
    }
  }

  let rating: FsrsRating = 'good';
  if (parsedBack.rating) {
    rating = parsedBack.rating as FsrsRating;
  } else if (row.difficulty !== null && row.difficulty !== undefined) {
    if (typeof row.difficulty === 'string') {
      rating = row.difficulty as FsrsRating;
    } else if (row.difficulty <= 0.2) rating = 'easy';
    else if (row.difficulty <= 0.5) rating = 'good';
    else if (row.difficulty <= 0.8) rating = 'hard';
    else rating = 'again';
  }

  const isReviewed = Boolean(
    row.reviewed ||
    parsedBack.reviewed ||
    row.lastReviewed ||
    parsedBack.lastReviewed ||
    (row.reps && row.reps > 0) ||
    (parsedBack.reps && parsedBack.reps > 0)
  );

  return {
    id: row.id,
    lectureId: row.lecture_id || row.lectureId,
    source: parsedBack.source || row.source || 'Lecture Material',
    subtopic: parsedBack.subtopic || row.subtopic || 'Key Mechanism',
    question: row.front || row.question || '',
    answerLead: parsedBack.lead || row.answerLead || row.back || '',
    answerBody: parsedBack.body || row.answerBody || '',
    step1: parsedBack.step1 || row.step1,
    step2: parsedBack.step2 || row.step2,
    conceptNote: parsedBack.note || row.conceptNote,
    recallAccuracy: `${Math.round((1 - (row.difficulty ?? 0.3)) * 100)}%`,
    difficulty: rating,
    intervalDisplay: row.intervalDisplay || (row.stability ? `${Number(row.stability).toFixed(1)}d` : '1.0d'),
    mastered: !!row.mastered,
    stability: row.stability ? Number(row.stability) : undefined,
    reviewed: isReviewed,
    rating: isReviewed ? rating : undefined,
    lastReviewed: row.lastReviewed || parsedBack.lastReviewed || row.updated_at,
    reps: row.reps || parsedBack.reps || (isReviewed ? 1 : 0),
  };
}

/**
 * Fetch flashcards for a specific lecture ID from Supabase PostgreSQL.
 */
/**
 * Fetch flashcards for a specific lecture ID from Supabase PostgreSQL,
 * falling back seamlessly to backend SQLite persistent storage and local cache.
 */
export async function fetchLectureFlashcards(lectureId: string, userId?: string): Promise<FlashcardItem[]> {
  // 1. Try Supabase PostgreSQL if configured
  if (supabase) {
    try {
      let query = supabase
        .from('flashcards')
        .select('*')
        .eq('lecture_id', lectureId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbRowToFlashcard);
        try {
          localStorage.setItem(`lecturelens_flashcards_${lectureId}`, JSON.stringify(mapped));
        } catch {}
        return mapped;
      }
    } catch (err: any) {
      console.warn('Supabase fetchLectureFlashcards error (falling back):', err?.message);
    }
  }

  // 2. Fall back to backend SQLite persistent storage
  try {
    const backendCards = await fetchPersistedFlashcards(lectureId);
    if (backendCards && backendCards.length > 0) {
      try {
        localStorage.setItem(`lecturelens_flashcards_${lectureId}`, JSON.stringify(backendCards));
      } catch {}
      return backendCards;
    }
  } catch (err: any) {
    console.warn('Backend fetchPersistedFlashcards error:', err?.message);
  }

  // 3. Fall back to localStorage persistent cache
  try {
    const cached = localStorage.getItem(`lecturelens_flashcards_${lectureId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return [];
}

/**
 * Fetch all flashcards for the user across all lectures from Supabase PostgreSQL.
 */
export async function fetchAllFlashcards(userId?: string): Promise<FlashcardItem[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('flashcards')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      try {
        const verifiedUserId = await ensureAuthenticatedUser();
        query = query.eq('user_id', verifiedUserId);
      } catch {
        // Unauthenticated guest session
      }
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Failed to fetch all flashcards from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapDbRowToFlashcard);
  } catch (err: any) {
    console.warn('Error reading all flashcards:', err?.message);
    return [];
  }
}

/**
 * Persist generated or updated flashcards to Backend SQLite storage,
 * localStorage persistent cache, and Supabase PostgreSQL.
 */
export async function saveLectureFlashcardsToDb(
  lectureId: string,
  cards: FlashcardItem[],
  userId?: string
): Promise<FlashcardItem[]> {
  if (!cards || !cards.length) return cards;

  // 1. Save to backend SQLite persistent storage (durable across reboots & refreshes)
  let persistedCards = cards;
  try {
    persistedCards = await savePersistedFlashcards(lectureId, cards);
  } catch (err: any) {
    console.warn('Backend savePersistedFlashcards error:', err?.message);
  }

  // 2. Save to localStorage persistent cache
  try {
    localStorage.setItem(`lecturelens_flashcards_${lectureId}`, JSON.stringify(persistedCards));
  } catch {}

  // 3. Persist to Supabase if configured and user is signed in
  if (supabase && userId) {
    try {
      const verifiedUserId = await ensureAuthenticatedUser(userId);

      const payload = cards.map((c) => {
        const backPayload = JSON.stringify({
          lead: c.answerLead,
          body: c.answerBody,
          step1: c.step1,
          step2: c.step2,
          note: c.conceptNote,
          source: c.source,
          subtopic: c.subtopic,
        });

        const row: Record<string, any> = {
          lecture_id: lectureId,
          user_id: verifiedUserId,
          front: c.question,
          back: backPayload,
          mastered: !!c.mastered,
          difficulty: c.difficulty === 'easy' ? 0.1 : c.difficulty === 'good' ? 0.3 : c.difficulty === 'hard' ? 0.7 : 0.9,
          stability: c.stability ?? 1.0,
          updated_at: new Date().toISOString(),
        };

        if (isUuid(c.id)) {
          row.id = c.id;
        }

        return row;
      });

      const { data, error } = await supabase
        .from('flashcards')
        .upsert(payload)
        .select();

      if (!error && data && data.length > 0) {
        return (data || []).map(mapDbRowToFlashcard);
      }
    } catch (err: any) {
      console.warn('Supabase saveLectureFlashcards warning:', err?.message);
    }
  }

  return persistedCards;
}

/**
 * Update mastery status and spaced repetition difficulty rating for a single card.
 * Persists to backend SQLite storage, localStorage cache, and Supabase.
 */
export async function updateFlashcardMastery(
  cardId: string,
  rating: FsrsRating,
  userId?: string,
  lectureId?: string
): Promise<boolean> {
  const isMastered = rating === 'easy' || rating === 'good';
  const difficulty = rating === 'easy' ? 0.1 : rating === 'good' ? 0.3 : rating === 'hard' ? 0.7 : 0.9;
  const stability = rating === 'easy' ? 3.0 : rating === 'good' ? 1.5 : 0.5;
  const nowIso = new Date().toISOString();

  let success = false;

  // 1. Update in backend SQLite storage if lectureId provided
  if (lectureId) {
    try {
      await updatePersistedCardMastery(lectureId, cardId, rating, {
        mastered: isMastered,
        difficulty,
        stability,
        lastReviewed: nowIso,
        reviewed: true,
      });
      success = true;

      // Update localStorage cache as well
      const cached = localStorage.getItem(`lecturelens_flashcards_${lectureId}`);
      if (cached) {
        const parsed: FlashcardItem[] = JSON.parse(cached);
        const updated = parsed.map((c) => {
          if (c.id === cardId) {
            return {
              ...c,
              reviewed: true,
              rating,
              mastered: isMastered,
              difficulty: rating,
              stability,
              intervalDisplay: `${stability.toFixed(1)}d`,
              lastReviewed: nowIso,
              reps: (c.reps || 0) + 1,
            };
          }
          return c;
        });
        localStorage.setItem(`lecturelens_flashcards_${lectureId}`, JSON.stringify(updated));
      }
    } catch (err: any) {
      console.warn('Failed to update card mastery in backend:', err?.message);
    }
  }

  // 2. Update in Supabase if configured and user is signed in
  if (supabase && userId) {
    try {
      const verifiedUserId = await ensureAuthenticatedUser(userId);

      const { error } = await supabase
        .from('flashcards')
        .update({
          mastered: isMastered,
          difficulty,
          stability,
          updated_at: nowIso,
        })
        .eq('id', cardId)
        .eq('user_id', verifiedUserId);

      if (!error) {
        success = true;
      }
    } catch (err: any) {
      console.warn('Supabase updateFlashcardMastery warning:', err?.message);
    }
  }

  return success;
}

/**
 * Fetch persisted active quiz for a lecture from Supabase, backend SQLite storage, or local cache.
 */
export async function fetchLectureQuiz(
  lectureId: string,
  userId?: string
): Promise<QuizAssessment | null> {
  // 1. Try Supabase PostgreSQL if configured
  if (supabase) {
    try {
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('lecture_id', lectureId);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        const questions = typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions;
        if (Array.isArray(questions) && questions.length > 0) {
          const quiz: QuizAssessment = {
            id: data.quiz_id || data.id,
            lectureId: data.lecture_id,
            title: data.title || 'Exam Drill',
            courseCode: data.course_code || 'ALL',
            timeLimitMinutes: data.time_limit_minutes || 25,
            questions,
          };
          try {
            localStorage.setItem(`lecturelens_quiz_${lectureId}`, JSON.stringify(quiz));
          } catch {}
          return quiz;
        }
      }
    } catch (err: any) {
      console.warn('Supabase fetchLectureQuiz error (falling back):', err?.message);
    }
  }

  // 2. Try backend SQLite persistent storage
  try {
    const backendQuiz = await fetchPersistedQuiz(lectureId);
    if (backendQuiz && Array.isArray(backendQuiz.questions) && backendQuiz.questions.length > 0) {
      try {
        localStorage.setItem(`lecturelens_quiz_${lectureId}`, JSON.stringify(backendQuiz));
      } catch {}
      return backendQuiz;
    }
  } catch (err: any) {
    console.warn('Backend fetchPersistedQuiz error:', err?.message);
  }

  // 3. Fall back to localStorage cache
  try {
    const cached = localStorage.getItem(`lecturelens_quiz_${lectureId}`);
    if (cached) {
      const parsed: QuizAssessment = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return null;
}

/**
 * Persist generated quiz to backend SQLite storage, localStorage cache, and Supabase PostgreSQL.
 * Strictly preserves randomized option order and correctIndex.
 */
export async function saveLectureQuizToDb(
  lectureId: string,
  quiz: QuizAssessment,
  userId?: string
): Promise<QuizAssessment> {
  if (!quiz || !Array.isArray(quiz.questions) || !quiz.questions.length) return quiz;

  // 1. Save to backend SQLite persistent storage (durable across reboots & refreshes)
  let savedQuiz = quiz;
  try {
    savedQuiz = await savePersistedQuiz(lectureId, quiz);
  } catch (err: any) {
    console.warn('Backend savePersistedQuiz error:', err?.message);
  }

  // 2. Save to localStorage persistent cache
  try {
    localStorage.setItem(`lecturelens_quiz_${lectureId}`, JSON.stringify(savedQuiz));
  } catch {}

  // 3. Persist to Supabase if configured and user is signed in
  if (supabase && userId) {
    try {
      const verifiedUserId = await ensureAuthenticatedUser(userId);
      const payload: Record<string, any> = {
        lecture_id: lectureId,
        user_id: verifiedUserId,
        quiz_id: quiz.id || `quiz-${lectureId}`,
        title: quiz.title || 'Exam Drill',
        course_code: quiz.courseCode || 'ALL',
        time_limit_minutes: quiz.timeLimitMinutes || 25,
        questions: quiz.questions,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('quizzes').upsert(payload, { onConflict: 'lecture_id' });
    } catch (err: any) {
      console.warn('Supabase saveLectureQuiz warning:', err?.message);
    }
  }

  return savedQuiz;
}

/**
 * Save quiz submission results and telemetry to backend SQLite storage, localStorage, and Supabase.
 */
export async function saveQuizSubmissionToDb(
  submission: QuizSubmission,
  result: QuizResult,
  userId?: string,
  lectureId?: string
): Promise<DbQuizSubmissionRow | null> {
  const targetLecId = lectureId || submission.quizId;

  // 1. Save to backend SQLite persistent storage
  try {
    await savePersistedQuizResult(targetLecId, result);
  } catch (err: any) {
    console.warn('Backend savePersistedQuizResult error:', err?.message);
  }

  // 2. Save to localStorage persistent cache
  try {
    localStorage.setItem(`lecturelens_quiz_result_${targetLecId}`, JSON.stringify(result));
  } catch {}

  // 3. Save to Supabase if configured and user is signed in
  if (supabase && userId) {
    try {
      const verifiedUserId = await ensureAuthenticatedUser(userId);

      const payload = {
        lecture_id: targetLecId,
        user_id: verifiedUserId,
        quiz_id: submission.quizId,
        score: result.score,
        total_questions: result.totalQuestions,
        answers: result.answers || submission.answers,
        time_spent_seconds: submission.timeSpentSeconds || 0,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('quiz_submissions')
        .insert(payload)
        .select()
        .maybeSingle();

      if (!error && data) {
        return data as DbQuizSubmissionRow;
      }
    } catch (err: any) {
      console.warn('Supabase saveQuizSubmission warning:', err?.message);
    }
  }

  return null;
}

/**
 * Fetch latest completed quiz submission result for a lecture.
 */
export async function fetchQuizSubmissionFromDb(
  lectureId: string,
  userId?: string
): Promise<QuizResult | null> {
  // 1. Try authenticated Supabase persistent storage if configured
  if (supabase) {
    try {
      let query = supabase
        .from('quiz_submissions')
        .select('*')
        .eq('lecture_id', lectureId)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.limit(1).maybeSingle();
      if (!error && data) {
        const total = data.total_questions || 5;
        const score = data.score || 0;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        const answersRaw = typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers;
        const result: QuizResult = {
          quizId: data.quiz_id || `quiz-${lectureId}`,
          score,
          totalQuestions: total,
          percentage,
          answers: answersRaw || {},
          completedAt: data.created_at || new Date().toISOString(),
          lectureId,
        };
        try {
          localStorage.setItem(`lecturelens_quiz_result_${lectureId}`, JSON.stringify(result));
        } catch {}
        return result;
      }
    } catch (err: any) {
      console.warn('Supabase fetchQuizSubmission warning:', err?.message);
    }
  }

  // 2. Try backend SQLite persistent storage
  try {
    const results = await fetchPersistedQuizResults(lectureId);
    if (results && results.length > 0) {
      try {
        localStorage.setItem(`lecturelens_quiz_result_${lectureId}`, JSON.stringify(results[0]));
      } catch {}
      return results[0];
    }
  } catch (err: any) {
    console.warn('Backend fetchPersistedQuizResults error:', err?.message);
  }

  // 3. Try localStorage cache fallback
  try {
    const cached = localStorage.getItem(`lecturelens_quiz_result_${lectureId}`);
    if (cached) {
      return JSON.parse(cached) as QuizResult;
    }
  } catch {}

  return null;
}

/**
 * Fetch past quiz submissions and benchmark history from Supabase.
 */
export async function fetchQuizHistory(lectureId?: string, userId?: string): Promise<DbQuizSubmissionRow[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('quiz_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (lectureId) {
      query = query.eq('lecture_id', lectureId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Failed to fetch quiz history from Supabase:', error.message);
      return [];
    }

    return (data || []) as DbQuizSubmissionRow[];
  } catch (err: any) {
    console.warn('Error reading quiz history:', err?.message);
    return [];
  }
}

/**
 * Map Supabase database row to frontend PyqQuestionItem
 */
export function mapDbRowToPyqQuestion(row: any): PyqQuestionItem {
  let rubric = row.rubric_criteria;
  if (typeof rubric === 'string') {
    try { rubric = JSON.parse(rubric); } catch { rubric = []; }
  }
  if (!Array.isArray(rubric)) rubric = [];

  let pitfall = row.common_pitfall;
  if (typeof pitfall === 'string') {
    try { pitfall = JSON.parse(pitfall); } catch { pitfall = {}; }
  }
  if (!pitfall || typeof pitfall !== 'object') {
    pitfall = { title: 'Common Misconception', description: 'Theoretical pitfall details.', markLossPercent: 30 };
  }

  let correlated = row.correlated_lecture;
  if (typeof correlated === 'string') {
    try { correlated = JSON.parse(correlated); } catch { correlated = null; }
  }
  if (!correlated || typeof correlated !== 'object') {
    correlated = {
      title: 'Correlated Lecture Concept',
      lectureId: 'lec-1',
      timecodeDisplay: '[05:00 - 10:00]',
      seekSeconds: 300,
    };
  }

  let recurrence = row.recurrence_years;
  if (typeof recurrence === 'string') {
    try { recurrence = JSON.parse(recurrence); } catch { recurrence = ['2024']; }
  }
  if (!Array.isArray(recurrence)) recurrence = ['2024'];

  return {
    id: row.id,
    paperId: row.paper_id,
    questionNumber: row.question_number || 'Question 1',
    marks: row.marks || 10,
    problemStatement: row.problem_statement || '',
    recurrenceYears: recurrence.map(String),
    midtermProbability: row.midterm_probability ?? 75,
    rubricCriteria: rubric,
    commonPitfall: pitfall,
    correlatedLecture: correlated,
  };
}

/**
 * Map Supabase database row to frontend PyqPaper
 */
export function mapDbRowToPyqPaper(row: any, questions: PyqQuestionItem[] = []): PyqPaper {
  return {
    id: row.id,
    title: row.title || 'Exam Paper',
    courseCode: row.course_code || 'ALL',
    instructor: row.instructor || 'Course Faculty',
    year: row.year || new Date(row.created_at || Date.now()).getFullYear(),
    term: row.term || 'Fall 2024',
    examType: (row.exam_type as any) || 'midterm',
    extractedCount: row.extracted_count || questions.length,
    shortAnsCount: row.short_ans_count || questions.filter((q) => q.marks <= 5).length,
    longAnsCount: row.long_ans_count || questions.filter((q) => q.marks > 5).length,
    historicalMean: row.historical_mean ?? 68.5,
    syllabusMatchPercent: row.syllabus_match_percent ?? 95.0,
    ocrFidelityPercent: row.ocr_fidelity_percent ?? 95.0,
    isPrimary: !!row.is_primary,
    userId: row.user_id,
    questions,
    createdAt: row.created_at,
  };
}

/**
 * Fetch PYQ papers for a user and optional course code from Supabase PostgreSQL.
 */
export async function fetchPyqPapers(userId?: string, courseCode?: string): Promise<PyqPaper[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('pyq_papers')
      .select('*')
      .order('created_at', { ascending: false });

    let activeUserId = userId;
    if (!activeUserId) {
      try {
        activeUserId = await ensureAuthenticatedUser();
      } catch {
        // Unauthenticated guest session
      }
    }

    if (activeUserId) {
      query = query.eq('user_id', activeUserId);
    }
    if (courseCode && courseCode !== 'ALL') {
      query = query.eq('course_code', courseCode);
    }

    const { data: papersData, error } = await query;
    if (error) {
      console.warn('Failed to fetch PYQ papers from Supabase:', error.message);
      return [];
    }

    if (!papersData || papersData.length === 0) return [];

    const papersWithQuestions = await Promise.all(
      papersData.map(async (p) => {
        const questions = await fetchPyqQuestions(p.id, activeUserId);
        return mapDbRowToPyqPaper(p, questions);
      })
    );

    return papersWithQuestions;
  } catch (err: any) {
    console.warn('Error reading PYQ papers from Supabase:', err?.message);
    return [];
  }
}

/**
 * Fetch questions for a specific PYQ paper from Supabase.
 */
export async function fetchPyqQuestions(paperId: string, userId?: string): Promise<PyqQuestionItem[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('pyq_questions')
      .select('*')
      .eq('paper_id', paperId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.warn('Failed to fetch PYQ questions from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapDbRowToPyqQuestion);
  } catch (err: any) {
    console.warn('Error reading PYQ questions from Supabase:', err?.message);
    return [];
  }
}

/**
 * Persist uploaded PYQ paper and its extracted questions to Supabase PostgreSQL.
 */
export async function savePyqPaperToDb(paper: PyqPaper, userId: string): Promise<PyqPaper> {
  if (!supabase) return paper;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);

    const payload: Record<string, any> = {
      user_id: verifiedUserId,
      title: paper.title,
      course_code: paper.courseCode || 'ALL',
      instructor: paper.instructor || 'Course Faculty',
      year: paper.year || 2024,
      term: paper.term || 'Fall 2024',
      exam_type: paper.examType || 'midterm',
      extracted_count: paper.extractedCount || (paper.questions?.length ?? 0),
      short_ans_count: paper.shortAnsCount || (paper.questions?.filter((q) => q.marks <= 5).length ?? 0),
      long_ans_count: paper.longAnsCount || (paper.questions?.filter((q) => q.marks > 5).length ?? 0),
      historical_mean: paper.historicalMean ?? 68.5,
      syllabus_match_percent: paper.syllabusMatchPercent ?? 95.0,
      ocr_fidelity_percent: paper.ocrFidelityPercent ?? 95.0,
      is_primary: paper.isPrimary ?? false,
      created_at: paper.createdAt || new Date().toISOString(),
    };

    if (isUuid(paper.id)) {
      payload.id = paper.id;
    }

    const { data, error } = await supabase
      .from('pyq_papers')
      .upsert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Failed to save PYQ paper to Supabase:', error.message);
      return paper;
    }

    const savedId = data?.id || paper.id;
    let savedQuestions = paper.questions || [];

    if (paper.questions && paper.questions.length > 0) {
      savedQuestions = await savePyqQuestionsToDb(savedId, paper.questions, verifiedUserId);
    }

    return mapDbRowToPyqPaper(data, savedQuestions);
  } catch (err: any) {
    console.warn('Error saving PYQ paper:', err?.message);
    return paper;
  }
}

/**
 * Batch persist extracted PYQ questions to Supabase.
 */
export async function savePyqQuestionsToDb(
  paperId: string,
  questions: PyqQuestionItem[],
  userId: string
): Promise<PyqQuestionItem[]> {
  if (!supabase || !questions.length) return questions;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);

    const payload = questions.map((q) => {
      const row: Record<string, any> = {
        paper_id: paperId,
        user_id: verifiedUserId,
        question_number: q.questionNumber,
        marks: q.marks,
        problem_statement: q.problemStatement,
        topic_tag: q.rubricCriteria?.[0]?.title || 'Core Syllabus Topic',
        recurrence_years: q.recurrenceYears,
        midterm_probability: q.midtermProbability,
        rubric_criteria: q.rubricCriteria,
        common_pitfall: q.commonPitfall,
        correlated_lecture: q.correlatedLecture,
        created_at: new Date().toISOString(),
      };
      if (isUuid(q.id)) {
        row.id = q.id;
      }
      return row;
    });

    const { data, error } = await supabase
      .from('pyq_questions')
      .upsert(payload)
      .select();

    if (error) {
      console.warn('Failed to save PYQ questions to Supabase:', error.message);
      return questions;
    }

    return (data || []).map(mapDbRowToPyqQuestion);
  } catch (err: any) {
    console.warn('Error saving PYQ questions:', err?.message);
    return questions;
  }
}

/**
 * Delete a PYQ paper and all associated questions from Supabase.
 */
export async function deletePyqPaperFromDb(paperId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);
    await supabase
      .from('pyq_questions')
      .delete()
      .eq('paper_id', paperId)
      .eq('user_id', verifiedUserId);

    const { error } = await supabase
      .from('pyq_papers')
      .delete()
      .eq('id', paperId)
      .eq('user_id', verifiedUserId);

    if (error) {
      console.warn('Failed to delete PYQ paper from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Error deleting PYQ paper:', err?.message);
    return false;
  }
}

// ==============================================================================
// Study Planner & Academic Calendar Supabase Operations
// ==============================================================================

/**
 * Map Supabase database row to client StudyBlock.
 */
export function mapDbRowToStudyBlock(row: any): StudyBlock {
  return {
    id: row.id,
    userId: row.user_id,
    dayIndex: typeof row.day_index === 'number' ? row.day_index : parseInt(row.day_index || '0', 10),
    dayLabel: row.day_label || 'Mon',
    title: row.title || 'Study Session',
    category: row.category || 'deep',
    timeDisplay: row.time_display || '10:00 - 11:30',
    startHour: typeof row.start_hour === 'number' ? row.start_hour : parseFloat(row.start_hour || '10.0'),
    durationHours: typeof row.duration_hours === 'number' ? row.duration_hours : parseFloat(row.duration_hours || '1.5'),
    courseCode: row.course_code || 'General',
    notesId: row.notes_id || undefined,
    flashcardQueueCount: row.flashcard_queue_count || undefined,
    examTitle: row.exam_title || undefined,
    isAutofilled: row.is_autofilled ?? false,
    isCompleted: row.is_completed ?? false,
  };
}

/**
 * Map client StudyBlock to database payload object.
 */
export function mapStudyBlockToDbPayload(block: StudyBlock, userId: string): Record<string, any> {
  const payload: Record<string, any> = {
    user_id: userId,
    day_index: block.dayIndex,
    day_label: block.dayLabel,
    title: block.title,
    category: block.category,
    time_display: block.timeDisplay,
    start_hour: block.startHour,
    duration_hours: block.durationHours,
    course_code: block.courseCode,
    notes_id: block.notesId || null,
    flashcard_queue_count: block.flashcardQueueCount || null,
    exam_title: block.examTitle || null,
    is_autofilled: block.isAutofilled ?? false,
    is_completed: block.isCompleted ?? false,
    created_at: new Date().toISOString(),
  };

  if (isUuid(block.id)) {
    payload.id = block.id;
  }

  return payload;
}

/**
 * Map Supabase database row to client ExamDeadline.
 */
export function mapDbRowToExamDeadline(row: any): ExamDeadline {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || 'Upcoming Exam',
    courseCode: row.course_code || 'ALL',
    examDate: row.exam_date || '',
    prepHoursNeeded: typeof row.prep_hours_needed === 'number' ? row.prep_hours_needed : parseFloat(row.prep_hours_needed || '14.0'),
    syllabusReadiness: typeof row.syllabus_readiness === 'number' ? row.syllabus_readiness : (row.syllabus_readiness ? parseFloat(row.syllabus_readiness) : undefined),
    createdAt: row.created_at,
  };
}

/**
 * Map client ExamDeadline to database payload object.
 */
export function mapExamDeadlineToDbPayload(deadline: ExamDeadline, userId: string): Record<string, any> {
  const payload: Record<string, any> = {
    user_id: userId,
    title: deadline.title,
    course_code: deadline.courseCode,
    exam_date: deadline.examDate,
    prep_hours_needed: deadline.prepHoursNeeded,
    syllabus_readiness: deadline.syllabusReadiness ?? null,
    created_at: deadline.createdAt || new Date().toISOString(),
  };

  if (isUuid(deadline.id)) {
    payload.id = deadline.id;
  }

  return payload;
}

/**
 * Fetch 7-day academic study blocks from Supabase PostgreSQL.
 */
/**
 * Fetch 7-day academic study blocks from Supabase PostgreSQL.
 */
export async function fetchStudyBlocks(userId?: string): Promise<StudyBlock[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('study_blocks')
      .select('*')
      .order('day_index', { ascending: true })
      .order('start_hour', { ascending: true });

    let activeUserId = userId;
    if (!activeUserId) {
      try {
        activeUserId = await ensureAuthenticatedUser();
      } catch {
        // Unauthenticated guest session
      }
    }

    if (activeUserId) {
      query = query.eq('user_id', activeUserId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Failed to fetch study blocks from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapDbRowToStudyBlock);
  } catch (err: any) {
    console.warn('Error reading study blocks from Supabase:', err?.message);
    return [];
  }
}

/**
 * Persist or upsert a study block to Supabase PostgreSQL under user ownership.
 */
export async function saveStudyBlockToDb(block: StudyBlock, userId: string): Promise<StudyBlock> {
  if (!supabase) return block;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);
    const payload = mapStudyBlockToDbPayload(block, verifiedUserId);

    const { data, error } = await supabase
      .from('study_blocks')
      .upsert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Failed to save study block to Supabase:', error.message);
      return block;
    }

    return mapDbRowToStudyBlock(data || block);
  } catch (err: any) {
    console.warn('Error saving study block:', err?.message);
    return block;
  }
}

/**
 * Batch persist or upsert study blocks to Supabase PostgreSQL (e.g. after Auto-Fill).
 */
export async function saveBatchStudyBlocksToDb(blocks: StudyBlock[], userId: string): Promise<StudyBlock[]> {
  if (!supabase || !blocks.length) return blocks;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);
    const payload = blocks.map((b) => mapStudyBlockToDbPayload(b, verifiedUserId));

    const { data, error } = await supabase
      .from('study_blocks')
      .upsert(payload)
      .select();

    if (error) {
      console.warn('Failed to batch save study blocks to Supabase:', error.message);
      return blocks;
    }

    return (data || []).map(mapDbRowToStudyBlock);
  } catch (err: any) {
    console.warn('Error batch saving study blocks:', err?.message);
    return blocks;
  }
}

/**
 * Update specific fields on a study block (e.g. is_completed, time_display, start_hour).
 */
export async function updateStudyBlockInDb(
  blockId: string,
  updates: Partial<StudyBlock>,
  userId: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);

    const dbUpdates: Record<string, any> = {};
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
    if (updates.timeDisplay !== undefined) dbUpdates.time_display = updates.timeDisplay;
    if (updates.startHour !== undefined) dbUpdates.start_hour = updates.startHour;
    if (updates.durationHours !== undefined) dbUpdates.duration_hours = updates.durationHours;
    if (updates.dayIndex !== undefined) dbUpdates.day_index = updates.dayIndex;
    if (updates.dayLabel !== undefined) dbUpdates.day_label = updates.dayLabel;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.category !== undefined) dbUpdates.category = updates.category;

    const { error } = await supabase
      .from('study_blocks')
      .update(dbUpdates)
      .eq('id', blockId)
      .eq('user_id', verifiedUserId);

    if (error) {
      console.warn('Failed to update study block in Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn('Error updating study block:', err?.message);
    return false;
  }
}

/**
 * Delete a study block from Supabase PostgreSQL.
 */
export async function deleteStudyBlockFromDb(blockId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);

    const { error } = await supabase
      .from('study_blocks')
      .delete()
      .eq('id', blockId)
      .eq('user_id', verifiedUserId);

    if (error) {
      console.warn('Failed to delete study block from Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn('Error deleting study block:', err?.message);
    return false;
  }
}

/**
 * Fetch academic exam deadlines from Supabase PostgreSQL.
 */
export async function fetchExamDeadlines(userId?: string): Promise<ExamDeadline[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from('exam_deadlines')
      .select('*')
      .order('exam_date', { ascending: true });

    let activeUserId = userId;
    if (!activeUserId) {
      try {
        activeUserId = await ensureAuthenticatedUser();
      } catch {
        // Unauthenticated guest session
      }
    }

    if (activeUserId) {
      query = query.eq('user_id', activeUserId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Failed to fetch exam deadlines from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapDbRowToExamDeadline);
  } catch (err: any) {
    console.warn('Error reading exam deadlines from Supabase:', err?.message);
    return [];
  }
}

/**
 * Save or update an exam deadline in Supabase PostgreSQL.
 */
export async function saveExamDeadlineToDb(deadline: ExamDeadline, userId: string): Promise<ExamDeadline> {
  if (!supabase) return deadline;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);
    const payload = mapExamDeadlineToDbPayload(deadline, verifiedUserId);

    const { data, error } = await supabase
      .from('exam_deadlines')
      .upsert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Failed to save exam deadline to Supabase:', error.message);
      return deadline;
    }

    return mapDbRowToExamDeadline(data || deadline);
  } catch (err: any) {
    console.warn('Error saving exam deadline:', err?.message);
    return deadline;
  }
}

/**
 * Delete an exam deadline from Supabase PostgreSQL.
 */
export async function deleteExamDeadlineFromDb(deadlineId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const verifiedUserId = await ensureAuthenticatedUser(userId);

    const { error } = await supabase
      .from('exam_deadlines')
      .delete()
      .eq('id', deadlineId)
      .eq('user_id', verifiedUserId);

    if (error) {
      console.warn('Failed to delete exam deadline from Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn('Error deleting exam deadline:', err?.message);
    return false;
  }
}

