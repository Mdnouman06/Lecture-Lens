import React, { useState, useEffect } from 'react';
import {
  Timer,
  Flag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
} from 'lucide-react';
import type { QuizAssessment, QuizResult, QuizSubmission } from '../../types/lecture';
import { submitQuizResult } from '../../services/api';
import { saveQuizSubmissionToDb } from '../../services/lectures';
import { QuizOptionCard } from './QuizOptionCard';
import { QuizScoreModal } from './QuizScoreModal';

interface QuizAssessmentCenterProps {
  quiz: QuizAssessment;
  initialResult?: QuizResult | null;
  userId?: string;
  lectureId?: string;
  onCompleteQuiz?: (result: QuizResult) => void;
  onRetakeQuiz?: () => void;
  onSwitchToFlashcards?: () => void;
}

function extractUserAnswers(initialResult?: QuizResult | null): Record<number, number> {
  if (!initialResult || !initialResult.answers) return {};
  const map: Record<number, number> = {};
  for (const [key, val] of Object.entries(initialResult.answers)) {
    const qIdx = Number(key);
    if (isNaN(qIdx)) continue;
    if (typeof val === 'number') {
      map[qIdx] = val;
    } else if (typeof val === 'string' && !isNaN(Number(val))) {
      map[qIdx] = Number(val);
    } else if (val && typeof val === 'object' && typeof (val as any).selected === 'number') {
      map[qIdx] = (val as any).selected;
    }
  }
  return map;
}

