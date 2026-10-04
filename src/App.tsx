import { useState, useEffect } from 'react';
import { Shell } from './components/layout/Shell';
import { DashboardView } from './views/DashboardView';
import { IngestionHubView } from './views/IngestionHubView';
import { LectureWorkspaceView } from './views/LectureWorkspaceView';
import { AiTutorView } from './views/AiTutorView';
import { ActiveRecallStudioView } from './views/ActiveRecallStudioView';
import { PyqIntelligenceView } from './views/PyqIntelligenceView';
import { StudyPlannerView } from './views/StudyPlannerView';
import type { Lecture } from './types/lecture';
import { MOCK_LECTURES } from './data/mockLectures';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchUserLectures, createUserLecture } from './services/lectures';
import {
  Sparkles,
  ArrowLeft,
  UploadCloud,
  BookOpen,
  MessageSquare,
  Layers,
  HelpCircle,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AuthModal } from './components/auth/AuthModal';

function sanitizeLectureCourse(lec: Lecture): Lecture {
  if (!lec) return lec;
  if (lec.id === 'lec-neuro-301-14' || lec.id === 'lec-001') return lec;

  const text = `${lec.title || ''} ${lec.transcript || ''} ${lec.summary || ''}`.toLowerCase();
  const isLostOrNonNeuro =
    text.includes('lost') ||
    text.includes('man in black') ||
    text.includes('jacob') ||
    text.includes('island') ||
    text.includes('oceanic');
  const isNeuroContent =
    text.includes('synap') ||
    text.includes('neuron') ||
    text.includes('nmda') ||
    text.includes('ltp') ||
    text.includes('neuroscience');

  if (isLostOrNonNeuro || !lec.courseCode || (!isNeuroContent && lec.courseCode === 'NEURO 301')) {
    return {
      ...lec,
      courseCode: 'General',
      courseName:
        lec.courseName === 'Cellular Neuroscience'
          ? 'General Academic Subject'
          : (lec.courseName || 'General Academic Subject'),
    };
  }
  return lec;
}

