import React from 'react';
import {
  Activity,
  BookOpen,
  Award,
  Flame,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import type { Lecture } from '../../types/lecture';

interface BentoStatsProps {
  lectures?: Lecture[];
}

export const BentoStats: React.FC<BentoStatsProps> = ({ lectures = [] }) => {
  const totalLectures = lectures.length;
  const audioCount = lectures.filter((l) => l.sourceType === 'audio' || l.hasAudio).length;
  const docCount = lectures.filter((l) => l.sourceType === 'pdf' || l.sourceType === 'transcript').length;

  const totalSegments = lectures.reduce((acc, l) => acc + (l.transcript?.length || 0), 0);
  const transcriptsSynced = lectures.filter((l) => l.transcript && l.transcript.length > 0).length;
  const syncPercentage = totalLectures > 0 ? Math.round((transcriptsSynced / totalLectures) * 100) : 0;

  const notesCount = lectures.filter((l) => l.notes || (l.summary && l.summary.length > 50)).length;
  const totalConcepts = lectures.reduce((acc, l) => acc + (l.concepts?.length || 0), 0);

  const totalCards = lectures.reduce((acc, l) => acc + (l.flashcards?.length || 0), 0);

  const weekDays = [
    { day: 'M', active: true },
    { day: 'T', active: true },
    { day: 'W', active: totalLectures > 0 },
    { day: 'T', active: totalLectures > 0 },
    { day: 'F', active: totalLectures > 0 },
    { day: 'S', active: false },
    { day: 'S', active: false },
  ];

  return (
    <div className="bento-grid" aria-label="Study Metrics Overview">
      {/* Card 1: Study Materials in Vault */}
      <div className="bento-card">
        <div>
          <div className="bento-header">
            <span className="bento-label">Lecture Materials</span>
            <div className="bento-icon-tile indigo">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="bento-metric-large">{totalLectures}</div>
          <div className="bento-subtext">
            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              <ArrowUpRight size={14} /> Vault Active
            </span>
            <span>{audioCount} Audio • {docCount} Docs/Slides</span>
          </div>
        </div>

        {/* Inline SVG Sparkline */}
        <div className="sparkline-wrapper">
          <svg
            viewBox="0 0 160 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0 28 C 25 24, 45 32, 70 18 C 95 6, 120 16, 160 4"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M0 28 C 25 24, 45 32, 70 18 C 95 6, 120 16, 160 4 L 160 36 L 0 36 Z"
              fill="url(#sparklineGrad)"
            />
            <circle cx="160" cy="4" r="3.5" fill="#4f46e5" />
          </svg>
        </div>
      </div>

      {/* Card 2: Transcribed Media */}
      <div className="bento-card">
        <div>
          <div className="bento-header">
            <span className="bento-label">Transcript Segments</span>
            <div className="bento-icon-tile sky">
              <Activity size={18} />
            </div>
          </div>
          <div className="bento-metric-large">{totalSegments}</div>
          <div className="bento-subtext">
            <span>{transcriptsSynced} / {totalLectures} Lectures Transcribed</span>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-on-surface-variant)', marginBottom: '4px' }}>
            <span>Transcripts Synced</span>
            <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{syncPercentage}%</span>
          </div>
          <div style={{ height: '5px', background: 'var(--color-surface-container-highest)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: `${syncPercentage}%`, height: '100%', background: '#0ea5e9', borderRadius: 'var(--radius-full)' }} />
          </div>
        </div>
      </div>

      {/* Card 3: AI Smart Notes */}
      <div className="bento-card">
        <div>
          <div className="bento-header">
            <span className="bento-label">Smart Notes</span>
            <div className="bento-icon-tile emerald">
              <Award size={18} />
            </div>
          </div>
          <div className="bento-metric-large">{notesCount}</div>
          <div className="bento-subtext">
            <span>{totalConcepts > 0 ? `${totalConcepts} Concepts Extracted` : 'Structured Study Units'}</span>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {notesCount > 0 ? 'Local Ollama AI' : 'Ready to Synthesize'}
          </span>
        </div>
      </div>

      {/* Card 4: Recall Flashcards */}
      <div className="bento-card">
        <div>
          <div className="bento-header">
            <span className="bento-label">Recall Flashcards</span>
            <div className="bento-icon-tile amber">
              <Flame size={18} />
            </div>
          </div>
          <div className="bento-metric-large">{totalCards}</div>
          <div className="bento-subtext">
            <span style={{ fontWeight: 600, color: '#d97706' }}>FSRS 4.5 Deck</span>
            <span>available for practice</span>
          </div>
        </div>

        {/* 7-Day Visual Progress Track */}
        <div className="week-pills-row">
          {weekDays.map((w, idx) => (
            <div
              key={idx}
              className={`day-pill ${w.active ? 'completed' : ''}`}
              title={`${w.day}: ${w.active ? 'Study Goal Met' : 'Upcoming Session'}`}
            >
              <span>{w.day}</span>
              {w.active && <Check size={9} strokeWidth={3} style={{ marginTop: '2px' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BentoStats;