export const QuizAssessmentCenter: React.FC<QuizAssessmentCenterProps> = ({
  quiz,
  initialResult,
  userId,
  lectureId,
  onCompleteQuiz,
  onRetakeQuiz,
  onSwitchToFlashcards,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>(() =>
    extractUserAnswers(initialResult)
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timerSeconds, setTimerSeconds] = useState(522); // Starts at 08:42
  const [quizResult, setQuizResult] = useState<QuizResult | null>(initialResult || null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if initialResult is asynchronously restored
  useEffect(() => {
    if (initialResult) {
      setQuizResult(initialResult);
      setUserAnswers(extractUserAnswers(initialResult));
    }
  }, [initialResult]);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const isCompleted = quizResult !== null;

  // Live timer tick
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} / 25:00`;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isCompleted || userAnswers[currentQuestionIndex] !== undefined) return; // Already locked
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex],
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (!isCompleted) {
      handleSubmitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    const submission: QuizSubmission = {
      quizId: quiz.id,
      answers: userAnswers,
      timeSpentSeconds: 1500 - timerSeconds,
    };

    try {
      const result = await submitQuizResult(submission, quiz);
      setQuizResult(result);
      setShowModal(true);
      saveQuizSubmissionToDb(submission, result, userId, lectureId || quiz.lectureId).catch((err) => {
        console.warn('Failed to save quiz submission to DB:', err);
      });
      if (onCompleteQuiz) onCompleteQuiz(result);
    } catch (e) {
      console.error('Quiz submission error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQuestionIndex(0);
    setQuizResult(null);
    setShowModal(false);
    setTimerSeconds(1500);
    if (onRetakeQuiz) onRetakeQuiz();
  };

  const selectedAnswerIndex = userAnswers[currentQuestionIndex];
  const isQuestionAnswered = selectedAnswerIndex !== undefined;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="quiz-container">
      {/* Top Metric Strip (4 Stat Cards matching Stitch screen d0d55bf76b054dc9973ffd286321aa5e) */}
      <div className="quiz-stats-strip">
        <div className="telemetry-card">
          <div className="telemetry-icon-box stability">
            <TrendingUp size={22} strokeWidth={2} />
          </div>
          <div className="telemetry-meta">
            <span className="telemetry-label">Average Score</span>
            <span className="telemetry-value" style={{ color: '#047857' }}>
              {quiz.averageScore || 91.5}%
            </span>
            <span className="telemetry-sub">+3.2% vs Class Benchmark</span>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-icon-box due">
            <BookOpen size={22} strokeWidth={2} />
          </div>
          <div className="telemetry-meta">
            <span className="telemetry-label">Quizzes Completed</span>
            <span className="telemetry-value">
              {quiz.totalCompleted || 24}
            </span>
            <span className="telemetry-sub">4 drills this week</span>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-icon-box streak">
            <Award size={22} strokeWidth={2} />
          </div>
          <div className="telemetry-meta">
            <span className="telemetry-label">Mastery Level</span>
            <span className="telemetry-value" style={{ color: '#b45309' }}>
              {quiz.masteryLevel !== undefined ? `${quiz.masteryLevel}%` : 'Active Drill'}
            </span>
            <span className="telemetry-sub">Recall Telemetry</span>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-icon-box" style={{ background: '#f4f2fd', color: 'var(--color-primary)' }}>
            <Calendar size={22} strokeWidth={2} />
          </div>
          <div className="telemetry-meta">
            <span className="telemetry-label">Upcoming Exam</span>
            <span className="telemetry-value" style={{ fontSize: '15px' }}>
              Midterm Drill
            </span>
            <span className="telemetry-sub">Due in 2 days</span>
          </div>
        </div>
      </div>

      {/* Active Runner Card */}
      <div className="quiz-runner-card">
        {/* Runner Header */}
        <div className="quiz-runner-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isCompleted ? (
              <span className="quiz-badge-live" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#047857' }}>
                <CheckCircle2 size={13} strokeWidth={2.5} />
                COMPLETED ({quizResult.score}/{quizResult.totalQuestions} • {quizResult.percentage}%)
              </span>
            ) : (
              <span className="quiz-badge-live">
                <span className="studio-engine-dot" style={{ background: '#ea580c', boxShadow: '0 0 8px #ea580c' }} />
                LIVE DRILL
              </span>
            )}
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
              {quiz.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="quiz-timer-pill">
              <Timer size={15} />
              <span>{formatTimer(timerSeconds)}</span>
            </div>

            <button
              onClick={toggleFlag}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: flaggedQuestions[currentQuestionIndex] ? '#ffdad6' : '#ffffff',
                border: '1px solid var(--color-outline-variant)',
                color: flaggedQuestions[currentQuestionIndex] ? '#ba1a1a' : 'var(--color-on-surface-variant)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Flag size={13} fill={flaggedQuestions[currentQuestionIndex] ? '#ba1a1a' : 'transparent'} />
              <span>{flaggedQuestions[currentQuestionIndex] ? 'Flagged' : 'Flag'}</span>
            </button>
          </div>
        </div>

        {/* Completed Quiz Status Banner */}
        {isCompleted && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              marginBottom: '16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#15803d',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={17} color="#15803d" />
              <span>
                Completed Drill: <strong>{quizResult.score}/{quizResult.totalQuestions} ({quizResult.percentage}%)</strong>
                {quizResult.completedAt ? ` • Submitted on ${new Date(quizResult.completedAt).toLocaleDateString()}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowModal(true)}
                className="filter-pill"
                style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer', background: '#ffffff' }}
              >
                View Score Breakdown
              </button>
              <button
                onClick={handleRetake}
                className="filter-pill"
                style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer', background: '#ffffff', color: 'var(--color-primary)' }}
              >
                Retake Drill
              </button>
            </div>
          </div>
        )}

        {/* Question Palette & Progress Track */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="question-palette-dots">
              {questions.map((_, idx) => {
                const isAnswered = userAnswers[idx] !== undefined;
                const isActive = idx === currentQuestionIndex;
                let dotClass = 'palette-dot';
                if (isActive) dotClass += ' active';
                else if (isAnswered) dotClass += ' answered';

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={dotClass}
                    title={`Question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick status pill */}
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-outline)' }}>
            {Object.keys(userAnswers).length} of {questions.length} Answered
          </span>
        </div>

        {/* Question Body */}
        {currentQuestion && (
          <div className="quiz-question-card">
            {/* Topic & Difficulty Tags */}
            <div className="quiz-tag-row">
              <span className="quiz-topic-tag">{currentQuestion.topicTag}</span>
              <span className="quiz-diff-tag">{currentQuestion.difficulty}</span>
              {currentQuestion.pyqReference && (
                <span className="quiz-pyq-tag">{currentQuestion.pyqReference}</span>
              )}
            </div>

            {/* Problem Statement */}
            <h3 className="quiz-problem-text">
              {currentQuestion.problemStatement}
            </h3>

            {/* 4 Options Grid */}
            <div className="quiz-options-list">
              {currentQuestion.options.map((optText, optIdx) => {
                const letters = ['A', 'B', 'C', 'D'];
                const letter = letters[optIdx] || 'A';
                const isSelected = selectedAnswerIndex === optIdx;
                const isCorrect = isSelected ? (optIdx === currentQuestion.correctIndex) : null;
                const wasCorrectAnswer = optIdx === currentQuestion.correctIndex;

                return (
                  <QuizOptionCard
                    key={optIdx}
                    letter={letter}
                    text={optText}
                    isSelected={isSelected}
                    isCorrect={isCorrect}
                    isLocked={isQuestionAnswered || isCompleted}
                    wasCorrectAnswer={wasCorrectAnswer}
                    onSelect={() => handleSelectOption(optIdx)}
                    explanation={currentQuestion.explanation}
                    slideCitation={currentQuestion.slideCitation}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(228, 228, 231, 0.6)' }}>
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="filter-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: currentQuestionIndex === 0 ? 0.4 : 1,
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ArrowLeft size={15} />
            Previous
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleRetake} className="filter-pill" title="Reset answers">
              <RotateCcw size={14} />
            </button>

            {isCompleted && isLastQuestion ? (
              <button
                onClick={() => setShowModal(true)}
                className="btn-generate-studio"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <CheckCircle2 size={16} />
                View Full Scorecard
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="btn-generate-studio"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {isLastQuestion ? (
                  <>
                    <CheckCircle2 size={16} />
                    Submit Assessment Drill
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal with Confetti Celebration */}
      {quizResult && showModal && (
        <QuizScoreModal
          result={quizResult}
          topicName={quiz.title}
          onRetake={handleRetake}
          onClose={() => setShowModal(false)}
          onSwitchToFlashcards={onSwitchToFlashcards}
        />
      )}
    </div>
  );
};
