import React from 'react';
import { CheckCircle2, XCircle, Check, BookOpen } from 'lucide-react';

interface QuizOptionCardProps {
  letter: string;
  text: string;
  isSelected: boolean;
  isCorrect: boolean | null;
  isLocked: boolean;
  wasCorrectAnswer: boolean;
  onSelect: () => void;
  explanation?: string;
  slideCitation?: string;
}

export const QuizOptionCard: React.FC<QuizOptionCardProps> = ({
  letter,
  text,
  isSelected,
  isCorrect,
  isLocked,
  wasCorrectAnswer,
  onSelect,
  explanation,
  slideCitation,
}) => {
  let cardClass = 'quiz-option-card';
  if (isLocked) {
    cardClass += ' locked';
    if (isSelected) {
      cardClass += isCorrect ? ' correct' : ' incorrect';
    } else if (wasCorrectAnswer) {
      cardClass += ' correct';
    }
  } else if (isSelected) {
    cardClass += ' selected';
  }

  return (
    <div className={cardClass} onClick={() => !isLocked && onSelect()}>
      <div className="quiz-option-main">
        {/* Letter Badge */}
        <div className="quiz-letter-badge">
          {isLocked && isSelected ? (
            isCorrect ? (
              <CheckCircle2 size={16} strokeWidth={2.5} />
            ) : (
              <XCircle size={16} strokeWidth={2.5} />
            )
          ) : isLocked && wasCorrectAnswer ? (
            <Check size={16} strokeWidth={2.5} />
          ) : (
            letter
          )}
        </div>

        {/* Option Text */}
        <div className="quiz-option-text">
          {text}
        </div>
      </div>

      {/* Expandable Academic Rationale Callout when answered */}
      {isLocked && isSelected && explanation && (
        <div className={`quiz-rationale-box ${isCorrect === false ? 'for-incorrect' : ''}`}>
          <div
            className={`quiz-rationale-citation ${isCorrect === false ? 'for-incorrect' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BookOpen size={13} strokeWidth={2} />
            {isCorrect ? 'Correct Rationale' : 'Correction Rationale'} • {slideCitation || 'Lecture Source'}
          </div>
          <p className="quiz-rationale-text">{explanation}</p>
        </div>
      )}
    </div>
  );
};
