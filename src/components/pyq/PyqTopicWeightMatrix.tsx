/**
 * PyqTopicWeightMatrix Component
 * Displays historical topic weight distribution and circular SVG simulation dial.
 * Matches Google Stitch screen 57fae43921be497dac14f898c05ac626.
 * Data-driven: derives topics strictly from uploaded papers without hardcoded mock defaults.
 */

import React from 'react';
import type { TopicWeight } from '../../types/lecture';
import { BarChart3, CheckCircle, Sparkles } from 'lucide-react';

interface PyqTopicWeightMatrixProps {
  weights: TopicWeight[];
  coveragePercent?: number;
}

export const PyqTopicWeightMatrix: React.FC<PyqTopicWeightMatrixProps> = ({
  weights = [],
  coveragePercent,
}) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dialValue = coveragePercent != null ? coveragePercent : (weights.length > 0 ? 100 : 0);
  const strokeDashoffset = circumference - (dialValue / 100) * circumference;

  return (
    <div className="pyq-matrix-card">
      <div className="pyq-archive-header">
        <div className="pyq-archive-title-wrap">
          <BarChart3 size={20} color="#4f46e5" strokeWidth={1.5} />
          <h3 className="pyq-section-title">Topic Weighting Matrix</h3>
        </div>
        <span style={{ fontSize: '11px', color: '#777587', fontWeight: 600 }}>
          {weights.length > 0 ? `${weights.length} TOPICS IDENTIFIED` : 'HISTORICAL EXAMS'}
        </span>
      </div>

      <p style={{ fontSize: '13px', color: '#464555', margin: 0, lineHeight: 1.5 }}>
        Historical weighting analyzed across past examination papers. Prioritize high-frequency
        core syllabus concepts.
      </p>

      {/* Topic Weight Bars */}
      {weights.length > 0 ? (
        <div className="pyq-weights-list">
          {weights.map((topic) => {
            const topicLabel = topic.topic || topic.name;
            const recurrenceCount = topic.appearances || topic.appearanceCount || 1;
            const yearsStr = topic.years && topic.years.length > 0 ? topic.years.join(' + ') : '';

            return (
              <div key={topic.id} className="pyq-weight-item" style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div className="pyq-weight-header" style={{ alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="pyq-weight-title" style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35, fontSize: '13px' }}>
                        {topicLabel}
                      </span>
                      {topic.notesChecked && (
                        <span title="Indexed in notes">
                          <CheckCircle size={14} color="#10b981" strokeWidth={2} />
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>
                      Repeated {recurrenceCount} {recurrenceCount === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                  <span className="pyq-weight-percent" style={{ fontSize: '13px', color: '#1e293b' }}>{topic.weightPercent}%</span>
                </div>

                <div className="pyq-weight-track" style={{ height: '6px', margin: '4px 0' }}>
                  <div
                    className={`pyq-weight-fill ${topic.category || 'good'}`}
                    style={{ width: `${Math.min(100, topic.weightPercent * 2.5)}%` }}
                  />
                </div>

                <div className="pyq-weight-meta" style={{ flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                    {yearsStr ? `Years: ${yearsStr}` : topic.predictedCount || `${recurrenceCount} Qs`}
                  </span>
                  <span className={`pyq-weight-badge ${topic.category || 'good'}`}>
                    {topic.statusLabel || (topic.years && topic.years.length > 1 ? `Recurring (${topic.years.length}x)` : 'Standard Yield')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '13px',
            background: '#f8fafc',
            borderRadius: '12px',
          }}
        >
          No topic weighting data available. Import a PYQ paper to generate topic breakdown.
        </div>
      )}

      {/* Circular Simulation Dial Card */}
      <div className="pyq-dial-box">
        <div className="pyq-dial-svg-wrapper">
          <svg width="80" height="80" viewBox="0 0 80 80">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#818cf8"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="pyq-dial-center-text">
            {coveragePercent != null ? `${coveragePercent}%` : weights.length > 0 ? `${weights.length} Qs` : '--'}
          </div>
        </div>

        <div className="pyq-dial-details">
          <div className="pyq-dial-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#fbbf24" strokeWidth={1.5} />
            Exam Simulation Coverage
          </div>
          <div className="pyq-dial-subtext">
            {coveragePercent != null
              ? `${coveragePercent}% of high-yield exam archetypes are directly grounded and verified in your notes corpus.`
              : weights.length > 0
              ? `${weights.length} core topic archetypes extracted from your uploaded exam paper(s).`
              : 'Upload past exam papers to map syllabus topic distribution.'}
          </div>
        </div>
      </div>
    </div>
  );
};
