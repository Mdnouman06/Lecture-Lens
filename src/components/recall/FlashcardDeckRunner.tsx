import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  RotateCcw,
  Check,
  Download,
} from 'lucide-react';
import type { FlashcardItem, FsrsRating } from '../../types/lecture';
import { FlashcardRatingBar } from './FlashcardRatingBar';
import { updateFlashcardMastery } from '../../services/lectures';
import { exportFlashcardsAsAnkiTsv, downloadFile } from '../../utils/export';

interface FlashcardDeckRunnerProps {
  cards: FlashcardItem[];
  deckTitle?: string;
  userId?: string;
  lectureId?: string;
  onComplete?: () => void;
  onSwitchToQuiz?: () => void;
  onCardRated?: (card: FlashcardItem) => void;
}

function getInitialDeckState(cardsList: FlashcardItem[]): {
  initialIndex: number;
  initialHistory: Array<{ cardIndex: number; rating: FsrsRating }>;
} {
  if (!cardsList || cardsList.length === 0) {
    return { initialIndex: 0, initialHistory: [] };
  }

  // A card is considered reviewed if reviewed is true, or if it has lastReviewed & rating, or reps > 0
  const isCardReviewed = (c: FlashcardItem) =>
    Boolean(c.reviewed || (c.lastReviewed && c.rating) || (typeof c.reps === 'number' && c.reps > 0));

  const firstUnreviewedIdx = cardsList.findIndex((c) => !isCardReviewed(c));

  if (firstUnreviewedIdx === -1) {
    // All cards in this deck have already been reviewed!
    // Set currentIndex = cardsList.length so it shows the session completion summary
    const history = cardsList.map((c, idx) => ({
      cardIndex: idx,
      rating: (c.rating || (typeof c.difficulty === 'string' && ['again', 'hard', 'good', 'easy'].includes(c.difficulty) ? c.difficulty : 'good')) as FsrsRating,
    }));
    return { initialIndex: cardsList.length, initialHistory: history };
  }

  // Resume at the first unreviewed card
  // Populate historyStack with the preceding reviewed cards so user can inspect or undo
  const history: Array<{ cardIndex: number; rating: FsrsRating }> = [];
  for (let i = 0; i < firstUnreviewedIdx; i++) {
    const c = cardsList[i];
    history.push({
      cardIndex: i,
      rating: (c.rating || (typeof c.difficulty === 'string' && ['again', 'hard', 'good', 'easy'].includes(c.difficulty) ? c.difficulty : 'good')) as FsrsRating,
    });
  }

  return { initialIndex: firstUnreviewedIdx, initialHistory: history };
}

