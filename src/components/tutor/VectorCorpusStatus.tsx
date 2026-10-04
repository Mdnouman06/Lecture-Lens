import React from 'react';
import { Database, BookOpen, Layers, Headphones, CheckCircle2 } from 'lucide-react';

export const VectorCorpusStatus: React.FC = () => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '18px',
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.03)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
            Source Corpus Vectorized
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
            38 audio tracks • 2,410 text pages
          </span>
        </div>

        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            background: 'rgba(0, 83, 56, 0.08)',
            color: 'var(--color-tertiary, #005338)',
            padding: '3px 8px',
            borderRadius: '20px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--color-tertiary, #005338)',
            }}
          />
          100% Embedded
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Item 1 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '10px',
            background: 'var(--color-surface-container-low, #F4F2FD)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'var(--color-surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-on-surface-variant)',
                flexShrink: 0,
              }}
            >
              <BookOpen size={15} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Primary Academic Textbook
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                Core Course Literature
              </span>
            </div>
          </div>
          <CheckCircle2 size={16} style={{ color: 'var(--color-tertiary, #005338)', flexShrink: 0 }} />
        </div>

        {/* Item 2 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '10px',
            background: 'var(--color-surface-container-low, #F4F2FD)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'var(--color-surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-on-surface-variant)',
                flexShrink: 0,
              }}
            >
              <Layers size={15} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Course Slides & Concept Decks
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                Slide Decks & Formatted Outlines
              </span>
            </div>
          </div>
          <CheckCircle2 size={16} style={{ color: 'var(--color-tertiary, #005338)', flexShrink: 0 }} />
        </div>

        {/* Item 3 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '10px',
            background: 'var(--color-surface-container-low, #F4F2FD)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'var(--color-surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-on-surface-variant)',
                flexShrink: 0,
              }}
            >
              <Headphones size={15} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Lecture Transcripts (faster-whisper)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                Timestamped lecture audio
              </span>
            </div>
          </div>
          <CheckCircle2 size={16} style={{ color: 'var(--color-tertiary, #005338)', flexShrink: 0 }} />
        </div>
      </div>

      {/* Footer Dimension Chip */}
      <div
        style={{
          background: 'var(--color-surface-container, #EEEDF7)',
          padding: '8px 12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-on-surface-variant)' }}>
          <Database size={14} />
          <span style={{ fontSize: '12px' }}>Vector Space Dimension</span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-on-surface)',
          }}
        >
          1,536-d (HNSW)
        </span>
      </div>
    </div>
  );
};
