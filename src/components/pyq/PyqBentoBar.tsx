/**
 * PyqBentoBar Component
 * Renders the top 4-card metric strip for PYQ intelligence.
 * Strictly data-driven: displays "Insufficient data" or zero-states when metrics
 * cannot be truthfully derived from real uploaded papers.
 */

import React from 'react';
import { Target, CheckCircle2, Flame, Award } from 'lucide-react';

interface PyqBentoBarProps {
  predictedScore?: string;
  predictedGrade?: string;
  confidencePercent?: number;
  masteredCount?: number;
  totalPyqCount?: number;
  highYieldHotspots?: number;
  syllabusAlignmentPercent?: number;
}

export const PyqBentoBar: React.FC<PyqBentoBarProps> = ({
  predictedScore,
  predictedGrade,
  confidencePercent,
  masteredCount = 0,
  totalPyqCount = 0,
  highYieldHotspots = 0,
  syllabusAlignmentPercent,
}) => {
  const masteryPercent = totalPyqCount > 0 ? Math.round((masteredCount / totalPyqCount) * 100) : 0;

  return (
    <div className="pyq-bento-grid">
      {/* 1. Predicted Exam Score */}
      <div className="pyq-bento-card">
        <div className="pyq-bento-card-header">
          <div className="pyq-bento-icon-wrapper indigo">
            <Award size={20} strokeWidth={1.5} />
          </div>
          {confidencePercent != null ? (
            <span className="pyq-bento-badge positive">+{confidencePercent}% Confidence</span>
          ) : (
            <span className="pyq-bento-badge neutral">Pending Practice</span>
          )}
        </div>
        <div className="pyq-bento-value">
          {predictedScore ? (
            <>
              {predictedScore} {predictedGrade && <span>{predictedGrade}</span>}
            </>
          ) : (
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
              Insufficient data
            </span>
          )}
        </div>
        <div className="pyq-bento-label">Predicted Exam Score</div>
        <div className="pyq-bento-subtext">
          {predictedScore
            ? 'Estimated from recurring topic mastery'
            : 'Requires completed practice drills or multi-year analysis'}
        </div>
        <div className="pyq-bento-progress-track">
          <div
            className="pyq-bento-progress-fill"
            style={{ width: predictedScore || '0%', background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }}
          />
        </div>
      </div>

      {/* 2. Mastered PYQs */}
      <div className="pyq-bento-card">
        <div className="pyq-bento-card-header">
          <div className="pyq-bento-icon-wrapper emerald">
            <CheckCircle2 size={20} strokeWidth={1.5} />
          </div>
          <span className="pyq-bento-badge positive">
            {totalPyqCount > 0 ? `${masteryPercent}% Complete` : 'No Questions'}
          </span>
        </div>
        <div className="pyq-bento-value">
          {totalPyqCount > 0 ? (
            <>
              {masteredCount} <span style={{ color: '#059669' }}>/ {totalPyqCount}</span>
            </>
          ) : (
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
              0 / 0
            </span>
          )}
        </div>
        <div className="pyq-bento-label">Mastered Question Archetypes</div>
        <div className="pyq-bento-subtext">
          {totalPyqCount > 0
            ? `Extracted from ${totalPyqCount} question${totalPyqCount === 1 ? '' : 's'} in uploaded papers`
            : 'Upload past papers to index question archetypes'}
        </div>
        <div className="pyq-bento-progress-track">
          <div
            className="pyq-bento-progress-fill"
            style={{ width: `${masteryPercent}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
          />
        </div>
      </div>

      {/* 3. High-Yield Hotspots */}
      <div className="pyq-bento-card">
        <div className="pyq-bento-card-header">
          <div className="pyq-bento-icon-wrapper amber">
            <Flame size={20} strokeWidth={1.5} />
          </div>
          <span className="pyq-bento-badge neutral">
            {highYieldHotspots > 0 ? '≥ 2x Recurrence' : 'No Recurrence Yet'}
          </span>
        </div>
        <div className="pyq-bento-value">
          {highYieldHotspots > 0 ? (
            <>
              {highYieldHotspots} <span style={{ color: '#b45309' }}>Hotspots</span>
            </>
          ) : (
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
              0 Hotspots
            </span>
          )}
        </div>
        <div className="pyq-bento-label">High-Yield Exam Archetypes</div>
        <div className="pyq-bento-subtext">
          {highYieldHotspots > 0
            ? 'Recurring topics identified across uploaded exam papers'
            : 'Repeated topics across exam years will appear here'}
        </div>
        <div className="pyq-bento-progress-track">
          <div
            className="pyq-bento-progress-fill"
            style={{ width: `${Math.min(highYieldHotspots * 25, 100)}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
          />
        </div>
      </div>

      {/* 4. Syllabus Alignment */}
      <div className="pyq-bento-card">
        <div className="pyq-bento-card-header">
          <div className="pyq-bento-icon-wrapper teal">
            <Target size={20} strokeWidth={1.5} />
          </div>
          <span className="pyq-bento-badge positive">
            {syllabusAlignmentPercent != null ? 'Direct Overlap' : 'Pending Match'}
          </span>
        </div>
        <div className="pyq-bento-value">
          {syllabusAlignmentPercent != null ? (
            `${syllabusAlignmentPercent}%`
          ) : (
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
              Insufficient data
            </span>
          )}
        </div>
        <div className="pyq-bento-label">Syllabus & Lecture Alignment</div>
        <div className="pyq-bento-subtext">
          {syllabusAlignmentPercent != null
            ? 'Core objectives covered in active notes'
            : 'Correlate with course syllabus or lecture notes'}
        </div>
        <div className="pyq-bento-progress-track">
          <div
            className="pyq-bento-progress-fill"
            style={{
              width: syllabusAlignmentPercent != null ? `${syllabusAlignmentPercent}%` : '0%',
              background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
