/**
 * PyqQuestionInspector Component
 * Renders high-yield question deep-dive with academic grading criteria rubric,
 * verified student pitfall & mark loss analysis, and correlated lecture jump CTA.
 * Strictly data-driven: never introduces hardcoded neuroscience topics or fake probabilities.
 */

import React from 'react';
import type { PyqQuestionItem } from '../../types/lecture';
import {
  HelpCircle,
  AlertTriangle,
  PlayCircle,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface PyqQuestionInspectorProps {
  question: PyqQuestionItem;
  allQuestions?: PyqQuestionItem[];
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  onJumpToLecture?: (lectureId: string, seekSecs: number) => void;
}

export const PyqQuestionInspector: React.FC<PyqQuestionInspectorProps> = ({
  question,
  allQuestions = [],
  selectedIndex = 0,
  onSelectIndex,
  onJumpToLecture,
}) => {
  const rubrics = question.rubricCriteria || [];
  const pitfall = question.commonPitfall;
  const correlated = question.correlatedLecture;

  const recurrenceDisplay =
    question.recurrenceYears && question.recurrenceYears.length > 1
      ? `Recurred in ${question.recurrenceYears.join(' + ')}`
      : question.recurrenceYears && question.recurrenceYears.length === 1
      ? `Appeared in ${question.recurrenceYears[0]}`
      : question.year
      ? `Appeared in ${question.year}`
      : 'Exam Question';

  return (
    <div className="pyq-inspector-card" id="pyq-question-inspector">
      {/* Question Selector Tabs if multiple questions exist */}
      {allQuestions.length > 1 && onSelectIndex && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
          {allQuestions.map((q, idx) => (
            <button
              key={q.id || idx}
              type="button"
              className={`pyq-pill ${selectedIndex === idx ? 'active' : ''}`}
              onClick={() => onSelectIndex(idx)}
              style={{ fontSize: '12px', padding: '4px 10px', whiteSpace: 'nowrap' }}
            >
              {q.questionNumber || `Q${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Top Header */}
      <div className="pyq-inspector-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="pyq-qnumber-badge">
            <HelpCircle size={18} color="#4f46e5" strokeWidth={1.5} />
            {question.questionNumber || (question.year ? `${question.year} · Q${selectedIndex + 1}` : `Question ${selectedIndex + 1}`)}
          </span>
          {question.unit && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#475569',
              }}
            >
              {question.unit}
            </span>
          )}
          <span className="pyq-marks-pill">{question.marks || 10} MARKS</span>
        </div>

        <div className="pyq-recurrence-pill">
          <Award size={13} strokeWidth={2} />
          {recurrenceDisplay}
          {question.midtermProbability != null && ` • ${question.midtermProbability}% Exam Prob.`}
        </div>
      </div>

      {/* Problem Statement */}
      <div className="pyq-problem-statement">
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', marginBottom: '6px', textTransform: 'uppercase' }}>
          Exam Problem Statement
        </div>
        {question.questionText || question.problemStatement}
      </div>

      {/* Grading Criteria (Rubric Breakdown) */}
      {rubrics && rubrics.length > 0 && (
        <div className="pyq-rubric-box">
          <div className="pyq-rubric-title">
            <Layers size={16} strokeWidth={1.5} />
            Academic Grading Rubric ({rubrics.length}-Point Criteria)
          </div>

          {rubrics.map((step) => (
            <div key={step.stepNumber} className="pyq-rubric-step">
              <div className="pyq-step-circle">{step.stepNumber}</div>
              <div className="pyq-step-content">
                <div className="pyq-step-heading">{step.title}</div>
                <div className="pyq-step-desc">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Common Pitfall & Mark Loss Analysis */}
      {pitfall && (
        <div className="pyq-pitfall-card">
          <AlertTriangle size={20} className="pyq-pitfall-icon" strokeWidth={1.5} />
          <div className="pyq-pitfall-content">
            <div className="pyq-pitfall-title">
              Common Pitfall Alert{pitfall.markLossPercent != null ? ` • ${pitfall.markLossPercent}% Mark Loss Rate` : ''}
            </div>
            <div className="pyq-pitfall-desc">
              {pitfall.title ? <strong>{pitfall.title}: </strong> : null}
              {pitfall.description}
            </div>
          </div>
        </div>
      )}

      {/* Correlated Lecture Jump CTA */}
      {correlated && correlated.title ? (
        <div className="pyq-jump-card">
          <div className="pyq-jump-left">
            <PlayCircle size={22} color="#0284c7" strokeWidth={1.5} />
            <div>
              <div className="pyq-jump-label">Correlated Lecture Source</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1B22' }}>
                {correlated.title}
              </div>
              {correlated.timecodeDisplay && (
                <span className="pyq-jump-timecode">
                  {correlated.timecodeDisplay}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="adv-btn-primary"
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
            onClick={() =>
              onJumpToLecture?.(
                correlated.lectureId || 'lec-1',
                correlated.seekSeconds || 0
              )
            }
          >
            Jump to Lecture
            <ArrowRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <PlayCircle size={16} color="#94a3b8" />
          <span>No correlated lecture audio segment linked to this question yet.</span>
        </div>
      )}
    </div>
  );
};
