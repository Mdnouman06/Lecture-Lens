export type LectureStatus = 'synced' | 'processing' | 'ready';

export interface KeyConcept {
  id: string;
  term: string;
  definition: string;
  importance: 'critical' | 'high' | 'medium';
  timestamp?: string;
}

export interface TranscriptSegment {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speaker: string;
  text: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
  nextReviewDate?: string;
  stability?: number;
  difficulty?: number;
}

export interface StudyNotes {
  id?: string;
  lectureId?: string;
  userId?: string;
  summary: string;
  markdown: string;
  keyConcepts: KeyConcept[];
  examRelevance?: string;
  marginNotes?: string;
  highlights?: NoteHighlight[];
  modelUsed?: string;
  isSimulated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoteHighlight {
  id: string;
  color: 'teal' | 'lavender' | 'mint';
  text: string;
}

export interface Lecture {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  date: string;
  duration: string;
  durationSeconds: number;
  progressSeconds?: number;
  summary: string;
  concepts: KeyConcept[];
  transcript: TranscriptSegment[];
  flashcards: Flashcard[];
  status: LectureStatus;
  hasAudio: boolean;
  sourceType: 'audio' | 'pdf' | 'youtube' | 'transcript';
  ingestionMethod?: 'youtube_captions' | 'youtube_audio_faster_whisper' | string;
  audioUrl?: string;
  pdfUrl?: string;
  notes?: StudyNotes;
  filename?: string;
  wordCount?: number;
  fullText?: string;
  pageCount?: number;
  slides?: Array<{ page: number; text: string }>;
  notesMarkdown?: string;
}

export interface CourseFilter {
  id: string;
  code: string;
  name: string;
  count: number;
}

export interface TutorCitation {
  id: string;
  sourceType: 'audio' | 'pdf' | 'slide' | 'pyq';
  sourceTitle: string;
  timeStart?: number;
  timeEnd?: number;
  timecodeDisplay?: string;
  pageNumber?: string;
  quote: string;
  relevanceScore: number;
}

export interface SequenceStep {
  stepNumber: number;
  title: string;
  description: string;
  iconType: 'presynaptic' | 'postsynaptic' | 'coincidence';
}

export interface TutorExamAlert {
  title: string;
  description: string;
  passRate?: string;
}

export interface TutorMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  latencyMs?: number;
  topicBadge?: string;
  sequenceSteps?: SequenceStep[];
  citations?: TutorCitation[];
  examAlert?: TutorExamAlert;
  followUps?: string[];
  isGrounded?: boolean;
}

export interface KnowledgeScope {
  enrolledCourses: boolean;
  neuro301Transcripts: boolean;
  phys402Formulas: boolean;
  pastExamRubrics: boolean;
}

export interface RecentQuery {
  id: string;
  query: string;
  timestampDisplay: string;
}

export interface TutorQuestionRequest {
  question: string;
  lectureId?: string;
  courseCode?: string;
  chunks?: string[];
  contextSegments?: TranscriptSegment[];
  notesSummary?: string;
  scope?: KnowledgeScope;
}

export interface TutorResponse {
  text: string;
  topicBadge?: string;
  latencyMs?: number;
  sequenceSteps?: SequenceStep[];
  citations?: TutorCitation[];
  examAlert?: TutorExamAlert;
  followUps?: string[];
  isGrounded?: boolean;
  isSimulated?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  courseCode: string;
  sourceType: 'audio' | 'pdf' | 'slide' | 'pyq';
  timecode: string;
  snippet: string;
  relevance: number;
}

// ============================================================================
// Phase 5: Active Recall & Assessment Studio Types
// ============================================================================