function LectureLensContent() {
  const { user, sessionError, clearSessionError } = useAuth();
  const [isReAuthModalOpen, setIsReAuthModalOpen] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>(() => {
    try {
      const saved = localStorage.getItem('lecturelens_lectures');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeLectureCourse);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached lectures:', e);
    }
    return MOCK_LECTURES;
  });

  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(() => {
    try {
      const savedId = localStorage.getItem('lecturelens_selected_id');
      const savedLectures = localStorage.getItem('lecturelens_lectures');
      if (savedId && savedLectures) {
        const parsed: Lecture[] = JSON.parse(savedLectures);
        const match = parsed.find((l) => l.id === savedId);
        if (match) return sanitizeLectureCourse(match);
      }
    } catch (e) {
      console.warn('Failed to parse selected lecture ID:', e);
    }
    return MOCK_LECTURES[0] || null;
  });

  const [isLoadingLectures, setIsLoadingLectures] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync lectures from Supabase when user signs in, or restore demo lectures when signed out
  useEffect(() => {
    let isCancelled = false;

    async function syncLectures() {
      const savedId = localStorage.getItem('lecturelens_selected_id');
      if (user) {
        setIsLoadingLectures(true);
        try {
          const userLectures = await fetchUserLectures();
          if (!isCancelled) {
            const sanitized = userLectures.map(sanitizeLectureCourse);
            setLectures(sanitized);
            if (sanitized.length > 0) {
              const matched = sanitized.find((l) => l.id === savedId);
              setSelectedLecture(matched || sanitized[0]);
            } else {
              setSelectedLecture(null);
            }
          }
        } catch (err: unknown) {
          if (!isCancelled) {
            const message = err instanceof Error ? err.message : 'Supabase error';
            console.error('Failed to load user lectures from Supabase:', err);
            setToastMessage(`Error fetching your vault: ${message}`);
            setTimeout(() => setToastMessage(null), 4000);
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingLectures(false);
          }
        }
      } else {
        // Guest mode fallback
        try {
          const saved = localStorage.getItem('lecturelens_lectures');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const sanitized = parsed.map(sanitizeLectureCourse);
              setLectures(sanitized);
              const matched = sanitized.find((l: Lecture) => l.id === savedId);
              setSelectedLecture(matched || sanitized[0]);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to parse cached lectures:', e);
        }
        setLectures(MOCK_LECTURES);
        const matched = MOCK_LECTURES.find((l) => l.id === savedId);
        setSelectedLecture(matched || MOCK_LECTURES[0]);
      }
    }

    syncLectures();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Sync lectures changes to localStorage ONLY for guest sessions
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('lecturelens_lectures', JSON.stringify(lectures));
      } catch (e) {
        console.warn('Could not persist lectures to localStorage:', e);
      }
    }
  }, [lectures, user]);

  // Sync active lecture selection to localStorage
  useEffect(() => {
    if (selectedLecture?.id) {
      try {
        localStorage.setItem('lecturelens_selected_id', selectedLecture.id);
      } catch (e) {
        console.warn('Could not persist selected lecture ID:', e);
      }
    }
  }, [selectedLecture]);

  const handleLectureUploaded = async (newLecture: Lecture) => {
    const sanitized = sanitizeLectureCourse(newLecture);
    if (user) {
      try {
        const created = await createUserLecture(sanitized, user.id);
        const sanitizedCreated = sanitizeLectureCourse(created);
        setLectures((prev) => [sanitizedCreated, ...prev]);
        setSelectedLecture(sanitizedCreated);
        setToastMessage(`"${sanitizedCreated.title}" successfully saved to your Supabase vault!`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Database error';
        console.error('Failed to save lecture to Supabase:', err);
        setLectures((prev) => [sanitized, ...prev]);
        setSelectedLecture(sanitized);
        setToastMessage(`Warning: Local preview ready, but Supabase sync failed (${message})`);
      }
    } else {
      setLectures((prev) => [sanitized, ...prev]);
      setSelectedLecture(sanitized);
      setToastMessage(`"${sanitized.title}" successfully ingested! Sign in to sync across devices.`);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleUpdateLecture = (updated: Lecture) => {
    const sanitized = sanitizeLectureCourse(updated);
    setSelectedLecture(sanitized);
    setLectures((prev) => {
      const next = prev.map((l) => (l.id === sanitized.id ? sanitized : l));
      try {
        localStorage.setItem('lecturelens_lectures', JSON.stringify(next));
      } catch (e) {
        console.warn('Could not cache lectures to localStorage:', e);
      }
      return next;
    });
  };

  return (
    <>
      <Shell
        onLectureUploaded={handleLectureUploaded}
        activeCourse={
          selectedLecture?.courseCode && selectedLecture.courseCode !== 'ALL'
            ? selectedLecture.courseCode
            : (lectures[0]?.courseCode && lectures[0].courseCode !== 'ALL'
              ? lectures[0].courseCode
              : 'General')
        }
      >
        {({ activeView, onNavigate }) => {
          if (activeView === 'dashboard') {
            return (
              <DashboardView
                onNavigate={onNavigate}
                onSelectLecture={(lec) => {
                  setSelectedLecture(lec);
                  onNavigate('workspace');
                }}
                lectures={lectures}
                isLoading={isLoadingLectures}
              />
            );
          }

          if (activeView === 'ingest') {
            return (
              <IngestionHubView
                lectures={lectures}
                onIngestSuccess={handleLectureUploaded}
                onOpenWorkspace={(lec) => {
                  setSelectedLecture(lec);
                  onNavigate('workspace');
                }}
              />
            );
          }

          if (activeView === 'workspace') {
            return (
              <LectureWorkspaceView
                lecture={selectedLecture || lectures[0] || MOCK_LECTURES[0]}
                onNavigate={onNavigate}
                onUpdateLecture={handleUpdateLecture}
              />
            );
          }

          if (activeView === 'tutor') {
            return (
              <AiTutorView
                onNavigate={onNavigate}
                onNavigateToLecture={(lectureId, _seekSecs) => {
                  const target = lectures.find((l) => l.id === lectureId) || lectures[0];
                  setSelectedLecture(target);
                  onNavigate('workspace');
                }}
              />
            );
          }

          if (activeView === 'flashcards') {
            return (
              <ActiveRecallStudioView
                initialTab="flashcards"
                activeLecture={selectedLecture || lectures[0]}
                onNavigateToLecture={(lectureId) => {
                  const target = lectures.find((l) => l.id === lectureId) || lectures[0];
                  setSelectedLecture(target);
                  onNavigate('workspace');
                }}
              />
            );
          }

          if (activeView === 'quiz') {
            return (
              <ActiveRecallStudioView
                initialTab="quiz"
                activeLecture={selectedLecture || lectures[0]}
                onNavigateToLecture={(lectureId) => {
                  const target = lectures.find((l) => l.id === lectureId) || lectures[0];
                  setSelectedLecture(target);
                  onNavigate('workspace');
                }}
              />
            );
          }

          if (activeView === 'pyq') {
            return (
              <PyqIntelligenceView
                onNavigateToLecture={(lectureId, _seekSecs) => {
                  const target = lectures.find((l) => l.id === lectureId) || lectures[0];
                  setSelectedLecture(target);
                  onNavigate('workspace');
                }}
              />
            );
          }

          if (activeView === 'planner') {
            return (
              <StudyPlannerView
                onNavigateToLecture={(lectureId) => {
                  const target = lectures.find((l) => l.id === lectureId) || lectures[0];
                  setSelectedLecture(target);
                  onNavigate('workspace');
                }}
                onNavigateToFlashcards={() => onNavigate('flashcards')}
              />
            );
          }

        const VIEW_DETAILS: Record<
          string,
          { title: string; desc: string; icon: typeof Sparkles; phase: string }
        > = {
          ingest: {
            title: 'Multimodal Lecture Ingestion Hub',
            desc: 'Upload slide PDFs, MP4 recordings, Zoom files, or YouTube links. Local Whisper and PyPDF pipelines process materials in seconds.',
            icon: UploadCloud,
            phase: 'Phase 2: Ingestion & Local AI',
          },
          workspace: {
            title: 'Smart Notes & Audio Synced Workspace',
            desc: 'Interactive dual-pane workspace synchronizing audio transcript waveforms with hierarchical study notes and key concept cards.',
            icon: BookOpen,
            phase: 'Phase 3: Note Workspace',
          },
          tutor: {
            title: 'Grounded AI Tutor & Query Engine',
            desc: 'Chat with an AI tutor strictly grounded in your lecture slides. Cites timestamps, explains complex formulas, and generates examples.',
            icon: MessageSquare,
            phase: 'Phase 4: AI Tutor',
          },
          flashcards: {
            title: 'FSRS 4.5 Active-Recall Flashcard Decks',
            desc: 'Study 28 due flashcards with scientifically calibrated spaced repetition intervals and memory stability scoring.',
            icon: Layers,
            phase: 'Phase 5: Flashcards & Quizzes',
          },
          quiz: {
            title: 'Interactive Adaptive Quizzes',
            desc: 'Self-assessment MCQs with instant answer rationales and confetti celebrations on high performance.',
            icon: HelpCircle,
            phase: 'Phase 5: Flashcards & Quizzes',
          },
          pyq: {
            title: 'PYQ Exam Intelligence & Question Bank',
            desc: 'Discover recurring exam patterns and question frequency clusters extracted from historical professor exam papers.',
            icon: FileText,
            phase: 'Phase 6: Exam Prep',
          },
          planner: {
            title: 'Dynamic Study Planner',
            desc: 'Personalized study schedule aligning lecture revisions with midterm and final exam deadlines.',
            icon: Calendar,
            phase: 'Phase 6: Exam Prep',
          },
        };

        const currentDetail = VIEW_DETAILS[activeView] || {
          title: 'Academic Module',
          desc: 'LectureLens Apple HIG workspace module.',
          icon: Sparkles,
          phase: 'Roadmap Milestone',
        };

        const Icon = currentDetail.icon;

        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-lg)',
              maxWidth: '800px',
              margin: 'var(--space-2xl) auto',
            }}
          >
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-primary-container)',
                fontSize: 'var(--text-body)',
                fontWeight: 600,
                width: 'fit-content',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>

            <div
              className="glass-card"
              style={{
                padding: 'var(--space-2xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 'var(--space-md)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'rgba(79, 70, 229, 0.1)',
                  color: 'var(--color-primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={28} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: 'var(--text-micro)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-surface-container-low)',
                    color: 'var(--color-primary-container)',
                    display: 'inline-block',
                    marginBottom: '8px',
                  }}
                >
                  {currentDetail.phase}
                </span>
                <h2
                  style={{
                    fontSize: 'var(--text-headline)',
                    fontWeight: 700,
                    color: 'var(--color-on-surface)',
                    marginBottom: '8px',
                  }}
                >
                  {currentDetail.title}
                </h2>
                <p
                  style={{
                    fontSize: 'var(--text-body)',
                    color: 'var(--color-on-surface-variant)',
                    maxWidth: '520px',
                    lineHeight: 1.6,
                  }}
                >
                  {currentDetail.desc}
                </p>
              </div>

              <div
                style={{
                  marginTop: 'var(--space-md)',
                  display: 'flex',
                  gap: 'var(--space-sm)',
                }}
              >
                <button
                  className="btn-primary-cta"
                  onClick={() => onNavigate('dashboard')}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      }}
    </Shell>

    {/* Graceful Session Expiration Alert Banner */}
    {sessionError && (
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 18px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(239, 68, 68, 0.15)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#ef4444',
          fontSize: '13px',
          fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
        role="alert"
      >
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span>{sessionError}</span>
        <button
          type="button"
          onClick={() => {
            setIsReAuthModalOpen(true);
            clearSessionError();
          }}
          style={{
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign In Again
        </button>
      </div>
    )}

    {/* Re-Authentication Modal for Expired Sessions */}
    <AuthModal
      isOpen={isReAuthModalOpen}
      onClose={() => setIsReAuthModalOpen(false)}
      initialMode="signin"
    />

    {toastMessage && (
      <div className="toast-notification">
        <CheckCircle2 size={18} color="var(--color-primary-container)" />
        <span>{toastMessage}</span>
      </div>
    )}
  </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LectureLensContent />
    </AuthProvider>
  );
}

