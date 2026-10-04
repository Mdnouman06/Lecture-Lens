/**
 * AddStudyBlockModal Component
 * Interactive modal dialog for creating and scheduling custom study blocks.
 */

import React, { useState } from 'react';
import type { StudyBlock } from '../../types/lecture';
import { X, Calendar, Plus } from 'lucide-react';

interface AddStudyBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (block: Partial<StudyBlock>) => void;
  defaultDayIndex?: number;
  initialData?: Partial<StudyBlock>;
  existingCourses?: string[];
}

const DAYS_LIST = [
  { index: 0, label: 'Mon' },
  { index: 1, label: 'Tue' },
  { index: 2, label: 'Wed' },
  { index: 3, label: 'Thu' },
  { index: 4, label: 'Fri' },
  { index: 5, label: 'Sat' },
  { index: 6, label: 'Sun' },
];

export const AddStudyBlockModal: React.FC<AddStudyBlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultDayIndex = 0,
  initialData,
  existingCourses = ['General'],
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [courseCode, setCourseCode] = useState(initialData?.courseCode || existingCourses[0] || 'General');
  const [category, setCategory] = useState<StudyBlock['category']>(initialData?.category || 'deep');
  const [dayIndex, setDayIndex] = useState(initialData?.dayIndex ?? defaultDayIndex);
  const [timeDisplay, setTimeDisplay] = useState(initialData?.timeDisplay || '14:00 - 15:30');
  const [startHour, setStartHour] = useState(initialData?.startHour || 14.0);
  const [durationHours, setDurationHours] = useState(initialData?.durationHours || 1.5);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setCourseCode(initialData?.courseCode || existingCourses[0] || 'General');
      setCategory(initialData?.category || 'deep');
      setDayIndex(initialData?.dayIndex ?? defaultDayIndex);
      setTimeDisplay(initialData?.timeDisplay || '14:00 - 15:30');
      setStartHour(initialData?.startHour || 14.0);
      setDurationHours(initialData?.durationHours || 1.5);
    }
  }, [isOpen, initialData, defaultDayIndex, existingCourses]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dayMeta = DAYS_LIST.find((d) => d.index === dayIndex) || DAYS_LIST[0];

    onSave({
      title: title.trim(),
      courseCode: courseCode.trim() || 'General',
      category,
      dayIndex,
      dayLabel: dayMeta.label,
      timeDisplay,
      startHour,
      durationHours,
      isCompleted: false,
    });

    onClose();
  };

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
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1B22' }}>
                Schedule Study Block
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#777587' }}>
                Create a dedicated session on your academic calendar
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
              Session Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deep Study: Core Concepts & Practice Problems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #c7c4d8',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Course Code & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Course Code
              </label>
              <input
                type="text"
                placeholder="e.g. General, CS 101"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StudyBlock['category'])}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              >
                <option value="deep">Deep Study Block</option>
                <option value="fsrs">FSRS Spaced Review</option>
                <option value="lecture">Live Lecture</option>
                <option value="tutor">AI Tutor Drill</option>
                <option value="exam">Exam / Milestone</option>
              </select>
            </div>
          </div>

          {/* Day of Week & Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Day of Week
              </label>
              <select
                value={dayIndex}
                onChange={(e) => setDayIndex(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              >
                {DAYS_LIST.map((d) => (
                  <option key={d.index} value={d.index}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Duration (Hours)
              </label>
              <select
                value={durationHours}
                onChange={(e) => {
                  const dur = parseFloat(e.target.value);
                  setDurationHours(dur);
                  const end = startHour + dur;
                  const fmt = (h: number) => {
                    const hrs = Math.floor(h).toString().padStart(2, '0');
                    const mins = (h % 1 === 0.5 ? '30' : '00');
                    return `${hrs}:${mins}`;
                  };
                  setTimeDisplay(`${fmt(startHour)} - ${fmt(end)}`);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              >
                <option value={0.5}>0.5 hrs (30m)</option>
                <option value={1.0}>1.0 hrs (60m)</option>
                <option value={1.5}>1.5 hrs (90m)</option>
                <option value={2.0}>2.0 hrs (120m)</option>
                <option value={2.5}>2.5 hrs (150m)</option>
                <option value={3.0}>3.0 hrs (180m)</option>
              </select>
            </div>
          </div>

          {/* Start Time & Time Display */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Start Time
              </label>
              <select
                value={startHour}
                onChange={(e) => {
                  const st = parseFloat(e.target.value);
                  setStartHour(st);
                  const end = st + durationHours;
                  const fmt = (h: number) => {
                    const hrs = Math.floor(h).toString().padStart(2, '0');
                    const mins = h % 1 === 0.5 ? '30' : '00';
                    return `${hrs}:${mins}`;
                  };
                  setTimeDisplay(`${fmt(st)} - ${fmt(end)}`);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              >
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#464555', marginBottom: '6px' }}>
                Time Display
              </label>
              <input
                type="text"
                value={timeDisplay}
                onChange={(e) => setTimeDisplay(e.target.value)}
                placeholder="e.g. 14:00 - 15:30"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #c7c4d8',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="adv-btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="adv-btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Plus size={16} strokeWidth={2} />
              Save Study Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
