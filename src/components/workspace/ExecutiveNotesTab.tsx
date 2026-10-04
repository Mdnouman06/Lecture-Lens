import React from 'react';
import { Sparkles, Clock, BookOpen, Quote, Layers } from 'lucide-react';
import type { StudyNotes } from '../../types/lecture';

interface ExecutiveNotesTabProps {
  notes: StudyNotes;
  onSeek: (seconds: number) => void;
}

export const ExecutiveNotesTab: React.FC<ExecutiveNotesTabProps> = ({ notes, onSeek }) => {
  const concepts = notes.keyConcepts || [];
  const featuredConcept = concepts.find((c) => c.importance === 'critical') || concepts[0];
  const anchorConcepts = concepts.slice(0, 3);

  const parseTimestampSeconds = (ts?: string): number | null => {
    if (!ts) return null;
    const parts = ts.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Section 01: Executive Abstract */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-container-highest)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-on-surface-variant)',
                fontWeight: 600,
              }}
            >
              SEC 01
            </span>
            <h3 style={{ fontSize: 'var(--text-title)', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
              Executive Abstract & Core Synthesis
            </h3>
          </div>

          {featuredConcept?.timestamp && (
            <button
              onClick={() => {
                const secs = parseTimestampSeconds(featuredConcept.timestamp);
                if (secs !== null) onSeek(secs);
              }}
              className="timestamp-badge"
              title={`Jump to ${featuredConcept.timestamp} in audio`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Clock size={12} />
              <span>[{featuredConcept.timestamp}]</span>
            </button>
          )}
        </div>

        <p
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--color-on-surface)',
            lineHeight: 1.65,
            margin: 0,
            whiteSpace: 'pre-line',
          }}
        >
          {notes.summary || 'No executive abstract available for this lecture.'}
        </p>
      </div>

      {/* Featured Lecture Anchor Callout Card - Grounded in current lecture's critical concept */}
      {featuredConcept && (
        <div
          style={{
            background: 'var(--color-surface-container-low)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-md)',
            borderLeft: '4px solid var(--color-primary-container)',
            display: 'flex',
            gap: 'var(--space-md)',
            alignItems: 'flex-start',
          }}
        >
          <Quote size={24} color="var(--color-primary-container)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontSize: 'var(--text-micro)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary-container)' }}>
              Core Anchor • {featuredConcept.term}
            </span>
            <p style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--color-on-surface)', fontStyle: 'italic', margin: '4px 0 6px' }}>
              "{featuredConcept.definition}"
            </p>
            {notes.examRelevance && (
              <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.5 }}>
                {notes.examRelevance}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Conceptual Anchors extracted from this lecture */}
      {anchorConcepts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <h4 style={{ fontSize: 'var(--text-label)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-on-surface-variant)', margin: 0 }}>
            {anchorConcepts.length} Core Conceptual Anchors
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-sm)' }}>
            {anchorConcepts.map((concept, index) => {
              const iconColors = ['var(--color-primary-container)', '#0284c7', '#059669', '#d97706'];
              const color = iconColors[index % iconColors.length];
              const IconComponent = index === 0 ? Sparkles : index === 1 ? BookOpen : Layers;

              return (
                <div
                  key={concept.id || `anchor-${index}`}
                  style={{
                    padding: 'var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color }}>
                        <IconComponent size={16} />
                        <strong style={{ fontSize: 'var(--text-label)' }}>{concept.term}</strong>
                      </div>
                      {concept.timestamp && (
                        <button
                          onClick={() => {
                            const secs = parseTimestampSeconds(concept.timestamp);
                            if (secs !== null) onSeek(secs);
                          }}
                          className="timestamp-badge"
                          style={{ fontSize: '10px', padding: '1px 4px' }}
                          title={`Seek to ${concept.timestamp}`}
                        >
                          [{concept.timestamp}]
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.5 }}>
                      {concept.definition}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveNotesTab;
