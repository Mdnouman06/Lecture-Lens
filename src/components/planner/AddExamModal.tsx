/**
 * AddExamModal Component
 * Interactive modal dialog for creating and tracking real exam milestones and deadlines.
 */

import React, { useState } from 'react';
import type { ExamDeadline } from '../../types/lecture';
import { X, Calendar, Award } from 'lucide-react';

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exam: Partial<ExamDeadline>) => void;
  existingCourses?: string[];
}

export const AddExamModal: React.FC<AddExamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCourses = ['General'],
}) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState(existingCourses[0] || 'General');
  const [customCourse, setCustomCourse] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('10:00 AM');
  const [prepHoursNeeded, setPrepHoursNeeded] = useState(10.0);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !examDate) return;

    const resolvedCourse = courseCode === '__custom__' ? customCourse.trim() || 'General' : courseCode;

    // Calculate days remaining from today
    const targetDate = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Format human-friendly display date, e.g. "Friday, Dec 12 • 10:00 AM"
    const formattedDate = targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const examDateDisplay = examTime.trim() ? `${formattedDate} • ${examTime}` : formattedDate;

    onSave({
      title: title.trim(),
      courseCode: resolvedCourse,
      examDate: examDateDisplay,
      examTime: examTime.trim() || undefined,
      daysRemaining,
      prepHoursNeeded: Number(prepHoursNeeded) || 10.0,
      priority,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const courseOptions = Array.from(new Set(['General', ...existingCourses])).filter(Boolean);

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
          maxWidth: '480px',
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
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1B22' }}>
                Add Exam Milestone
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#777587' }}>
                Track assessment deadlines and align preparation hours
              </p>
            </div>
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
              Exam or Assessment Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Examination, Final Project"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #c7c4d8',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Course */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Course Code
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                  background: '#ffffff',
                }}
              >
                {courseOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">+ Enter Custom Course</option>
              </select>
            </div>

            {courseCode === '__custom__' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                  Custom Code
                </label>
                <input
                  type="text"
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  placeholder="e.g. CS301"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #c7c4d8',
                    fontSize: '13px',
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                  background: '#ffffff',
                }}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Standard Review</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Exam Date *
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Time (Optional)
              </label>
              <input
                type="text"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                placeholder="10:00 AM"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          {/* Target Prep Hours */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
              Target Preparation Hours (Estimated)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={prepHoursNeeded}
              onChange={(e) => setPrepHoursNeeded(parseFloat(e.target.value) || 10)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #c7c4d8',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
              Notes & Exam Syllabus Focus (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on memory management and scheduling algorithms"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #c7c4d8',
                fontSize: '13px',
                resize: 'none',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="adv-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="adv-btn-primary"
            >
              <Calendar size={15} />
              Save Exam Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
