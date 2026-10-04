/**
 * StudyUrgencyRibbon Component
 * Apple-inspired Schedule Status & Urgency Card:
 * - State A (Neutral): Clean single-card status when no exam is scheduled
 * - State B (Real Exam): Dynamic priority assessment or optimal coverage driven strictly by real exam data
 * - Daily Target: Compact, vertically aligned tracker strictly calculated from real schedule blocks
 */

import React from 'react';
import type { StudyCalendarWeek } from '../../types/lecture';
import {
  AlertTriangle,
  Wand2,
  CheckCircle2,
  Sparkles,
  Calendar,
  Plus,
} from 'lucide-react';

interface StudyUrgencyRibbonProps {
  examAlert?: StudyCalendarWeek['examAlert'];
  dailyTarget: StudyCalendarWeek['dailyTarget'];
  onAutoFillGap: () => void;
  onAddExam?: () => void;
  isAutofilling?: boolean;
}

const DailyTargetCompact: React.FC<{ dailyTarget: StudyCalendarWeek['dailyTarget'] }> = ({
  dailyTarget,
}) => {
  const isComplete = dailyTarget.percentComplete === 100 && dailyTarget.scheduledHours > 0;
  const hasHours = dailyTarget.scheduledHours > 0;

  return (
    <div className="planner-daily-target-compact">
      <div className="planner-target-header">
        <span className="planner-target-label">Today's Daily Target</span>
        <span
          className={`planner-target-badge ${
            hasHours ? (isComplete ? 'is-complete' : 'in-progress') : 'is-empty'
          }`}
        >
          {!hasHours ? '0 hrs planned' : `${dailyTarget.percentComplete}% Done`}
        </span>
      </div>

      <div className="planner-target-value">
        {hasHours ? (
          dailyTarget.targetHours > 0
            ? `${Math.round(dailyTarget.scheduledHours * (dailyTarget.percentComplete / 100) * 10) / 10} / ${dailyTarget.scheduledHours} hrs`
            : `${dailyTarget.scheduledHours} hrs`
        ) : (
          <span className="planner-target-empty-text">No sessions today</span>
        )}
      </div>

      <div className="planner-target-bar-track">
        <div
          className={`planner-target-bar-fill ${isComplete ? 'is-complete' : ''}`}
          style={{ width: `${Math.min(100, dailyTarget.percentComplete)}%` }}
        />
      </div>
    </div>
  );
};

export const StudyUrgencyRibbon: React.FC<StudyUrgencyRibbonProps> = ({
  examAlert,
  dailyTarget,
  onAutoFillGap,
  onAddExam,
  isAutofilling = false,
}) => {
  const hasRealExam = Boolean(examAlert && examAlert.title && examAlert.title.trim().length > 0);
  const isDeficitResolved = hasRealExam && (examAlert?.coverageDeficit ?? 0) >= 0;
  const hasPrepData = hasRealExam && (examAlert?.prepHoursNeeded ?? 0) > 0;

  // State B — Real Urgent / Priority Exam exists
  if (hasRealExam && examAlert) {
    return (
      <div
        className={`planner-urgency-ribbon ${
          isDeficitResolved ? 'is-optimal' : 'is-urgent'
        }`}
      >
        {/* Left: Priority Assessment or Optimal Coverage */}
        <div className="planner-urgency-left">
          <div
            className={`planner-urgency-icon-badge ${
              isDeficitResolved ? 'is-optimal' : 'is-urgent'
            }`}
          >
            {isDeficitResolved ? (
              <CheckCircle2 size={20} strokeWidth={1.75} />
            ) : (
              <AlertTriangle size={20} strokeWidth={1.75} />
            )}
          </div>

          <div className="planner-urgency-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span
                className="planner-alert-pill"
                style={{
                  background: isDeficitResolved ? '#059669' : '#e11d48',
                }}
              >
                {isDeficitResolved ? 'Optimal Coverage' : 'Priority Assessment'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#464555' }}>
                {examAlert.courseCode || 'General'}
              </span>
            </div>

            <div className="planner-urgency-title">{examAlert.title}</div>
            <div className="planner-urgency-sub">
              {examAlert.examDate ? `${examAlert.examDate} ` : ''}
              {examAlert.daysRemaining != null ? `(In ${examAlert.daysRemaining} Days) • ` : ''}
              {hasPrepData
                ? `${examAlert.prepHoursNeeded}h Needed, ${examAlert.prepHoursScheduled}h Scheduled`
                : 'Study hours: Insufficient data'}
            </div>
          </div>
        </div>

        {/* Right: Actions (Deficit / AutoFill) & Compact Daily Target */}
        <div className="planner-urgency-actions">
          <span
            className="planner-deficit-tag"
            style={{
              background: isDeficitResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(225, 29, 72, 0.15)',
              color: isDeficitResolved ? '#047857' : '#be123c',
            }}
          >
            {!hasPrepData
              ? 'Deficit: Insufficient data'
              : isDeficitResolved
              ? '✓ 0.0 hrs Deficit (Optimal)'
              : `${examAlert.coverageDeficit} hrs Deficit`}
          </span>

          {!isDeficitResolved && (
            <button
              type="button"
              className="planner-autofill-btn"
              onClick={onAutoFillGap}
              disabled={isAutofilling}
            >
              <Wand2 size={15} strokeWidth={1.5} />
              {isAutofilling ? 'Optimizing Schedule...' : 'Auto-Fill Gap'}
            </button>
          )}

          {isDeficitResolved && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#059669',
              }}
            >
              <Sparkles size={16} color="#059669" />
              Coverage Synchronized
            </span>
          )}

          <div className="planner-status-divider" />

          <DailyTargetCompact dailyTarget={dailyTarget} />
        </div>
      </div>
    );
  }

  // State A — Neutral Schedule Status (Empty / No Exam)
  return (
    <div className="planner-urgency-ribbon">
      {/* Left: Icon + Text Hierarchy */}
      <div className="planner-status-main">
        <div className="planner-status-icon-badge">
          <Calendar size={18} strokeWidth={1.75} />
        </div>

        <div className="planner-status-content">
          <span className="planner-status-eyebrow">Schedule Status</span>
          <h3 className="planner-status-title">No Upcoming Exams Scheduled</h3>
          <p className="planner-status-desc">
            Add an upcoming exam milestone to calculate targeted preparation hours and track your review schedule.
          </p>
        </div>
      </div>

      {/* Right: Add Exam CTA + Subordinate Daily Target */}
      <div className="planner-status-aside">
        {onAddExam && (
          <button
            type="button"
            className="adv-btn-secondary planner-status-add-exam-btn"
            onClick={onAddExam}
          >
            <Plus size={14} strokeWidth={2} />
            Add Exam
          </button>
        )}

        <div className="planner-status-divider" />

        <DailyTargetCompact dailyTarget={dailyTarget} />
      </div>
    </div>
  );
};
