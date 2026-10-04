import React from 'react';
import { Star, RotateCcw, Volume2, EyeOff } from 'lucide-react';
import type { FsrsRating } from '../../types/lecture';

interface FlashcardRatingBarProps {
  onRate: (rating: FsrsRating) => void;
  onUndo: () => void;
  canUndo: boolean;
  onAudioPronounce?: () => void;
  onBuryCard?: () => void;
}

export const FlashcardRatingBar: React.FC<FlashcardRatingBarProps> = ({
  onRate,
  onUndo,
  canUndo,
  onAudioPronounce,
  onBuryCard,
}) => {
  return (
    <div className="fsrs-rating-container">
      {/* 4-Level FSRS Buttons */}
      <div className="fsrs-buttons-grid">
        {/* 1. Again */}
        <button
          onClick={() => onRate('again')}
          className="btn-fsrs btn-fsrs-again"
          title="Repeat in less than 10 minutes (Key 1)"
        >
          <span className="fsrs-btn-label">Again</span>
          <span className="fsrs-btn-interval">&lt;10 min</span>
          <span className="fsrs-btn-key">Key 1</span>
        </button>

        {/* 2. Hard */}
        <button
          onClick={() => onRate('hard')}
          className="btn-fsrs btn-fsrs-hard"
          title="Review tomorrow (Key 2)"
        >
          <span className="fsrs-btn-label">Hard</span>
          <span className="fsrs-btn-interval">1.2 days</span>
          <span className="fsrs-btn-key">Key 2</span>
        </button>

        {/* 3. Good */}
        <button
          onClick={() => onRate('good')}
          className="btn-fsrs btn-fsrs-good"
          title="Standard interval review (Key 3)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="fsrs-btn-label">Good</span>
            <Star size={13} fill="#ffffff" strokeWidth={0} />
          </div>
          <span className="fsrs-btn-interval" style={{ color: '#dad7ff' }}>3.8 days</span>
          <span className="fsrs-btn-key" style={{ color: '#dad7ff' }}>Key 3</span>
        </button>

        {/* 4. Easy */}
        <button
          onClick={() => onRate('easy')}
          className="btn-fsrs btn-fsrs-easy"
          title="Long interval review (Key 4)"
        >
          <span className="fsrs-btn-label">Easy</span>
          <span className="fsrs-btn-interval">8.5 days</span>
          <span className="fsrs-btn-key">Key 4</span>
        </button>
      </div>

      {/* Bottom Utility Tools & Shortcuts */}
      <div className="fsrs-bottom-tools">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="btn-fsrs-utility"
            style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
            title="Revert previous card rating (Key Z)"
          >
            <RotateCcw size={14} />
            <span>Undo (Z)</span>
          </button>

          {onAudioPronounce && (
            <button onClick={onAudioPronounce} className="btn-fsrs-utility" title="Listen to question">
              <Volume2 size={14} />
              <span>Pronounce</span>
            </button>
          )}

          {onBuryCard && (
            <button onClick={onBuryCard} className="btn-fsrs-utility" title="Bury card until tomorrow">
              <EyeOff size={14} />
              <span>Bury Card</span>
            </button>
          )}
        </div>

        <div className="keycap-hint">
          <span className="keycap">Space</span> Flip
          <span style={{ margin: '0 4px', opacity: 0.4 }}>•</span>
          <span className="keycap">1-4</span> Rate
          <span style={{ margin: '0 4px', opacity: 0.4 }}>•</span>
          <span className="keycap">Z</span> Undo
        </div>
      </div>
    </div>
  );
};
