import React from 'react';
import {
  Play,
  Layers,
  MessageSquare,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import type { ActiveView } from '../../types/navigation';
import type { Lecture } from '../../types/lecture';
import { useAuth } from '../../context/AuthContext';

interface WelcomeBannerProps {
  onNavigate: (view: ActiveView) => void;
  onResumeLecture?: () => void;
  lectures?: Lecture[];
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onNavigate,
  onResumeLecture,
  lectures = [],
}) => {
  const { user } = useAuth();

  const handleResume = () => {
    if (onResumeLecture) {
      onResumeLecture();
    } else {
      onNavigate('workspace');
    }
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    null;
  const greeting = userName ? `Welcome back, ${userName} 👋` : 'Welcome back 👋';

  const totalLectures = lectures.length;
  const activeLecture = lectures[0] || null;
  const totalCards = lectures.reduce((acc, l) => acc + (l.flashcards?.length || 0), 0);

  const subtitleText = totalLectures > 0
    ? `Your study vault contains ${totalLectures} lecture${totalLectures === 1 ? '' : 's'}. Synthesize structured notes, review active-recall flashcards, or consult your local AI tutor.`
    : 'Upload your lecture slide decks, audio recordings, or YouTube links to start synthesizing structured notes and quizzes.';

  return (
    <div className="welcome-banner">
      {/* Ambient Radial Gradient Flare */}
      <div className="welcome-ambient-glow" />

      <div className="welcome-content">
        {/* Top Meta Bar */}
        <div className="welcome-top-bar">
          <div className="sync-status-badge">
            <span className="status-dot connected animate-pulse-subtle" />
            <span>Local AI Active • FSRS 4.5 Spaced Repetition</span>
          </div>

          <div className="readiness-badge">
            <BookOpen size={14} />
            <span>Study Vault: {totalLectures} Lecture{totalLectures === 1 ? '' : 's'} Indexed</span>
          </div>
        </div>

        {/* Hero Greeting & Academic Scope */}
        <div className="welcome-headline-group">
          <h1 className="welcome-title">{greeting}</h1>
          <p className="welcome-subtitle">{subtitleText}</p>
        </div>

        {/* Quick Action Button Stack */}
        <div className="welcome-actions-row">
          {/* Primary Action Button */}
          <button
            className="action-btn primary"
            onClick={handleResume}
            aria-label="Resume active lecture recording"
          >
            <Play size={16} fill="#ffffff" />
            <span>Resume Active Lecture</span>
            {activeLecture?.duration && (
              <span className="action-subtext">({activeLecture.duration})</span>
            )}
          </button>

          {/* Review Flashcards Button with Dynamic Badge */}
          <button
            className="action-btn"
            onClick={() => onNavigate('flashcards')}
            aria-label="Review due flashcards"
          >
            <Layers size={16} color="var(--color-primary-container)" />
            <span>Review Flashcards</span>
            <span className="action-badge">
              {totalCards > 0 ? `${totalCards} cards` : 'FSRS Deck'}
            </span>
          </button>

          {/* Ask AI Tutor Button */}
          <button
            className="action-btn"
            onClick={() => onNavigate('tutor')}
            aria-label="Ask questions to local AI Tutor"
          >
            <MessageSquare size={16} color="#0ea5e9" />
            <span>Ask Tutor</span>
          </button>

          {/* Import PYQ Button */}
          <button
            className="action-btn"
            onClick={() => onNavigate('pyq')}
            aria-label="Import past year exam questions"
          >
            <FileSpreadsheet size={16} color="#10b981" />
            <span>Import PYQ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