export type FsrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface DbFlashcardRow {
  id: string;
  lecture_id: string;
  user_id: string;
  front: string;
  back: string;
  mastered: boolean;
  difficulty?: number | null;
  stability?: number | null;
  next_review_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DbQuizSubmissionRow {
  id: string;
  lecture_id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  answers: Record<string, any>;
  time_spent_seconds: number;
  created_at: string;
}

export interface FlashcardItem {
  id: string;
  lectureId: string;
  source: string; // e.g. "Lecture 14 [18:40] • Slide 22"
  subtopic: string; // e.g. "LTP Induction Mechanism"
  question: string;
  answerLead: string; // Bold 1st sentence core answer
  answerBody: string; // Detailed physiological/academic mechanism
  step1?: string;
  step2?: string;
  conceptNote?: string;
  recallAccuracy?: string; // e.g. "96%"
  difficulty?: FsrsRating | string;
  nextReview?: string;
  intervalDisplay?: string; // e.g. "3.8d"
  reps?: number;
  mastered?: boolean;
  stability?: number;
  reviewed?: boolean;
  rating?: FsrsRating;
  lastReviewed?: string;
}

export interface FlashcardDeck {
  id: string;
  lectureId: string;
  title: string;
  courseCode: string;
  dueCount: number;
  stability: number; // e.g. 94.2
  streakDays: number;
  cards: FlashcardItem[];
}

export interface QuizOption {
  id: string;
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestion {
  id: string;
  problemStatement: string;
  topicTag: string;
  difficulty: 'Exam Level (Hard)' | 'Medium' | 'Foundational';
  options: string[];
  correctIndex: number;
  explanation: string;
  slideCitation: string;
  pyqReference?: string;
  diagramThumbnail?: string;
}

export interface QuizAssessment {
  id: string;
  lectureId: string;
  title: string;
  courseCode: string;
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  averageScore?: number;
  totalCompleted?: number;
  masteryLevel?: number;
}

export interface QuizSubmission {
  quizId: string;
  lectureId?: string;
  answers: Record<number, number>; // questionIndex -> selectedOptionIndex
  timeSpentSeconds: number;
}

export interface QuizResult {
  quizId: string;
  lectureId?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Record<number, { selected: number; correct: number; isCorrect: boolean }>;
  cohortBenchmark?: string;
  completedAt: string;
}

// =============================================================================
// Phase 6: Advanced Study Tools (PYQ Analyzer & Study Planner) Interfaces
// =============================================================================

export interface PyqRubricStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface PyqQuestionItem {
  id: string;
  paperId: string;
  questionNumber: string; // e.g. "2024 · Q1"
  rawNumber?: string;
  marks: number; // e.g. 10
  problemStatement: string;
  questionText?: string;
  unit?: string | null;
  topicTag?: string;
  year?: string | number;
  recurrenceYears?: string[]; // e.g. ["2024", "2023"]
  midtermProbability?: number | null; // e.g. 85
  rubricCriteria?: PyqRubricStep[];
  commonPitfall?: {
    title: string;
    description: string;
    markLossPercent?: number;
  } | null;
  correlatedLecture?: {
    title: string;
    lectureId?: string;
    timecodeDisplay?: string; // e.g. "Lecture 14 [04:12 – 08:30]"
    seekSeconds?: number;
  } | null;
}

export interface QuestionOccurrence {
  year: string | number;
  questionNumber: string; // e.g. "2024 · Q1"
  rawNumber?: string; // e.g. "Q1"
  questionId?: string;
  paperId?: string;
  questionText?: string;
  marks?: number;
  unit?: string | null;
}

export interface GroupedQuestionPattern {
  patternId: string;
  canonicalQuestion: string;
  occurrenceCount: number;
  years: (string | number)[];
  occurrences: QuestionOccurrence[];
  topic: string;
  similarityEvidence?: string;
}

export interface PyqPaper {
  id: string;
  title: string;
  courseCode: string;
  instructor?: string | null;
  year?: number | null;
  years?: string[];
  term?: string | null; // e.g. "Fall 2023"
  examType?: 'midterm' | 'final' | 'mock' | 'pyq' | string;
  pageCount?: number;
  rawTextLength?: number;
  extractedCount: number;
  shortAnsCount?: number;
  longAnsCount?: number;
  historicalMean?: number | null;
  syllabusMatchPercent?: number | null;
  ocrFidelityPercent?: number;
  isPrimary?: boolean;
  userId?: string;
  topicWeights?: TopicWeight[];
  questions?: PyqQuestionItem[];
  questionPatterns?: GroupedQuestionPattern[];
  createdAt?: string;
}

export interface DbPyqPaperRow {
  id: string;
  user_id: string;
  title: string;
  course_code: string;
  instructor?: string;
  year?: number;
  term?: string;
  exam_type?: string;
  extracted_count: number;
  short_ans_count: number;
  long_ans_count: number;
  historical_mean?: number;
  syllabus_match_percent?: number;
  ocr_fidelity_percent?: number;
  is_primary?: boolean;
  created_at: string;
}

export interface DbPyqQuestionRow {
  id: string;
  paper_id: string;
  user_id: string;
  question_number: string;
  marks: number;
  problem_statement: string;
  topic_tag?: string;
  recurrence_years?: string[];
  midterm_probability?: number;
  rubric_criteria?: any;
  common_pitfall?: any;
  correlated_lecture?: any;
  created_at: string;
}

export interface TopicWeight {
  id: string;
  name: string;
  topic?: string;
  weightPercent: number;
  appearances?: number;
  appearanceCount?: number;
  years?: string[];
  yearsAppeared?: string[];
  recurrenceYears?: string[];
  questionReferences?: string[];
  predictedCount: string;
  statusLabel: string;
  category: 'critical' | 'mastered' | 'good' | 'low' | 'recurring';
  notesChecked: boolean;
}

export interface StudyBlock {
  id: string;
  userId?: string;
  dayIndex: number; // 0=Mon, 6=Sun
  dayLabel: string;
  title: string;
  category: 'lecture' | 'fsrs' | 'deep' | 'tutor' | 'exam';
  timeDisplay: string; // e.g. "09:00 - 10:30"
  startHour: number; // e.g. 9
  durationHours: number; // e.g. 1.5
  courseCode: string;
  notesId?: string;
  flashcardQueueCount?: number;
  examTitle?: string;
  isAutofilled?: boolean;
  isCompleted?: boolean;
}

export interface DbStudyBlockRow {
  id: string;
  user_id: string;
  day_index: number;
  day_label: string;
  title: string;
  category: 'lecture' | 'fsrs' | 'deep' | 'tutor' | 'exam';
  time_display: string;
  start_hour: number;
  duration_hours: number;
  course_code: string;
  notes_id?: string | null;
  flashcard_queue_count?: number | null;
  exam_title?: string | null;
  is_autofilled?: boolean;
  is_completed?: boolean;
  created_at: string;
}

export interface ExamDeadline {
  id: string;
  userId?: string;
  title: string;
  courseCode: string;
  examDate: string;
  examTime?: string;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  daysRemaining?: number;
  prepHoursNeeded: number;
  prepHoursScheduled?: number;
  coverageDeficit?: number;
  syllabusReadiness?: number;
  createdAt?: string;
}

export interface DbExamDeadlineRow {
  id: string;
  user_id: string;
  title: string;
  course_code: string;
  exam_date: string;
  prep_hours_needed: number;
  syllabus_readiness?: number | null;
  created_at: string;
}

export interface StudyCalendarWeek {
  weekLabel: string; // e.g. "Oct 02 – Oct 08"
  examAlert?: {
    title: string | null;
    courseCode: string;
    examDate: string | null;
    daysRemaining?: number | null;
    prepHoursNeeded: number;
    prepHoursScheduled: number;
    coverageDeficit: number;
  } | null;
  dailyTarget: {
    scheduledHours: number;
    targetHours: number;
    percentComplete: number;
    deepStudyHours: number;
    fsrsHours: number;
  };
  blocks: StudyBlock[];
}

