import React from 'react';
import { Zap, MessageSquare, Layers } from 'lucide-react';
import type { Lecture, StudyNotes } from '../../types/lecture';

interface BottomIntelligenceDockProps {
  lecture?: Lecture;
  notes?: StudyNotes | null;
  onOpenTutor?: () => void;
  onOpenFlashcards?: () => void;
}

export const BottomIntelligenceDock: React.FC<BottomIntelligenceDockProps> = ({
  lecture,
  notes,
  onOpenTutor,
  onOpenFlashcards,
}) => {
  const cardCount = lecture?.flashcards?.length || notes?.keyConcepts?.length || 0;
  const primaryConcept = notes?.keyConcepts?.[0] || lecture?.concepts?.[0];

  const isDemoNeuro = lecture?.id === 'lec-neuro-301-14';
  const effectiveCourse = (lecture?.courseCode && lecture.courseCode !== 'ALL' && (isDemoNeuro || lecture.courseCode !== 'NEURO 301'))
    ? lecture.courseCode
    : (isDemoNeuro ? 'NEURO 301' : 'General');

  const relevanceTitle = notes?.examRelevance
    ? 'EXAM RELEVANCE ANALYSIS'
    : 'LECTURE INTELLIGENCE';

  let relevanceDescription = '';
  if (notes?.examRelevance) {
    if (isDemoNeuro) {
      relevanceDescription = notes.examRelevance;
    } else {
      relevanceDescription = notes.examRelevance
        .replace(/\bNEURO\s*301\b/gi, effectiveCourse !== 'General' ? effectiveCourse : '')
        .replace(/\s{2,}/g, ' ')
        .replace(/based on\s+lecture transcript/i, 'based on lecture transcript')
        .trim();
    }
  } else if (primaryConcept) {
    const courseSuffix = effectiveCourse !== 'General' && effectiveCourse !== 'ALL' ? ` for ${effectiveCourse}` : '';
    relevanceDescription = `${primaryConcept.term} identified as high-yield concept${courseSuffix}.`;
  } else {
    relevanceDescription = `Synthesized key concepts for ${lecture?.title || 'active recall'}.`;
  }

  return (
    <div className="docked-bottom-dock" aria-label="Exam Correlation Intelligence">
      <div className="intelligence-dock-pill">
        {/* Left: Exam Relevance Badge & Match Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-fixed)',
              color: 'var(--color-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={18} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary-container)' }}>
              <span>{relevanceTitle}</span>
              {cardCount > 0 && (
                <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>
                  • {cardCount} Study Items
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-on-surface)', margin: 0, fontWeight: 500 }}>
              {relevanceDescription}
            </p>
          </div>
        </div>

        {/* Right: Quick Study Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            className="btn-secondary-action"
            onClick={onOpenTutor}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
          >
            <MessageSquare size={14} color="#0284c7" />
            <span>Ask Tutor</span>
          </button>

          <button
            className="btn-primary-cta"
            onClick={onOpenFlashcards}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px' }}
          >
            <Layers size={14} />
            <span>Study Cards {cardCount > 0 ? `(${cardCount})` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomIntelligenceDock;
