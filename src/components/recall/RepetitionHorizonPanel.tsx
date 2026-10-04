import React from 'react';
import { Calendar, BarChart2, ShieldCheck } from 'lucide-react';

export const RepetitionHorizonPanel: React.FC = () => {
  const horizonBars = [
    { label: 'Today', count: 28, max: 35, color: '#4f46e5' },
    { label: 'Tomorrow', count: 14, max: 35, color: '#3b82f6' },
    { label: '+3 Days', count: 9, max: 35, color: '#0ea5e9' },
    { label: '+7 Days', count: 22, max: 35, color: '#8b5cf6' },
    { label: '+14 Days', count: 11, max: 35, color: '#06b6d4' },
    { label: '+30 Days', count: 34, max: 35, color: '#6366f1' },
  ];

  const difficultyDistribution = [
    { label: 'New (Unseen)', percent: 14, color: '#3b82f6' },
    { label: 'Learning', percent: 28, color: '#f59e0b' },
    { label: 'Review', percent: 42, color: '#4f46e5' },
    { label: 'Mastered', percent: 16, color: '#10b981' },
  ];

  return (
    <div className="repetition-horizon-card">
      <div className="horizon-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} strokeWidth={2} color="var(--color-primary)" />
          <span className="horizon-title">Repetition Horizon</span>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '6px',
            background: '#f1effa',
            color: 'var(--color-on-surface-variant)',
          }}
        >
          30-Day Forecast
        </span>
      </div>

      {/* Review Load Bar Histogram */}
      <div className="horizon-bars-list">
        {horizonBars.map((bar) => {
          const fillWidth = Math.round((bar.count / bar.max) * 100);
          return (
            <div key={bar.label} className="horizon-bar-row">
              <span className="horizon-bar-label">{bar.label}</span>
              <div className="horizon-track">
                <div
                  className="horizon-fill"
                  style={{
                    width: `${fillWidth}%`,
                    background: bar.color,
                  }}
                />
              </div>
              <span className="horizon-bar-val">{bar.count}</span>
            </div>
          );
        })}
      </div>

      {/* Difficulty Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart2 size={14} />
          Cohort Mastery Distribution
        </span>
        <div className="difficulty-pie-legend">
          {difficultyDistribution.map((item) => (
            <div key={item.label} className="difficulty-chip">
              <span className="chip-dot" style={{ background: item.color }} />
              <span style={{ color: 'var(--color-on-surface-variant)' }}>{item.label}:</span>
              <strong style={{ color: 'var(--color-on-surface)' }}>{item.percent}%</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithm Health Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '11px',
          color: '#047857',
        }}
      >
        <ShieldCheck size={18} strokeWidth={2} />
        <div>
          <strong style={{ display: 'block', fontSize: '12px' }}>FSRS Retention Target: 91.8%</strong>
          <span>Next neural weight optimization in 2h 45m</span>
        </div>
      </div>
    </div>
  );
};
