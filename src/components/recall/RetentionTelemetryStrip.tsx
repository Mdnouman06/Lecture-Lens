import React from 'react';
import { Flame, Clock, Brain, TrendingUp } from 'lucide-react';

interface RetentionTelemetryStripProps {
  selectedCourse: string;
  onSelectCourse: (course: string) => void;
  dueCount?: number;
  streakDays?: number;
  stability?: number;
  courseLabel?: string;
}

export const RetentionTelemetryStrip: React.FC<RetentionTelemetryStripProps> = ({
  selectedCourse,
  onSelectCourse,
  dueCount = 0,
  streakDays = 1,
  stability,
  courseLabel,
}) => {
  const courses = [
    { id: 'ALL', label: 'All Decks', count: dueCount },
    ...(courseLabel && courseLabel !== 'ALL'
      ? [{ id: courseLabel, label: courseLabel, count: dueCount }]
      : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="retention-strip">
        {/* Due Cards */}
        <div className="telemetry-card">
          <div className="telemetry-icon-box due">
            <Clock size={22} strokeWidth={1.75} />
          </div>
          <div className="telemetry-meta">
            <span className="telemetry-label">Queue Progress</span>
            <span className="telemetry-value">{dueCount} Cards Ready</span>
            <span className="telemetry-sub">
              {dueCount > 0 ? `~${Math.max(1, Math.round(dueCount * 0.5))} min estimated session` : 'Queue up to date'}
            </span>
          </div>
        </div>

        {/* Study Streak */}
        <div className="telemetry-card">
          <div className="telemetry-icon-box streak">
            <Flame size={24} strokeWidth={2} className="animate-glow-flame" />
          </div>
          <div className="telemetry-meta">
            <span className="telemetry-label">Study Session</span>
            <span className="telemetry-value" style={{ color: '#ea580c' }}>
              {streakDays > 1 ? `${streakDays} Days 🔥` : 'Active Session 🔥'}
            </span>
            <span className="telemetry-sub">FSRS Spaced Repetition</span>
          </div>
        </div>

        {/* Memory Stability */}
        <div className="telemetry-card">
          <div className="telemetry-icon-box stability">
            <Brain size={22} strokeWidth={1.75} />
          </div>
          <div className="telemetry-meta">
            <span className="telemetry-label">Memory Stability</span>
            <span className="telemetry-value" style={{ color: '#047857' }}>
              {stability !== undefined ? `${stability}%` : 'FSRS Active'}
            </span>
            <span className="telemetry-sub">FSRS v4.5 Optimized</span>
          </div>
        </div>

        {/* FSRS Retention Decay Curve SVG */}
        <div className="retention-decay-box">
          <div className="decay-curve-header">
            <span className="decay-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={13} strokeWidth={2} color="var(--color-primary)" />
              Retention Decay Curve
            </span>
            <span className="decay-badge">90% Target</span>
          </div>
          <svg viewBox="0 0 200 48" style={{ width: '100%', height: '42px', overflow: 'visible' }}>
            <defs>
              <linearGradient id="decayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Target 90% dashed reference line */}
            <line x1="0" y1="12" x2="200" y2="12" stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
            <text x="160" y="10" fontSize="8" fill="#10b981" fontWeight="600" fontFamily="monospace">90%</text>

            {/* Decay curve area fill */}
            <path
              d="M 0,2 Q 60,18 120,26 T 200,34 L 200,48 L 0,48 Z"
              fill="url(#decayGrad)"
            />
            {/* Decay curve stroke line */}
            <path
              d="M 0,2 Q 60,18 120,26 T 200,34"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Current review point */}
            <circle cx="95" cy="22" r="4" fill="#3525cd" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Course Filter Pills */}
      <div className="deck-meta-bar">
        <div className="deck-filter-pills">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCourse(c.id)}
              className={`filter-pill ${selectedCourse === c.id ? 'is-active' : ''}`}
            >
              {c.label} ({c.count})
            </button>
          ))}
        </div>
        <div className="queue-counter-tag">
          FSRS-4.5 INTERVAL LOAD BALANCED
        </div>
      </div>
    </div>
  );
};
