/**
 * StudyCalendarGrid Component
 * Realizes Google Stitch screen 1680b7e660454bfab5c78955d8803343 7-day interactive calendar canvas:
 * - Dynamic week dates calculated strictly from real calendar time
 * - Adaptive time range based on actual scheduled events
 * - Color-coded categories: Live Lecture, FSRS Review, Deep Study, AI Tutor Drill, Exam / Deadline
 * - Week / Day / Agenda view switchers
 * - Direct click to schedule in open slots
 */

import React, { useState, useMemo } from 'react';
import type { StudyBlock } from '../../types/lecture';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
} from 'lucide-react';

interface StudyCalendarGridProps {
  blocks: StudyBlock[];
  onSelectBlock: (block: StudyBlock) => void;
  weekLabel?: string;
  onToggleComplete?: (blockId: string, currentStatus: boolean) => void;
  onAddBlockForDay?: (dayIndex: number) => void;
}

import { getWeekDays, getTodayDayIndex } from '../../utils/calendar';

export const StudyCalendarGrid: React.FC<StudyCalendarGridProps> = ({
  blocks,
  onSelectBlock,
  weekLabel,
  onAddBlockForDay,
}) => {
  const [activeView, setActiveView] = useState<'week' | 'day' | 'agenda'>('week');
  const [offsetWeeks, setOffsetWeeks] = useState<number>(0);

  const daysMeta = useMemo(() => getWeekDays(offsetWeeks), [offsetWeeks]);
  const todayDayIndex = useMemo(() => getTodayDayIndex(), []);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(todayDayIndex);

  const selectedDayMeta = daysMeta.find((d) => d.index === selectedDayIndex) || daysMeta[0];
  const activeDayBlocks = blocks.filter((b) => b.dayIndex === selectedDayIndex);

  // Dynamic time steps based on actual blocks to eliminate excessive empty space
  const timeSteps = useMemo(() => {
    if (blocks.length === 0) {
      return ['09:00', '11:00', '13:00', '15:00', '17:00'];
    }
    const startHours = blocks.map((b) => b.startHour || 9);
    const endHours = blocks.map((b) => (b.startHour || 9) + (b.durationHours || 1.5));
    const minH = Math.max(7, Math.floor(Math.min(...startHours)));
    const maxH = Math.min(22, Math.ceil(Math.max(...endHours)));
    const steps: string[] = [];
    for (let h = minH; h <= maxH + 1; h += 2) {
      steps.push(`${String(h).padStart(2, '0')}:00`);
    }
    return steps.length > 0 ? steps : ['09:00', '11:00', '13:00', '15:00', '17:00'];
  }, [blocks]);

  // Derived current week label
  const computedWeekLabel = useMemo(() => {
    if (weekLabel && offsetWeeks === 0) return weekLabel;
    const start = daysMeta[0];
    const end = daysMeta[6];
    if (start.monthName === end.monthName) {
      return `${start.monthName} ${start.dateNum} – ${end.dateNum}`;
    }
    return `${start.monthName} ${start.dateNum} – ${end.monthName} ${end.dateNum}`;
  }, [daysMeta, weekLabel, offsetWeeks]);

  return (
    <div className="planner-calendar-card">
      {/* Controls Bar */}
      <div className="planner-controls-bar">
        {/* Left: View Switcher */}
        <div className="planner-view-switcher" role="tablist" aria-label="Calendar Timeframe View">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'week'}
            aria-controls="planner-calendar-view"
            id="tab-planner-week"
            className={`planner-switcher-btn ${activeView === 'week' ? 'active' : ''}`}
            onClick={() => setActiveView('week')}
          >
            Week
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'day'}
            aria-controls="planner-calendar-view"
            id="tab-planner-day"
            className={`planner-switcher-btn ${activeView === 'day' ? 'active' : ''}`}
            onClick={() => setActiveView('day')}
          >
            Day View
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'agenda'}
            aria-controls="planner-calendar-view"
            id="tab-planner-agenda"
            className={`planner-switcher-btn ${activeView === 'agenda' ? 'active' : ''}`}
            onClick={() => setActiveView('agenda')}
          >
            Agenda
          </button>
        </div>

        {/* Center: Date Navigator with Dynamic Dates */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="adv-btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => {
              setOffsetWeeks(0);
              setSelectedDayIndex(todayDayIndex);
              setActiveView('week');
            }}
          >
            Today ({daysMeta[todayDayIndex]?.dayName} {daysMeta[todayDayIndex]?.dateNum})
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#777587',
                padding: '4px',
              }}
              onClick={() => {
                if (activeView === 'day') {
                  setSelectedDayIndex((prev) => (prev > 0 ? prev - 1 : 6));
                } else {
                  setOffsetWeeks((prev) => prev - 1);
                }
              }}
              aria-label="Previous timeframe"
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1A1B22',
                whiteSpace: 'nowrap',
              }}
            >
              {activeView === 'day'
                ? `${selectedDayMeta.dayName} ${selectedDayMeta.monthName} ${selectedDayMeta.dateNum}`
                : computedWeekLabel}
            </span>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#777587',
                padding: '4px',
              }}
              onClick={() => {
                if (activeView === 'day') {
                  setSelectedDayIndex((prev) => (prev < 6 ? prev + 1 : 0));
                } else {
                  setOffsetWeeks((prev) => prev + 1);
                }
              }}
              aria-label="Next timeframe"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Action: Quick Add Block */}
        {onAddBlockForDay && (
          <button
            type="button"
            className="adv-btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => onAddBlockForDay(selectedDayIndex)}
          >
            <Plus size={14} />
            Schedule Session
          </button>
        )}
      </div>

      <div id="planner-calendar-view" tabIndex={0} aria-label="Calendar Grid View">
        {/* --- DAY VIEW CANVAS --- */}
        {activeView === 'day' && (
          <div className="planner-dayview-container">
            <div className="planner-dayview-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1B22' }}>
                  {selectedDayMeta.dayName}, {selectedDayMeta.monthName} {selectedDayMeta.dateNum}
                </h3>
                <span style={{ fontSize: '12px', color: '#777587' }}>
                  {activeDayBlocks.length} scheduled session{activeDayBlocks.length === 1 ? '' : 's'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {daysMeta.map((d) => (
                  <button
                    key={d.index}
                    type="button"
                    onClick={() => setSelectedDayIndex(d.index)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: selectedDayIndex === d.index ? '1px solid #4f46e5' : '1px solid #e2e0f0',
                      background: selectedDayIndex === d.index ? '#eef2ff' : '#ffffff',
                      color: selectedDayIndex === d.index ? '#4f46e5' : '#464555',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {d.dayName}
                  </button>
                ))}
              </div>
            </div>

            <div className="planner-dayview-content">
              {activeDayBlocks.length > 0 ? (
                activeDayBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={`planner-dayview-block ${block.category} ${block.isCompleted ? 'completed' : ''}`}
                    onClick={() => onSelectBlock(block)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="dayview-block-time">{block.timeDisplay}</div>
                    <div className="dayview-block-info">
                      <div className="dayview-block-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {block.isCompleted && (
                          <span style={{ color: '#059669', display: 'inline-flex' }}>
                            <Check size={14} strokeWidth={2.5} />
                          </span>
                        )}
                        <span style={{ textDecoration: block.isCompleted ? 'line-through' : 'none' }}>
                          {block.title}
                        </span>
                      </div>
                      <div className="dayview-block-meta">
                        <span>{block.courseCode}</span>
                        <span>•</span>
                        <span>{block.durationHours} hrs</span>
                        {block.isAutofilled && (
                          <span className="autofill-tag">⚡ Auto-Filled</span>
                        )}
                        {block.isCompleted && (
                          <span style={{ color: '#059669', fontWeight: 600, fontSize: '11px' }}>• Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#777587', fontSize: '13px' }}>
                  No study sessions scheduled for {selectedDayMeta.dayName}.
                  {onAddBlockForDay && (
                    <div style={{ marginTop: '12px' }}>
                      <button
                        type="button"
                        className="adv-btn-secondary"
                        onClick={() => onAddBlockForDay(selectedDayIndex)}
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                      >
                        <Plus size={14} /> Schedule for this day
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- AGENDA VIEW CANVAS --- */}
        {activeView === 'agenda' && (
          <div className="planner-agenda-container">
            {daysMeta.map((day) => {
              const dayBlocks = blocks.filter((b) => b.dayIndex === day.index);
              return (
                <div key={day.index} className="agenda-day-group">
                  <div className={`agenda-day-header ${day.isToday ? 'today' : ''}`}>
                    <span className="agenda-day-name">{day.dayName}</span>
                    <span className="agenda-day-date">{day.monthName} {day.dateNum}</span>
                    {day.isToday && <span className="today-badge">TODAY</span>}
                  </div>
                  <div className="agenda-blocks-list">
                    {dayBlocks.length > 0 ? (
                      dayBlocks.map((block) => (
                        <div
                          key={block.id}
                          className={`agenda-block-row ${block.category} ${block.isCompleted ? 'completed' : ''}`}
                          onClick={() => onSelectBlock(block)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="agenda-time">{block.timeDisplay}</div>
                          <div className="agenda-info">
                            <div className="agenda-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {block.isCompleted && (
                                <span style={{ color: '#059669', display: 'inline-flex' }}>
                                  <Check size={14} strokeWidth={2.5} />
                                </span>
                              )}
                              <span style={{ textDecoration: block.isCompleted ? 'line-through' : 'none', opacity: block.isCompleted ? 0.75 : 1 }}>
                                {block.title}
                              </span>
                            </div>
                            <div className="agenda-meta">
                              <span>{block.courseCode}</span>
                              <span>•</span>
                              <span>{block.durationHours}h</span>
                              {block.isAutofilled && (
                                <span className="autofill-tag">⚡ Auto-Filled</span>
                              )}
                              {block.isCompleted && (
                                <span style={{ color: '#059669', fontWeight: 600, fontSize: '11px' }}>• Completed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        className="agenda-open-slot"
                        onClick={() => onAddBlockForDay && onAddBlockForDay(day.index)}
                        style={{ cursor: onAddBlockForDay ? 'pointer' : 'default' }}
                      >
                        Open Slot {onAddBlockForDay && '• Click to schedule'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- 7-DAY SCHEDULE CANVAS GRID (WEEK VIEW) --- */}
        {activeView === 'week' && (
          <div className="planner-grid-container">
            {/* Left Time Axis */}
            <div className="planner-time-col">
              {timeSteps.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>

            {/* 7 Day Columns */}
            {daysMeta.map((day) => {
              const dayBlocks = blocks.filter((b) => b.dayIndex === day.index);

              return (
                <div key={day.index} className="planner-day-col">
                  <div
                    className={`planner-day-header ${day.isToday ? 'today' : ''}`}
                    onClick={() => {
                      setSelectedDayIndex(day.index);
                      setActiveView('day');
                    }}
                    title="Click to view detailed Day view"
                    style={{ cursor: 'pointer' }}
                  >
                    <div>{day.dayName}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{day.dateNum}</div>
                  </div>

                  <div className="planner-day-blocks-track">
                    {dayBlocks.map((block) => (
                      <div
                        key={block.id}
                        className={`planner-study-block ${block.category} ${
                          block.isAutofilled ? 'autofilled' : ''
                        } ${block.isCompleted ? 'completed' : ''}`}
                        onClick={() => onSelectBlock(block)}
                      >
                        <div className="planner-block-time" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{block.timeDisplay}</span>
                          {block.isCompleted && (
                            <span style={{ color: '#059669', display: 'inline-flex' }}>
                              <Check size={12} strokeWidth={2.5} />
                            </span>
                          )}
                        </div>
                        <div className="planner-block-title">{block.title}</div>
                        <div style={{ fontSize: '10px', opacity: 0.75, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{block.courseCode}</span>
                          <span>{block.durationHours}h</span>
                        </div>
                      </div>
                    ))}

                    {dayBlocks.length === 0 && (
                      <div
                        onClick={() => onAddBlockForDay && onAddBlockForDay(day.index)}
                        style={{
                          height: '100%',
                          minHeight: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          color: '#a1a0b3',
                          textAlign: 'center',
                          cursor: onAddBlockForDay ? 'pointer' : 'default',
                          borderRadius: '8px',
                          transition: 'background 0.2s ease',
                        }}
                        className="planner-open-slot-hover"
                      >
                        Open Slot
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend & Categories */}
      <div className="planner-legend-row">
        <span style={{ fontWeight: 600, color: '#1A1B22' }}>Categories:</span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="planner-legend-dot" style={{ background: '#3525cd' }} />
          Live Lecture
        </span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="planner-legend-dot" style={{ background: '#006591' }} />
          FSRS Spaced Review
        </span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="planner-legend-dot" style={{ background: '#005338' }} />
          Deep Study Block
        </span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="planner-legend-dot" style={{ background: '#4f46e5' }} />
          AI Tutor Drill
        </span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="planner-legend-dot" style={{ background: '#ba1a1a' }} />
          Exam / Milestone
        </span>
      </div>
    </div>
  );
};
