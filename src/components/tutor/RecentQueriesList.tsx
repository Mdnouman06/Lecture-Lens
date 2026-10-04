import React from 'react';
import { History, Search } from 'lucide-react';
import type { RecentQuery } from '../../types/lecture';

interface RecentQueriesListProps {
  queries?: RecentQuery[];
  onSelectQuery: (query: string) => void;
}

export const RecentQueriesList: React.FC<RecentQueriesListProps> = ({
  queries = [
    { id: 'q1', query: 'LTP Calcium cascade', timestampDisplay: '2h ago' },
    { id: 'q2', query: 'Bloch sphere state vector derivation', timestampDisplay: 'Yesterday' },
    { id: 'q3', query: 'IS-LM central bank reaction function', timestampDisplay: '3d ago' },
    { id: 'q4', query: 'ATP synthase F0-F1 rotor mechanism', timestampDisplay: 'Oct 24' },
  ],
  onSelectQuery,
}) => {
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
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
          Recent Semantic Queries
        </h3>
        <History size={16} style={{ color: 'var(--color-on-surface-variant)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {queries.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => onSelectQuery(q.query)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-container-low, #F4F2FD)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Search size={14} style={{ color: 'var(--color-on-surface-variant)', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--color-on-surface)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {q.query}
              </span>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '10px',
                color: 'var(--color-on-surface-variant)',
                flexShrink: 0,
                marginLeft: '8px',
              }}
            >
              {q.timestampDisplay}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
