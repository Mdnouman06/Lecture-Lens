import React, { useEffect } from 'react';
import { Award, RotateCcw, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { QuizResult } from '../../types/lecture';

interface QuizScoreModalProps {
  result: QuizResult;
  topicName?: string;
  onRetake: () => void;
  onReviewMissed?: () => void;
  onClose: () => void;
  onSwitchToFlashcards?: () => void;
}

export const QuizScoreModal: React.FC<QuizScoreModalProps> = ({
  result,
  topicName,
  onRetake,
  onClose,
  onSwitchToFlashcards,
}) => {
  useEffect(() => {
    // Fire celebratory confetti blast on completion
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#3525cd', '#10b981', '#06b6d4', '#f59e0b'],
      });
    } catch (e) {
      console.warn('Confetti could not be triggered:', e);
    }
  }, []);

  const isPerfect = result.percentage === 100;

  return (
    <div className="quiz-modal-backdrop" onClick={onClose}>
      <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-outline)',
            cursor: 'pointer',
            padding: '4px',
          }}
          title="Close Modal"
        >
          <X size={20} />
        </button>

        {/* Trophy / Award Icon */}
        <div className="quiz-modal-icon-trophy">
          <Award size={36} strokeWidth={2.2} />
        </div>

        <div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} />
            Assessment Completed
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 0 0', color: 'var(--color-on-surface)' }}>
            {isPerfect ? 'Flawless Mastery!' : 'Excellent Work!'}
          </h2>
        </div>

        {/* Score Percentage */}
        <div>
          <div className="quiz-modal-percentage">
            {result.percentage}%
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-on-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px',
            }}
          >
            <CheckCircle2 size={16} color="#059669" />
            {result.score} of {result.totalQuestions} Questions Answered Correctly
          </div>
        </div>

        {/* XP / Mastery Rewards */}
        <div
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: '#f4f2fd',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-primary)',
          }}
        >
          🎯 Topic Mastery Updated: {topicName || 'Lecture Concepts'} (+250 XP Awarded)
        </div>

        {/* Action Buttons */}
        <div className="quiz-modal-buttons">
          <button onClick={onRetake} className="btn-modal-secondary">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={15} />
              Retake Drill
            </span>
          </button>

          {onSwitchToFlashcards ? (
            <button onClick={onSwitchToFlashcards} className="btn-modal-primary">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Study Flashcards
                <ArrowRight size={15} />
              </span>
            </button>
          ) : (
            <button onClick={onClose} className="btn-modal-primary">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
