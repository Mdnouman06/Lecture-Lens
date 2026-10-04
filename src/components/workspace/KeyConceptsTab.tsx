import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { KeyConcept } from '../../types/lecture';

interface KeyConceptsTabProps {
  concepts: KeyConcept[];
  onSeek: (seconds: number) => void;
}

export const KeyConceptsTab: React.FC<KeyConceptsTabProps> = ({ concepts, onSeek }) => {
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set(['conc-1']));

  const toggleMastery = (id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-title)', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
            Key Concepts & Definitions ({concepts.length})
          </h3>
          <p style={{ fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)', margin: '2px 0 0' }}>
            High-yield core mechanisms extracted for active recall and exam readiness
          </p>
        </div>

        <div style={{ fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)' }}>
          Mastered: <strong style={{ color: 'var(--color-primary-container)' }}>{masteredIds.size} / {concepts.length}</strong>
        </div>
      </div>

      {/* Concept Grid */}
      <div className="concept-grid">
        {concepts.map((concept) => {
          const isMastered = masteredIds.has(concept.id);

          return (
            <div key={concept.id} className="concept-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background:
                      concept.importance === 'critical'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(79, 70, 229, 0.1)',
                    color:
                      concept.importance === 'critical'
                        ? '#dc2626'
                        : 'var(--color-primary-container)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {concept.importance.toUpperCase()}
                </span>

                <button
                  onClick={() => toggleMastery(concept.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isMastered ? '#10b981' : 'var(--color-outline)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                  title={isMastered ? 'Mark unmastered' : 'Mark mastered'}
                >
                  {isMastered ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', margin: '4px 0 2px' }}>
                {concept.term}
              </h4>

              <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-on-surface-variant)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                {concept.definition}
              </p>

              {/* Timestamp & Formula Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  marginTop: '8px',
                  borderTop: '1px solid var(--color-outline-variant)',
                  fontSize: '11px',
                }}
              >
                {concept.timestamp ? (
                  <button
                    onClick={() => {
                      const parts = concept.timestamp!.split(':').map(Number);
                      const secs = (parts[0] || 0) * 60 + (parts[1] || 0);
                      onSeek(secs);
                    }}
                    className="timestamp-badge"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Clock size={11} />
                    <span>[{concept.timestamp}]</span>
                  </button>
                ) : (
                  <span />
                )}

                <span style={{ color: isMastered ? '#059669' : 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                  {isMastered ? 'Mastered' : 'Review Needed'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KeyConceptsTab;
