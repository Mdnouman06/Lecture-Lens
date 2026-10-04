/**
 * StudyBacklogPanel Component
 * Displays real spaced repetition (FSRS) review queues, real upcoming academic milestones,
 * and real PYQ intelligence study priorities.
 * Zero hardcoded demo values, zero fake LMS connections, zero fake syllabus percentages.
 */

import React from 'react';
import type { ExamDeadline, GroupedQuestionPattern } from '../../types/lecture';
import {
  RotateCcw,
  Calendar,
  Flame,
  ArrowRight,
  CheckCircle2,
  Plus,
  Trash2,
  BookOpen,
} from 'lucide-react';

interface StudyBacklogPanelProps {
  dueFlashcardsCount?: number;
  dueBreakdown?: { courseCode: string; count: number }[];
  examDeadlines?: ExamDeadline[];
  pyqPatterns?: GroupedQuestionPattern[];
  onNavigateToFlashcards?: () => void;
  onNavigateToLecture?: (lectureId: string) => void;
  onAddExam?: () => void;
  onDeleteExam?: (examId: string) => void;
  onSchedulePyqTopic?: (topic: string, courseCode: string) => void;
}

export const StudyBacklogPanel: React.FC<StudyBacklogPanelProps> = ({
  dueFlashcardsCount = 0,
  dueBreakdown = [],
  examDeadlines = [],
  pyqPatterns = [],
  onNavigateToFlashcards,
  onNavigateToLecture,
  onAddExam,
  onDeleteExam,
  onSchedulePyqTopic,
}) => {
  const displayDueCount = dueFlashcardsCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Spaced Repetition Due Queue Card */}
      <div
        style={{
          padding: '20px',
          borderRadius: '18px',
          background: 'var(--color-surface-container-lowest, #ffffff)',
          border: '1px solid var(--color-outline-variant, #C7C4D8)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={18} color="#0284c7" strokeWidth={1.5} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1B22' }}>
              Spaced Repetition (FSRS) Due
            </h4>
          </div>
          {displayDueCount > 0 ? (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '999px',
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Flame size={12} color="#b45309" />
              {displayDueCount} Cards Due
            </span>
          ) : (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '999px',
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={12} color="#059669" />
              All Caught Up
            </span>
          )}
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: '#464555', lineHeight: 1.5 }}>
          {displayDueCount > 0
            ? `You have ${displayDueCount} active card${displayDueCount === 1 ? '' : 's'} scheduled for spaced repetition review today.`
            : `All active flashcards are within target retrievability thresholds. Generate flashcards from your lecture notes to expand review coverage.`}
        </p>

        {/* Real course card breakdown if available */}
        {displayDueCount > 0 && dueBreakdown.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dueBreakdown.map((item, idx) => (
              <div
                key={item.courseCode || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: idx === 0 ? '#f0f9ff' : '#f8fafc',
                  border: idx === 0 ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#0284c7' : '#64748b',
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: idx === 0 ? '#0369a1' : '#334155' }}>
                    {item.courseCode}
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: idx === 0 ? '#0284c7' : '#64748b' }}>
                  {item.count} {item.count === 1 ? 'Card' : 'Cards'}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="adv-btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onNavigateToFlashcards}
        >
          {displayDueCount > 0 ? 'Launch FSRS Active Recall' : 'View Flashcard Library'}
          <ArrowRight size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* 2. Upcoming Academic Milestones (Real User Exams) */}
      <div
        style={{
          padding: '20px',
          borderRadius: '18px',
          background: 'var(--color-surface-container-lowest, #ffffff)',
          border: '1px solid var(--color-outline-variant, #C7C4D8)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#4f46e5" strokeWidth={1.5} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1B22' }}>
              Upcoming Assessments
            </h4>
          </div>
          {onAddExam && (
            <button
              type="button"
              className="adv-btn-secondary"
              onClick={onAddExam}
              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={12} strokeWidth={2} />
              Add Exam
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {examDeadlines.length > 0 ? (
            examDeadlines.map((exam, idx) => (
              <div
                key={exam.id || idx}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: idx === 0 ? '#fff1f2' : idx === 1 ? '#f8f7ff' : '#f8fafc',
                  border: idx === 0 ? '1px solid #fecdd3' : idx === 1 ? '1px solid #e0dbfd' : '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  position: 'relative',
                  cursor: onNavigateToLecture ? 'pointer' : 'default',
                }}
                onClick={() => onNavigateToLecture && onNavigateToLecture(exam.id)}
                title={onNavigateToLecture ? 'Click to jump to course notes' : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: idx === 0 ? '#9f1239' : '#4338ca' }}>
                    {exam.courseCode} • {exam.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: idx === 0 ? '#e11d48' : '#6366f1' }}>
                      {exam.daysRemaining != null ? `In ${exam.daysRemaining} Days` : 'Upcoming'}
                    </span>
                    {onDeleteExam && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteExam(exam.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: '2px',
                        }}
                        title="Delete exam milestone"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: idx === 0 ? '#881337' : '#464555' }}>
                  {exam.examDate}
                </div>
                {exam.prepHoursNeeded > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
                    <span style={{ color: '#64748b' }}>Target Preparation</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {exam.prepHoursNeeded} hrs planned
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '12px',
              }}
            >
              <p style={{ margin: 0 }}>No upcoming exams scheduled.</p>
              {onAddExam && (
                <button
                  type="button"
                  className="adv-btn-secondary"
                  onClick={onAddExam}
                  style={{ marginTop: '8px', fontSize: '11px', padding: '4px 10px' }}
                >
                  <Plus size={12} />
                  Add First Exam
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Real High-Yield PYQ Study Priorities (Rendered ONLY if PYQ data exists) */}
      {pyqPatterns && pyqPatterns.length > 0 && (
        <div
          style={{
            padding: '20px',
            borderRadius: '18px',
            background: 'var(--color-surface-container-lowest, #ffffff)',
            border: '1px solid var(--color-outline-variant, #C7C4D8)',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#ea580c" strokeWidth={1.5} />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1B22' }}>
                High-Yield PYQ Priorities
              </h4>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#fff1f2',
                color: '#e11d48',
              }}
            >
              RECURRING
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
            Ground study blocks in recurring question patterns extracted from your past exam papers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pyqPatterns.slice(0, 3).map((pattern) => (
              <div
                key={pattern.patternId}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                    {pattern.topic}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Repeated {pattern.occurrenceCount}x • {pattern.years.slice(0, 3).join(', ')}
                  </div>
                </div>

                {onSchedulePyqTopic && (
                  <button
                    type="button"
                    className="adv-btn-secondary"
                    onClick={() => onSchedulePyqTopic(pattern.topic, 'General')}
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    title="Add review block to calendar"
                  >
                    + Schedule
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
