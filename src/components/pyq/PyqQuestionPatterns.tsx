/**
 * PyqQuestionPatterns Component
 * Level B Derived Intelligence: Grouped Recurring Question Patterns.
 * Answers: "What exact types of questions keep coming back, how many times, and in which years?"
 * Maintains 100% traceability to Level A original questions.
 */

import React, { useState } from 'react';
import type { GroupedQuestionPattern, QuestionOccurrence } from '../../types/lecture';
import {
  Flame,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  BookOpen,
} from 'lucide-react';

interface PyqQuestionPatternsProps {
  patterns: GroupedQuestionPattern[];
  onSelectOccurrence?: (occurrence: QuestionOccurrence) => void;
  selectedYear?: string;
}

export const PyqQuestionPatterns: React.FC<PyqQuestionPatternsProps> = ({
  patterns = [],
  onSelectOccurrence,
  selectedYear = 'all',
}) => {
  // Set of pattern IDs that are currently expanded
  const [expandedPatternIds, setExpandedPatternIds] = useState<Set<string>>(
    new Set(patterns.map((p) => p.patternId))
  );

  const toggleExpand = (patternId: string) => {
    setExpandedPatternIds((prev) => {
      const next = new Set(prev);
      if (next.has(patternId)) {
        next.delete(patternId);
      } else {
        next.add(patternId);
      }
      return next;
    });
  };

  // Filter patterns if a specific year filter is active
  const filteredPatterns = selectedYear === 'all'
    ? patterns
    : patterns.filter((p) =>
        p.years.map(String).includes(selectedYear) ||
        p.occurrences.some((occ) => String(occ.year) === selectedYear)
      );

  return (
    <div className="pyq-patterns-card">
      <div className="pyq-archive-header" style={{ alignItems: 'flex-start' }}>
        <div className="pyq-archive-title-wrap">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #ffedd5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={18} color="#ea580c" strokeWidth={2} />
          </div>
          <div>
            <h3 className="pyq-section-title" style={{ margin: 0, fontSize: '15px' }}>
              Recurring Question Patterns
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#777587' }}>
              Grouped semantic archetypes identified across examination papers.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '6px',
              background: '#fff1f2',
              color: '#e11d48',
              letterSpacing: '0.03em',
            }}
          >
            {filteredPatterns.length} {filteredPatterns.length === 1 ? 'PATTERN' : 'PATTERNS'}
          </span>
        </div>
      </div>

      {filteredPatterns.length > 0 ? (
        <div className="pyq-patterns-list">
          {filteredPatterns.map((pattern) => {
            const isExpanded = expandedPatternIds.has(pattern.patternId);
            const isMultiYear = pattern.years.length > 1;

            return (
              <div key={pattern.patternId} className="pyq-pattern-item">
                <div
                  className="pyq-pattern-header"
                  onClick={() => toggleExpand(pattern.patternId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="pyq-pattern-flame">
                        <Flame size={15} color="#ea580c" strokeWidth={2} />
                      </span>
                      <span className="pyq-pattern-topic-badge">{pattern.topic}</span>
                      <span className="pyq-pattern-repeat-badge">
                        Repeated {pattern.occurrenceCount} {pattern.occurrenceCount === 1 ? 'time' : 'times'}
                        {isMultiYear && ` · ${pattern.years.length} years`}
                      </span>
                    </div>

                    <div className="pyq-pattern-canonical-title">
                      {pattern.canonicalQuestion}
                    </div>

                    <div className="pyq-pattern-years-row">
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        Exam Years:
                      </span>
                      {pattern.years.map((yr) => (
                        <span key={String(yr)} className="pyq-pattern-year-tag">
                          {String(yr)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pyq-pattern-toggle-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(pattern.patternId);
                    }}
                    title={isExpanded ? 'Collapse occurrences' : 'Expand occurrences'}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                      {pattern.occurrences.length} {pattern.occurrences.length === 1 ? 'occurrence' : 'occurrences'}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expandable Occurrences Traceability Drawer */}
                {isExpanded && (
                  <div className="pyq-pattern-occurrences-drawer">
                    <div className="pyq-occurrences-header">
                      <Layers size={13} color="#6366f1" />
                      <span>Historical Occurrences in Analyzed Exam Papers</span>
                    </div>

                    <div className="pyq-occurrences-list">
                      {pattern.occurrences.map((occ, idx) => (
                        <div
                          key={`${occ.questionId || occ.questionNumber}-${idx}`}
                          className="pyq-occurrence-row"
                          onClick={() => onSelectOccurrence && onSelectOccurrence(occ)}
                        >
                          <div className="pyq-occurrence-ref-col">
                            <span className="pyq-occurrence-badge">
                              {occ.questionNumber}
                            </span>
                            {occ.unit && (
                              <span className="pyq-occurrence-unit" title={occ.unit}>
                                {occ.unit}
                              </span>
                            )}
                          </div>

                          <div className="pyq-occurrence-text-col">
                            <p className="pyq-occurrence-statement">
                              {occ.questionText}
                            </p>
                          </div>

                          {onSelectOccurrence && (
                            <button
                              type="button"
                              className="pyq-occurrence-inspect-btn"
                              title="Inspect raw question in vault"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectOccurrence(occ);
                              }}
                            >
                              <span>Inspect</span>
                              <ExternalLink size={12} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pyq-empty-patterns">
          <BookOpen size={24} color="#94a3b8" />
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            No recurring question patterns detected for current filter.
          </p>
        </div>
      )}
    </div>
  );
};
