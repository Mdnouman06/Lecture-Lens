import React, { useState } from 'react';
import { Layers, ZoomIn, X } from 'lucide-react';
import type { Lecture, StudyNotes } from '../../types/lecture';

interface SlideArtifactsTabProps {
  lecture?: Lecture;
  notes?: StudyNotes | null;
}

export const SlideArtifactsTab: React.FC<SlideArtifactsTabProps> = ({ lecture, notes }) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const concepts = notes?.keyConcepts || lecture?.concepts || [];
  const primaryConcept = concepts[0];

  const artifactItems = concepts.slice(0, 4).map((c, idx) => ({
    num: idx + 1,
    title: c.term,
    tag: c.importance ? c.importance.toUpperCase() : 'CORE',
    desc: c.definition,
  }));

  const displayTitle = lecture?.title || 'Lecture Artifacts';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Visual Concept Reference Card */}
      <div
        style={{
          background: 'var(--color-surface-container-low)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          border: '1px solid var(--color-outline-variant)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary-container)' }}>
              Conceptual Visualization • {lecture?.courseCode || 'Course Material'}
            </span>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)', margin: '2px 0 0' }}>
              {displayTitle}
            </h4>
          </div>

          <button
            onClick={() => setIsZoomOpen(true)}
            className="btn-secondary-action"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
          >
            <ZoomIn size={14} />
            <span>Expand Overview</span>
          </button>
        </div>

        {/* Visual Preview Box */}
        <div
          onClick={() => setIsZoomOpen(true)}
          style={{
            height: '180px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.25) 0%, transparent 60%)',
            }}
          />
          <div style={{ textAlign: 'center', zIndex: 1, padding: '0 20px' }}>
            <Layers size={38} style={{ opacity: 0.9, marginBottom: '8px' }} />
            <div style={{ fontWeight: 600, fontSize: '15px' }}>
              {primaryConcept ? primaryConcept.term : displayTitle}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>
              {primaryConcept ? primaryConcept.definition.slice(0, 100) + '...' : 'Interactive conceptual matrix for active recall and exam preparation'}
            </div>
          </div>
          <span
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            Artifact View
          </span>
        </div>

        <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-on-surface-variant)', lineHeight: 1.5, margin: 0 }}>
          {notes?.summary
            ? notes.summary.slice(0, 240) + '...'
            : 'Structured artifacts and key concept representations mapped directly from this lecture recording.'}
        </p>
      </div>

      {/* Concept Artifact Cards Catalog */}
      {artifactItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <h4 style={{ fontSize: 'var(--text-label)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-on-surface-variant)', margin: 0 }}>
            Extracted Conceptual Artifacts ({artifactItems.length})
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-sm)' }}>
            {artifactItems.map((item) => (
              <div
                key={item.num}
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-sm)',
                  border: '1px solid var(--color-outline-variant)',
                  display: 'flex',
                  gap: 'var(--space-sm)',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--color-primary-container)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  #{item.num}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'rgba(79, 70, 229, 0.1)',
                        color: 'var(--color-primary-container)',
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-xl)',
          }}
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            style={{
              background: 'var(--color-surface-container-lowest)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '700px',
              width: '100%',
              padding: 'var(--space-xl)',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-on-surface-variant)',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 12px', color: 'var(--color-on-surface)' }}>
              {displayTitle}
            </h3>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 16px' }}>
              {notes?.summary || 'Detailed summary and visual concept representation extracted directly from this lecture recording.'}
            </p>

            {primaryConcept && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-container-low)',
                  borderLeft: '4px solid var(--color-primary-container)',
                }}
              >
                <strong>{primaryConcept.term}:</strong> {primaryConcept.definition}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideArtifactsTab;
