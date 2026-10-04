import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { KnowledgeScope } from '../../types/lecture';

interface KnowledgeScopeFilterProps {
  scope: KnowledgeScope;
  onChangeScope: (scope: KnowledgeScope) => void;
}

export const KnowledgeScopeFilter: React.FC<KnowledgeScopeFilterProps> = ({
  scope,
  onChangeScope,
}) => {
  const handleToggle = (key: keyof KnowledgeScope) => {
    onChangeScope({
      ...scope,
      [key]: !scope[key],
    });
  };

  const handleSelectAll = () => {
    const allSelected =
      scope.enrolledCourses &&
      scope.neuro301Transcripts &&
      scope.phys402Formulas &&
      scope.pastExamRubrics;

    onChangeScope({
      enrolledCourses: !allSelected,
      neuro301Transcripts: !allSelected,
      phys402Formulas: !allSelected,
      pastExamRubrics: !allSelected,
    });
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
            Knowledge Scope
          </h3>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          style={{
            fontSize: '12px',
            color: 'var(--color-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            padding: 0,
          }}
        >
          Select All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Item 1 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--color-surface-container-low, #F4F2FD)',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={scope.enrolledCourses}
              onChange={() => handleToggle('enrolledCourses')}
              style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                All 4 Enrolled Courses
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                Full syllabus indexing
              </span>
            </div>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              color: 'var(--color-on-surface-variant)',
              background: 'var(--color-surface-container-high)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            4 Co.
          </span>
        </label>

        {/* Item 2 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--color-surface-container-low, #F4F2FD)',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={scope.neuro301Transcripts}
              onChange={() => handleToggle('neuro301Transcripts')}
              style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                Course Lecture Transcripts
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                faster-whisper STT & Slide Notes
              </span>
            </div>
          </div>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-tertiary-fixed-dim, #4EDEA3)',
            }}
          />
        </label>

        {/* Item 3 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--color-surface-container-low, #F4F2FD)',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={scope.phys402Formulas}
              onChange={() => handleToggle('phys402Formulas')}
              style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                Formula Decks & Derivations
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                Equations & Applied Concepts
              </span>
            </div>
          </div>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-secondary-container, #39B8FD)',
            }}
          />
        </label>

        {/* Item 4 */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--color-surface-container-low, #F4F2FD)',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={scope.pastExamRubrics}
              onChange={() => handleToggle('pastExamRubrics')}
              style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                Past 5-Year Exam Rubrics
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                2019-2024 Solution Keys
              </span>
            </div>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              color: 'var(--color-primary)',
              background: 'var(--color-primary-fixed)',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            PYQ
          </span>
        </label>
      </div>
    </div>
  );
};