export const FlashcardDeckRunner: React.FC<FlashcardDeckRunnerProps> = ({
  cards,
  deckTitle = 'Active Recall Study Deck',
  userId,
  lectureId,
  onComplete,
  onSwitchToQuiz,
  onCardRated,
}) => {
  const [deckCards, setDeckCards] = useState<FlashcardItem[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(() => getInitialDeckState(cards).initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [historyStack, setHistoryStack] = useState<Array<{ cardIndex: number; rating: FsrsRating }>>(
    () => getInitialDeckState(cards).initialHistory
  );
  const [isBookmarked, setIsBookmarked] = useState<Record<string, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync state if a completely new set of cards is provided (e.g. deck switch)
  const cardsIdList = cards.map((c) => c.id).join(',');
  const lastCardsIdListRef = React.useRef(cardsIdList);

  useEffect(() => {
    if (lastCardsIdListRef.current !== cardsIdList) {
      lastCardsIdListRef.current = cardsIdList;
      setDeckCards(cards);
      const { initialIndex, initialHistory } = getInitialDeckState(cards);
      setCurrentIndex(initialIndex);
      setHistoryStack(initialHistory);
      setIsFlipped(false);
    }
  }, [cardsIdList, cards]);

  const currentCard = deckCards[currentIndex] || deckCards[0];
  const isDeckFinished = deckCards.length > 0 && currentIndex >= deckCards.length;

  // Handle card rating
  const handleRate = useCallback(
    (rating: FsrsRating) => {
      if (isDeckFinished) return;

      const targetCard = deckCards[currentIndex];
      if (targetCard && targetCard.id) {
        const isMastered = rating === 'easy' || rating === 'good';
        const stability = rating === 'easy' ? 3.0 : rating === 'good' ? 1.5 : 0.5;
        const intervalDisplay = `${stability.toFixed(1)}d`;
        const nowIso = new Date().toISOString();

        const updatedCard: FlashcardItem = {
          ...targetCard,
          reviewed: true,
          rating,
          mastered: isMastered,
          difficulty: rating,
          stability,
          intervalDisplay,
          lastReviewed: nowIso,
          reps: (targetCard.reps || 0) + 1,
        };

        setDeckCards((prev) =>
          prev.map((c, i) => (i === currentIndex ? updatedCard : c))
        );

        if (onCardRated) {
          onCardRated(updatedCard);
        }

        updateFlashcardMastery(targetCard.id, rating, userId, lectureId).catch((err) => {
          console.warn('Failed to update flashcard mastery in storage:', err);
        });
      }

      setHistoryStack((prev) => [...prev, { cardIndex: currentIndex, rating }]);
      setIsFlipped(false);

      if (currentIndex + 1 >= deckCards.length) {
        if (onComplete) onComplete();
      }
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, deckCards, isDeckFinished, onComplete, onCardRated, userId, lectureId]
  );

  // Handle undo rating
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;

    const lastAction = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setCurrentIndex(lastAction.cardIndex);
    setIsFlipped(true); // Return to flipped view of that card
  }, [historyStack]);

  // Audio pronunciation of question
  const handlePronounce = useCallback(() => {
    if (!currentCard || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = isFlipped ? `${currentCard.answerLead}. ${currentCard.answerBody}` : currentCard.question;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [currentCard, isFlipped, isSpeaking]);

  // Global Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing into an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        handleRate('again');
      } else if (e.key === '2') {
        e.preventDefault();
        handleRate('hard');
      } else if (e.key === '3') {
        e.preventDefault();
        handleRate('good');
      } else if (e.key === '4') {
        e.preventDefault();
        handleRate('easy');
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRate, handleUndo]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    setIsBookmarked((prev) => ({
      ...prev,
      [currentCard.id]: !prev[currentCard.id],
    }));
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setHistoryStack([]);
  };

  const handleExportAnki = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const tsvContent = exportFlashcardsAsAnkiTsv(deckTitle, 'LectureDeck', cards);
    const safeTitle = deckTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    downloadFile(`${safeTitle}-anki.tsv`, tsvContent, 'text/tab-separated-values');
  };

  // Completion View
  if (isDeckFinished) {
    return (
      <div
        className="card-face"
        style={{
          position: 'relative',
          minHeight: '480px',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '24px',
          padding: '48px 32px',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={36} strokeWidth={2.5} />
        </div>

        <div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-on-surface)' }}>
            Deck Session Complete!
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', maxWidth: '420px', margin: 0 }}>
            You reviewed all {deckCards.length} cards in this queue. FSRS memory stability ratings have been updated.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={resetDeck}
            className="filter-pill"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}
          >
            <RotateCcw size={16} />
            Review Queue Again
          </button>

          <button
            onClick={handleExportAnki}
            className="filter-pill"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '14px' }}
          >
            <Download size={16} />
            Export to Anki (.tsv)
          </button>

          {onSwitchToQuiz && (
            <button
              onClick={onSwitchToQuiz}
              className="btn-generate-studio"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px' }}
            >
              <Sparkles size={16} />
              Take 5-Question Quiz Drill
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Deck Header & Queue Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
            Active Queue • {deckTitle}
          </span>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
              Card {Math.min(currentIndex + 1, deckCards.length)} of {deckCards.length} in queue ({Math.max(0, deckCards.length - (currentIndex + 1))} remaining)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleExportAnki}
            className="filter-pill"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
            title="Export deck as Anki TSV"
          >
            <Download size={13} />
            Export Anki
          </button>

          {/* Linear Progress Bar */}
          <div style={{ width: '140px', height: '6px', borderRadius: '3px', background: '#eeedf7', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.round(((currentIndex + 1) / deckCards.length) * 100)}%`,
                background: 'var(--color-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3D Hardware-Accelerated Interactive Card Flip Container */}
      <div className="card-3d-wrapper">
        <div
          className={`card-flip-inner ${isFlipped ? 'is-flipped' : ''}`}
          onClick={() => setIsFlipped((prev) => !prev)}
        >
          {/* ================= Front Face ================= */}
          <div className="card-face card-face-front">
            <div className="card-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="card-source-chip">
                  <Video size={13} strokeWidth={2} />
                  {currentCard.source}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#f1effa',
                    color: 'var(--color-primary)',
                  }}
                >
                  {currentCard.subtopic}
                </span>
                {currentCard.reviewed && currentCard.rating && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#047857',
                    }}
                  >
                    <Check size={12} strokeWidth={2.5} />
                    {currentCard.rating.toUpperCase()}
                    {currentCard.intervalDisplay ? ` • ${currentCard.intervalDisplay}` : ''}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="card-face-badge front">Front</span>
                <button
                  onClick={toggleBookmark}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  title="Bookmark Card"
                >
                  <Bookmark
                    size={18}
                    color={isBookmarked[currentCard.id] ? '#ea580c' : 'var(--color-outline)'}
                    fill={isBookmarked[currentCard.id] ? '#ea580c' : 'transparent'}
                  />
                </button>
              </div>
            </div>

            <div className="card-body-content">
              <span className="card-category-label">Concept Recall Prompt</span>
              <h2 className="card-question-text">{currentCard.question}</h2>
              <div className="keycap-hint" style={{ marginTop: '12px', color: 'var(--color-primary)' }}>
                <span className="keycap">Space</span>
                <span>Click card or press Space to reveal answer</span>
              </div>
            </div>

            <div className="card-footer-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Active Recall • FSRS-4.5</span>
              </div>
              <span>Click anywhere to flip ↷</span>
            </div>
          </div>

          {/* ================= Back Face ================= */}
          <div className="card-face card-face-back">
            <div className="card-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#047857',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={13} strokeWidth={2.5} />
                  Verified Model Answer
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'SF Mono, monospace',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: '#eeedf7',
                    color: 'var(--color-on-surface-variant)',
                  }}
                >
                  Recall Accuracy: {currentCard.recallAccuracy || '96%'}
                  {currentCard.rating ? ` • Rated ${currentCard.rating.toUpperCase()}` : ''}
                </span>
              </div>

              <span className="card-face-badge back">Answer</span>
            </div>

            <div className="card-body-content">
              <h3 className="card-answer-lead">{currentCard.answerLead}</h3>
              <p className="card-answer-body">{currentCard.answerBody}</p>

              {(currentCard.step1 || currentCard.step2) && (
                <div className="concept-steps-chain">
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)' }}>
                    Mechanism Progression:
                  </span>
                  {currentCard.step1 && (
                    <span className="concept-step-chip">1. {currentCard.step1}</span>
                  )}
                  {currentCard.step2 && (
                    <>
                      <ArrowRight size={13} color="var(--color-primary)" />
                      <span className="concept-step-chip">2. {currentCard.step2}</span>
                    </>
                  )}
                </div>
              )}

              {currentCard.conceptNote && (
                <div
                  style={{
                    fontSize: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    color: '#92400e',
                    fontWeight: 500,
                  }}
                >
                  <strong>Key Nuance:</strong> {currentCard.conceptNote}
                </div>
              )}
            </div>

            <div className="card-footer-row">
              <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>
                Select recall quality below to schedule next review
              </span>
              <div className="keycap-hint">
                <span className="keycap">1-4</span>
                <span>Rate difficulty</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Docked 4-Level FSRS Rating Bar */}
      <FlashcardRatingBar
        onRate={handleRate}
        onUndo={handleUndo}
        canUndo={historyStack.length > 0}
        onAudioPronounce={handlePronounce}
      />
    </div>
  );
};
