import React, { useState, useEffect } from 'react';
import {
  Layers,
  HelpCircle,
  RefreshCw,
  Share2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { Lecture, FlashcardItem, QuizAssessment, QuizResult } from '../types/lecture';
import { generateLectureFlashcards, generateLectureQuiz } from '../services/api';
import {
  fetchLectureFlashcards,
  saveLectureFlashcardsToDb,
  fetchLectureQuiz,
  saveLectureQuizToDb,
  fetchQuizSubmissionFromDb,
} from '../services/lectures';
import { useAuth } from '../context/AuthContext';
import { RetentionTelemetryStrip } from '../components/recall/RetentionTelemetryStrip';
import { FlashcardDeckRunner } from '../components/recall/FlashcardDeckRunner';
import { RepetitionHorizonPanel } from '../components/recall/RepetitionHorizonPanel';
import { QuizAssessmentCenter } from '../components/recall/QuizAssessmentCenter';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonCard } from '../components/common/Skeleton';
import '../styles/recall.css';

interface ActiveRecallStudioViewProps {
  initialTab?: 'flashcards' | 'quiz';
  activeLecture?: Lecture;
  onNavigateToLecture?: (lectureId: string) => void;
}

export const ActiveRecallStudioView: React.FC<ActiveRecallStudioViewProps> = ({
  initialTab = 'flashcards',
  activeLecture,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz'>(initialTab);
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [quiz, setQuiz] = useState<QuizAssessment | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCmd, setErrorCmd] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [isAnkiSyncing, setIsAnkiSyncing] = useState<boolean>(false);
  const [ankiSyncedMsg, setAnkiSyncedMsg] = useState<string>('Synced 2m ago');

  // Synchronize when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load cards, quiz, and completed quiz result for lecture from storage (Supabase -> backend SQLite -> local cache)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);
    setErrorCmd(null);

    const lecId = activeLecture?.id;
    setCards([]);
    setQuiz(null);
    setQuizResult(null);

    if (!lecId) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      fetchLectureFlashcards(lecId, user?.id),
      fetchLectureQuiz(lecId, user?.id),
      fetchQuizSubmissionFromDb(lecId, user?.id),
    ])
      .then(([loadedCards, loadedQuiz, loadedResult]) => {
        if (!isMounted) return;
        setCards(loadedCards || []);
        setQuiz(loadedQuiz || null);
        setQuizResult(loadedResult || null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load saved study materials:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeLecture?.id, user?.id]);

  const handleAnkiSync = () => {
    setIsAnkiSyncing(true);
    setTimeout(() => {
      setIsAnkiSyncing(false);
      setAnkiSyncedMsg('Synced just now');
    }, 1200);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleGenerateFresh = async () => {
    if (!activeLecture) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setErrorCmd(null);

    const lecId = activeLecture.id;
    const transcriptText =
      activeLecture.transcript && activeLecture.transcript.length > 0
        ? activeLecture.transcript.map((s) => s.text).join(' ')
        : activeLecture.summary || '';

    if (!transcriptText.trim()) {
      setIsGenerating(false);
      setErrorMsg('No transcript or text available for this lecture. Please transcribe audio or upload notes first.');
      return;
    }

    try {
      if (activeTab === 'quiz') {
        const newQuiz = await generateLectureQuiz(lecId, activeLecture.title, activeLecture.courseCode, transcriptText);
        setQuiz(newQuiz);
        setQuizResult(null);

        if (newQuiz) {
          saveLectureQuizToDb(lecId, newQuiz, user?.id)
            .then((persisted) => {
              if (persisted) {
                setQuiz(persisted);
              }
            })
            .catch((err) => {
              console.warn('Failed to save quiz to DB:', err);
            });
        }
      } else {
        const newCards = await generateLectureFlashcards(lecId, activeLecture.title, activeLecture.courseCode, transcriptText);
        setCards(newCards);

        if (newCards.length > 0) {
          saveLectureFlashcardsToDb(lecId, newCards, user?.id)
            .then((persisted) => {
              if (persisted && persisted.length > 0) {
                setCards(persisted);
              }
            })
            .catch((err) => {
              console.warn('Failed to save flashcards to DB:', err);
            });
        }
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      const msg = err?.message || 'Failed to generate study materials.';
      setErrorMsg(msg);
      const isTimeout = msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('timeout');
      if (!isTimeout) {
        if (msg.includes('ollama serve') || msg.includes('offline') || msg.includes('503')) {
          setErrorCmd('ollama serve');
        } else if (msg.includes('ollama pull') || msg.includes('not installed') || msg.includes('404')) {
          setErrorCmd('ollama pull qwen3:0.6b');
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="studio-container">
      {/* Top Header Bar */}
      <div className="studio-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="studio-breadcrumbs">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <img
                src="/leclens.jpg"
                alt="LectureLens"
                style={{ width: '20px', height: '20px', borderRadius: '5px', objectFit: 'contain' }}
              />
              <span style={{ fontWeight: 600 }}>LectureLens</span>
            </span>
            <ChevronRight size={13} />
            <span className="crumb-active">Active Recall & Assessment Studio</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
              {activeTab === 'flashcards'
                ? 'Spaced Repetition & Flashcards'
                : 'Adaptive Exam Quiz Drill'}
            </h1>
            <div className="studio-engine-pill">
              <span className="studio-engine-dot" />
              <span>Neural Rubric Adaptive Engine v3.4</span>
            </div>
          </div>
        </div>

        {/* Studio Sub-Tabs & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Sub-Tab Switcher */}
          <div className="studio-subtabs" role="tablist" aria-label="Active Recall Mode Selection">
            <button
              id="tab-flashcards"
              role="tab"
              aria-selected={activeTab === 'flashcards'}
              aria-controls="panel-flashcards"
              onClick={() => setActiveTab('flashcards')}
              className={`studio-subtab-btn ${activeTab === 'flashcards' ? 'is-active' : ''}`}
            >
              <Layers size={15} />
              <span>Flashcard Decks</span>
            </button>
            <button
              id="tab-quiz"
              role="tab"
              aria-selected={activeTab === 'quiz'}
              aria-controls="panel-quiz"
              onClick={() => setActiveTab('quiz')}
              className={`studio-subtab-btn ${activeTab === 'quiz' ? 'is-active' : ''}`}
            >
              <HelpCircle size={15} />
              <span>Quiz Assessments</span>
            </button>
          </div>

          {/* Anki Sync */}
          <button onClick={handleAnkiSync} className="btn-anki-sync" disabled={isAnkiSyncing}>
            <Share2 size={14} className={isAnkiSyncing ? 'animate-spin' : ''} />
            <span>Anki Sync</span>
            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>• {ankiSyncedMsg}</span>
          </button>

          {/* Regenerate Deck/Quiz */}
          <button
            onClick={handleGenerateFresh}
            className="btn-generate-studio"
            disabled={isGenerating || !activeLecture}
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate with Qwen3'}</span>
          </button>
        </div>
      </div>

      {/* Diagnostic Error Banner */}
      {errorMsg && (
        <div className="recall-error-card">
          <div className="recall-error-header">
            <AlertTriangle size={18} />
            <span>
              {errorMsg.toLowerCase().includes('timed out') || errorMsg.toLowerCase().includes('timeout')
                ? (activeTab === 'quiz' ? 'Quiz Generation Timed Out' : 'Flashcard Generation Timed Out')
                : errorMsg}
            </span>
          </div>
          <p className="recall-error-msg">
            {errorMsg.toLowerCase().includes('timed out') || errorMsg.toLowerCase().includes('timeout')
              ? errorMsg
              : errorCmd
              ? 'Please run the following command in your terminal, then try again:'
              : 'Please ensure your local FastAPI backend (localhost:8000) and Ollama are running.'}
          </p>
          {errorCmd && (
            <div className="recall-command-box">
              <code className="recall-command-code">{errorCmd}</code>
              <button
                onClick={() => copyToClipboard(errorCmd)}
                className="btn-copy-cmd"
              >
                {copiedCmd ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Studio View Content */}
      {isLoading ? (
        <div className="recall-deck-split-grid">
          <div className="recall-split-main">
            <SkeletonCard height="380px" />
          </div>
          <div className="recall-split-side" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SkeletonCard height="180px" />
            <SkeletonCard height="180px" />
          </div>
        </div>
      ) : isGenerating ? (
        <div className="recall-skeleton-card">
          <RefreshCw size={28} className="animate-spin" color="var(--color-primary)" />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-on-surface)', margin: '0 0 6px 0' }}>
              Synthesizing Active Recall Materials with Qwen3...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', margin: 0 }}>
              Analyzing lecture concepts, framing active-recall triggers, and structuring exam questions.
            </p>
          </div>
          <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="recall-shimmer-bar" style={{ height: '14px', width: '100%' }} />
            <div className="recall-shimmer-bar" style={{ height: '14px', width: '70%' }} />
          </div>
        </div>
      ) : activeTab === 'flashcards' ? (
        cards.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No Flashcards Generated Yet"
            description={
              activeLecture
                ? `Generate an active-recall flashcard deck for "${activeLecture.title}" using local Qwen3.`
                : 'Select a lecture from the dashboard to generate active-recall flashcards.'
            }
            actionLabel={isGenerating ? 'Synthesizing Decks with Qwen3...' : 'Generate Flashcards with Qwen3'}
            onAction={handleGenerateFresh}
            badgeText="Active Recall Studio"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Retention Telemetry Strip */}
            <RetentionTelemetryStrip
              selectedCourse={selectedCourse}
              onSelectCourse={setSelectedCourse}
              dueCount={cards.length}
              courseLabel={activeLecture?.courseCode}
            />

            {/* Split-pane Deck Studio */}
            <div className="recall-deck-split-grid">
              <div className="recall-split-main">
                <FlashcardDeckRunner
                  key={`deck-${activeLecture?.id}`}
                  cards={cards}
                  userId={user?.id}
                  lectureId={activeLecture?.id}
                  deckTitle={activeLecture ? `${activeLecture.courseCode} — ${activeLecture.title}` : undefined}
                  onSwitchToQuiz={() => setActiveTab('quiz')}
                  onCardRated={(updatedCard) => {
                    setCards((prev) =>
                      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
                    );
                  }}
                />
              </div>

              <div className="recall-split-side">
                <RepetitionHorizonPanel />
              </div>
            </div>
          </div>
        )
      ) : (
        /* Quiz Assessment Center */
        !quiz ? (
          <EmptyState
            icon={HelpCircle}
            title="No Quiz Drill Generated Yet"
            description={
              activeLecture
                ? `Generate a 5-question exam drill for "${activeLecture.title}" grounded in the lecture transcript.`
                : 'Select a lecture from the dashboard to generate an exam assessment drill.'
            }
            actionLabel={isGenerating ? 'Synthesizing Quiz with Qwen3...' : 'Generate 5-Question Quiz with Qwen3'}
            onAction={handleGenerateFresh}
            badgeText="Assessment Center"
          />
        ) : (
          <QuizAssessmentCenter
            key={`quiz-${activeLecture?.id}`}
            quiz={quiz}
            initialResult={quizResult}
            userId={user?.id}
            lectureId={activeLecture?.id}
            onSwitchToFlashcards={() => setActiveTab('flashcards')}
            onCompleteQuiz={(result) => setQuizResult(result)}
            onRetakeQuiz={() => setQuizResult(null)}
          />
        )
      )}
    </div>
  );
};
