/**
 * StudyBlockModal Component
 * Modal dialog for inspecting and jumping from scheduled study blocks
 * to relevant notes, FSRS flashcard drills, or AI tutor sessions.
 */

import React from 'react';
import type { StudyBlock } from '../../types/lecture';
import {
  X,
  BookOpen,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  Trash2,
} from 'lucide-react';

interface StudyBlockModalProps {
  block: StudyBlock | null;
  onClose: () => void;
  onNavigateToLecture?: (lectureId: string) => void;
  onNavigateToFlashcards?: () => void;
  onToggleComplete?: (blockId: string, currentStatus: boolean) => void;
  onDeleteBlock?: (blockId: string) => void;
}

const CATEGORY_META = {
  lecture: { label: 'Live Lecture', color: '#3525cd', bg: '#eef2ff' },
  fsrs: { label: 'FSRS Spaced Review', color: '#006591', bg: '#f0f9ff' },
  deep: { label: 'Deep Study Block', color: '#005338', bg: '#ecfdf5' },
  tutor: { label: 'AI Tutor Drill', color: '#4f46e5', bg: '#f5f3ff' },
  exam: { label: 'Exam / Milestone', color: '#ba1a1a', bg: '#fff1f2' },
};

export const StudyBlockModal: React.FC<StudyBlockModalProps> = ({
  block,
  onClose,
  onNavigateToLecture,
  onNavigateToFlashcards,
  onToggleComplete,
  onDeleteBlock,
}) => {
  if (!block) return null;

  const meta = CATEGORY_META[block.category] || CATEGORY_META.deep;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(26, 27, 34, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #c7c4d8',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1effb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: meta.bg,
                color: meta.color,
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: meta.color,
                }}
              />
              {meta.label}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#777587' }}>
              {block.courseCode}
            </span>
            {block.isCompleted && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#ecfdf5',
                  color: '#059669',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: '1px solid #a7f3d0',
                }}
              >
                <CheckCircle2 size={12} color="#059669" />
                Done
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#777587',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: '#1A1B22',
                lineHeight: 1.35,
                textDecoration: block.isCompleted ? 'line-through' : 'none',
                opacity: block.isCompleted ? 0.8 : 1,
              }}
            >
              {block.title}
            </h3>
            {block.isAutofilled && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: '#fff1f2',
                  color: '#e11d48',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: '1px solid #fecdd3',
                }}
              >
                ⚡ Auto-filled by LectureLens to eliminate midterm prep deficit
              </span>
            )}
          </div>

          {/* Time & Duration Info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              background: '#f8f7ff',
              border: '1px solid #e0dbfd',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#777587' }}>Day</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1B22' }}>
                {block.dayLabel}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#777587' }}>Scheduled Time</div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  color: '#1A1B22',
                }}
              >
                {block.timeDisplay}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#777587' }}>Duration</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#4338ca' }}>
                {block.durationHours} hrs
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            {/* Completion Toggle */}
            {onToggleComplete && (
              <button
                type="button"
                className="adv-btn-secondary"
                style={{
                  justifyContent: 'center',
                  background: block.isCompleted ? '#ecfdf5' : '#ffffff',
                  color: block.isCompleted ? '#059669' : '#1A1B22',
                  borderColor: block.isCompleted ? '#a7f3d0' : '#c7c4d8',
                  fontWeight: 600,
                }}
                onClick={() => {
                  onToggleComplete(block.id, !!block.isCompleted);
                }}
              >
                {block.isCompleted ? (
                  <>
                    <CheckCircle2 size={16} color="#059669" />
                    Session Completed • Click to Mark Pending
                  </>
                ) : (
                  <>
                    <Circle size={16} color="#464555" />
                    Mark Session as Completed
                  </>
                )}
              </button>
            )}

            {(block.category === 'lecture' || block.notesId) && (
              <button
                type="button"
                className="adv-btn-primary"
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  onClose();
                  onNavigateToLecture?.(block.notesId || 'lec-1');
                }}
              >
                <BookOpen size={16} strokeWidth={1.5} />
                Open Lecture Notes & Video
                <ArrowRight size={15} />
              </button>
            )}

            {block.category === 'fsrs' && (
              <button
                type="button"
                className="adv-btn-primary"
                style={{
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                }}
                onClick={() => {
                  onClose();
                  onNavigateToFlashcards?.();
                }}
              >
                <RotateCcw size={16} strokeWidth={1.5} />
                Start FSRS Flashcard Drill
                <ArrowRight size={15} />
              </button>
            )}

            {block.category === 'tutor' && (
              <button
                type="button"
                className="adv-btn-primary"
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  onClose();
                  onNavigateToLecture?.('lec-1');
                }}
              >
                <Sparkles size={16} strokeWidth={1.5} />
                Launch AI Tutor Socratic Drill
                <ArrowRight size={15} />
              </button>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="adv-btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={onClose}
              >
                Close
              </button>

              {onDeleteBlock && (
                <button
                  type="button"
                  className="adv-btn-secondary"
                  style={{
                    color: '#dc2626',
                    borderColor: '#fecdd3',
                    padding: '8px 14px',
                  }}
                  title="Delete this study block"
                  onClick={() => {
                    if (window.confirm(`Delete "${block.title}" from your schedule?`)) {
                      onDeleteBlock(block.id);
                    }
                  }}
                >
                  <Trash2 size={15} color="#dc2626" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
