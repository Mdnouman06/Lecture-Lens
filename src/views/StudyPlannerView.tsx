/**
 * StudyPlannerView
 * Dedicated full-page view for sidebar navigation route 'planner'.
 * Realizes Google Stitch screen 1680b7e660454bfab5c78955d8803343
 * ("Study Planner & Calendar — LectureLens").
 * Truthful, data-driven, local-first persisted study scheduler.
 * Zero hardcoded academic demo terms; fully grounded in real student data.
 */

import React, { useState, useEffect, useMemo } from 'react';
import type {
  StudyBlock,
  ExamDeadline,
  Lecture,
  GroupedQuestionPattern,
} from '../types/lecture';
import {
  autoFillScheduleDeficit,
  getDynamicWeekLabel,
  getQuestionPatterns,
} from '../services/api';
import {
  fetchStudyBlocks,
  saveStudyBlockToDb,
  saveBatchStudyBlocksToDb,
  updateStudyBlockInDb,
  deleteStudyBlockFromDb,
  fetchExamDeadlines,
  saveExamDeadlineToDb,
  deleteExamDeadlineFromDb,
  fetchAllFlashcards,
  fetchUserLectures,
} from '../services/lectures';
import { supabase } from '../services/supabase';
import { StudyUrgencyRibbon } from '../components/planner/StudyUrgencyRibbon';
import { StudyCalendarGrid } from '../components/planner/StudyCalendarGrid';
import { StudyBacklogPanel } from '../components/planner/StudyBacklogPanel';
import { StudyBlockModal } from '../components/planner/StudyBlockModal';
import { AddStudyBlockModal } from '../components/planner/AddStudyBlockModal';
import { AddExamModal } from '../components/planner/AddExamModal';
import { getTodayDayIndex } from '../utils/calendar';
import { EmptyState } from '../components/common/EmptyState';
import {
  Calendar,
  Plus,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import '../styles/advanced.css';

interface StudyPlannerViewProps {
  onNavigateToLecture?: (lectureId: string) => void;
  onNavigateToFlashcards?: () => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  onNavigateToLecture,
  onNavigateToFlashcards,
}) => {
  // Local-first persistent state for study blocks
  const [blocks, setBlocks] = useState<StudyBlock[]>(() => {
    try {
      const saved = localStorage.getItem('lecturelens_study_blocks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached study blocks:', e);
    }
    return [];
  });

  // Local-first persistent state for exam deadlines
  const [examDeadlines, setExamDeadlines] = useState<ExamDeadline[]>(() => {
    try {
      const saved = localStorage.getItem('lecturelens_exam_deadlines');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached exam deadlines:', e);
    }
    return [];
  });

  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [isAutofilling, setIsAutofilling] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState<boolean>(false);
  const [addBlockInitialData, setAddBlockInitialData] = useState<Partial<StudyBlock> | undefined>();
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('user_00000000-0000-0000-0000-000000000001');

  // Real academic context
  const [dueCardsCount, setDueCardsCount] = useState<number>(0);
  const [dueBreakdown, setDueBreakdown] = useState<{ courseCode: string; count: number }[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [pyqPatterns, setPyqPatterns] = useState<GroupedQuestionPattern[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function initializePlanner() {
      try {
        // 1. Resolve User ID from Supabase auth
        let currentUserId = 'user_00000000-0000-0000-0000-000000000001';
        if (supabase) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.id) {
            currentUserId = authData.user.id;
          }
        }
        if (isMounted) setUserId(currentUserId);

        // 2. Fetch real student flashcards
        try {
          const cards = await fetchAllFlashcards(currentUserId);
          if (isMounted && cards && cards.length > 0) {
            const unmastered = cards.filter((c: any) => !c.mastered);
            setDueCardsCount(unmastered.length);

            // Group due cards by course
            const counts: Record<string, number> = {};
            unmastered.forEach((c: any) => {
              const code = c.courseCode || c.course_code || 'General';
              counts[code] = (counts[code] || 0) + 1;
            });
            setDueBreakdown(
              Object.entries(counts).map(([courseCode, count]) => ({ courseCode, count }))
            );
          } else if (isMounted) {
            setDueCardsCount(0);
            setDueBreakdown([]);
          }
        } catch {
          if (isMounted) {
            setDueCardsCount(0);
            setDueBreakdown([]);
          }
        }

        // 3. Fetch real Exam Deadlines from Supabase
        try {
          const dbDeadlines = await fetchExamDeadlines(currentUserId);
          if (isMounted && dbDeadlines && dbDeadlines.length > 0) {
            setExamDeadlines(dbDeadlines);
            localStorage.setItem('lecturelens_exam_deadlines', JSON.stringify(dbDeadlines));
          }
        } catch {}

        // 4. Fetch real Student Lectures
        try {
          const lecs = await fetchUserLectures();
          if (isMounted && lecs && lecs.length > 0) {
            setLectures(lecs);
          }
        } catch {}

        // 5. Fetch real PYQ Intelligence Question Patterns
        try {
          const patterns = await getQuestionPatterns('ALL');
          if (isMounted && patterns && patterns.length > 0) {
            setPyqPatterns(patterns);
          }
        } catch {}

        // 6. Hydrate real Study Blocks from Supabase
        try {
          const dbBlocks = await fetchStudyBlocks(currentUserId);
          if (isMounted && dbBlocks && dbBlocks.length > 0) {
            setBlocks(dbBlocks);
            localStorage.setItem('lecturelens_study_blocks', JSON.stringify(dbBlocks));
          }
        } catch {}
      } catch (err) {
        console.warn('Error hydrating real study planner state:', err);
      }
    }

    initializePlanner();

    return () => {
      isMounted = false;
    };
  }, []);

  // Unique list of real course codes from lectures, exams, and blocks
  const existingCourses = useMemo(() => {
    const set = new Set<string>();
    lectures.forEach((l) => l.courseCode && set.add(l.courseCode));
    examDeadlines.forEach((e) => e.courseCode && set.add(e.courseCode));
    blocks.forEach((b) => b.courseCode && set.add(b.courseCode));
    if (set.size === 0) set.add('General');
    return Array.from(set);
  }, [lectures, examDeadlines, blocks]);

  // Derive today's index (0=Mon ... 6=Sun)
  const todayIndex = useMemo(() => getTodayDayIndex(), []);

  // Real Exam Alert calculation
  const examAlert = useMemo(() => {
    if (examDeadlines.length === 0) return null;

    // Pick nearest exam
    const sorted = [...examDeadlines].sort((a, b) => (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));
    const nearest = sorted[0];

    const prepNeeded = nearest.prepHoursNeeded || 0;
    // Calculate scheduled hours across deep, fsrs, tutor blocks matching this course
    const prepCategories = new Set(['deep', 'fsrs', 'tutor']);
    const scheduledHours = blocks
      .filter((b) => prepCategories.has(b.category) && (b.courseCode === nearest.courseCode || nearest.courseCode === 'General'))
      .reduce((acc, b) => acc + (b.durationHours || 0), 0);

    const deficit = prepNeeded > 0 ? Math.min(0, Math.round((scheduledHours - prepNeeded) * 10) / 10) : 0;

    return {
      title: nearest.title,
      courseCode: nearest.courseCode,
      examDate: nearest.examDate,
      daysRemaining: nearest.daysRemaining,
      prepHoursNeeded: prepNeeded,
      prepHoursScheduled: Math.round(scheduledHours * 10) / 10,
      coverageDeficit: deficit,
    };
  }, [examDeadlines, blocks]);

  // Real Daily Target calculation strictly from today's real blocks
  const dailyTarget = useMemo(() => {
    const todayBlocks = blocks.filter((b) => b.dayIndex === todayIndex);
    const scheduledToday = todayBlocks.reduce((acc, b) => acc + (b.durationHours || 0), 0);
    const completedToday = todayBlocks
      .filter((b) => b.isCompleted)
      .reduce((acc, b) => acc + (b.durationHours || 0), 0);
    const deepHours = todayBlocks
      .filter((b) => b.category === 'deep')
      .reduce((acc, b) => acc + (b.durationHours || 0), 0);
    const fsrsHours = todayBlocks
      .filter((b) => b.category === 'fsrs')
      .reduce((acc, b) => acc + (b.durationHours || 0), 0);

    const percent = scheduledToday > 0 ? Math.min(100, Math.round((completedToday / scheduledToday) * 100)) : 0;

    return {
      scheduledHours: Math.round(scheduledToday * 10) / 10,
      targetHours: Math.round(scheduledToday * 10) / 10,
      percentComplete: percent,
      deepStudyHours: Math.round(deepHours * 10) / 10,
      fsrsHours: Math.round(fsrsHours * 10) / 10,
    };
  }, [blocks, todayIndex]);

  // Study Block Actions
  const handleCreateStudyBlock = async (blockData: Partial<StudyBlock>) => {
    const newBlock: StudyBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      dayIndex: blockData.dayIndex ?? 0,
      dayLabel: blockData.dayLabel || 'Mon',
      title: blockData.title || 'Study Session',
      category: blockData.category || 'deep',
      timeDisplay: blockData.timeDisplay || '14:00 - 15:30',
      startHour: blockData.startHour || 14.0,
      durationHours: blockData.durationHours || 1.5,
      courseCode: blockData.courseCode || existingCourses[0] || 'General',
      isCompleted: false,
    };

    setBlocks((prev) => {
      const next = [...prev, newBlock];
      localStorage.setItem('lecturelens_study_blocks', JSON.stringify(next));
      return next;
    });

    try {
      await saveStudyBlockToDb(newBlock, userId);
    } catch (err) {
      console.warn('Failed to save study block to Supabase:', err);
    }

    setFeedbackToast(`Scheduled "${newBlock.title}" for ${newBlock.dayLabel}.`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleToggleComplete = async (blockId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === blockId ? { ...b, isCompleted: nextStatus } : b));
      localStorage.setItem('lecturelens_study_blocks', JSON.stringify(updated));
      return updated;
    });

    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock((prev) => (prev ? { ...prev, isCompleted: nextStatus } : null));
    }

    try {
      await updateStudyBlockInDb(blockId, { isCompleted: nextStatus }, userId);
    } catch (err) {
      console.warn('Failed to update block completion in Supabase:', err);
    }
  };

  const handleDeleteStudyBlock = async (blockId: string) => {
    setBlocks((prev) => {
      const updated = prev.filter((b) => b.id !== blockId);
      localStorage.setItem('lecturelens_study_blocks', JSON.stringify(updated));
      return updated;
    });

    setSelectedBlock(null);

    try {
      await deleteStudyBlockFromDb(blockId, userId);
    } catch (err) {
      console.warn('Failed to delete study block from Supabase:', err);
    }
  };

  // Exam Deadline Actions
  const handleCreateExam = async (examData: Partial<ExamDeadline>) => {
    const newExam: ExamDeadline = {
      id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      title: examData.title || 'Assessment',
      courseCode: examData.courseCode || 'General',
      examDate: examData.examDate || '',
      examTime: examData.examTime,
      daysRemaining: examData.daysRemaining,
      prepHoursNeeded: examData.prepHoursNeeded || 10.0,
      priority: examData.priority || 'high',
      notes: examData.notes,
    };

    setExamDeadlines((prev) => {
      const next = [...prev, newExam];
      localStorage.setItem('lecturelens_exam_deadlines', JSON.stringify(next));
      return next;
    });

    try {
      await saveExamDeadlineToDb(newExam, userId);
    } catch (err) {
      console.warn('Failed to save exam deadline to Supabase:', err);
    }

    setFeedbackToast(`Added assessment milestone: "${newExam.title}".`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleDeleteExam = async (examId: string) => {
    setExamDeadlines((prev) => {
      const next = prev.filter((e) => e.id !== examId);
      localStorage.setItem('lecturelens_exam_deadlines', JSON.stringify(next));
      return next;
    });

    try {
      await deleteExamDeadlineFromDb(examId, userId);
    } catch (err) {
      console.warn('Failed to delete exam deadline from Supabase:', err);
    }
  };

  // Intelligent Auto-Fill using real lectures, PYQ patterns, and flashcards
  const handleAutoFill = async () => {
    setIsAutofilling(true);
    try {
      const primaryCourse = examAlert?.courseCode || existingCourses[0] || 'General';
      const updated = await autoFillScheduleDeficit({
        blocks,
        targetHours: examAlert?.prepHoursNeeded || 14.0,
        courseCode: primaryCourse,
        lectures,
        dueFlashcards: dueCardsCount,
      });

      const existingIds = new Set(blocks.map((b) => b.id));
      const newAutofilledBlocks = updated.blocks.filter((b) => !existingIds.has(b.id) || b.isAutofilled);

      setBlocks(updated.blocks);
      localStorage.setItem('lecturelens_study_blocks', JSON.stringify(updated.blocks));

      if (newAutofilledBlocks.length > 0) {
        await saveBatchStudyBlocksToDb(newAutofilledBlocks, userId);
      }

      setFeedbackToast('Schedule synchronized with study sessions.');
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err) {
      console.error('Failed to auto-fill schedule:', err);
    } finally {
      setIsAutofilling(false);
    }
  };

  // Explicit Planner Reset
  const handleResetSchedule = () => {
    if (
      !window.confirm(
        'Are you sure you want to reset your study schedule? This will only remove your scheduled study blocks and will NOT delete your lectures, notes, flashcards, quizzes, or exam papers.'
      )
    ) {
      return;
    }

    setBlocks([]);
    localStorage.removeItem('lecturelens_study_blocks');
    setFeedbackToast('Study schedule cleared.');
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Schedule topic from PYQ priority card
  const handleSchedulePyqTopic = (topic: string, courseCode: string) => {
    setAddBlockInitialData({
      title: `⚡ Review: ${topic}`,
      courseCode: courseCode || existingCourses[0] || 'General',
      category: 'deep',
    });
    setIsAddModalOpen(true);
  };

  // Schedule session from empty slot click
  const handleAddBlockForDay = (dayIndex: number) => {
    setAddBlockInitialData({
      dayIndex,
      courseCode: existingCourses[0] || 'General',
      category: 'deep',
    });
    setIsAddModalOpen(true);
  };

  const isPlannerEmpty = blocks.length === 0 && examDeadlines.length === 0;

  return (
    <div className="planner-container">
      {/* Top Header */}
      <div className="adv-view-header">
        <div className="adv-header-left">
          <div className="adv-breadcrumb">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <img
                src="/leclens.jpg"
                alt="LectureLens"
                style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain' }}
              />
              <span style={{ fontWeight: 600 }}>LectureLens</span>
            </span>
            <span>/</span>
            <span>Academic Operations</span>
            <span>/</span>
            <span>Personal Timetable</span>
            <div
              className="adv-breadcrumb-badge"
              style={{
                background: examAlert ? 'rgba(220, 38, 38, 0.08)' : '#f1f5f9',
                color: examAlert ? '#dc2626' : '#475569',
                borderColor: examAlert ? 'rgba(220, 38, 38, 0.2)' : '#e2e8f0',
              }}
            >
              <Calendar size={12} strokeWidth={2} />
              {examAlert && examAlert.daysRemaining != null
                ? `${examAlert.title} in ${examAlert.daysRemaining}d`
                : 'Active Timetable'}
            </div>
          </div>
          <h1 className="adv-view-title">Adaptive Study Planner & Academic Calendar</h1>
          <p className="adv-view-subtitle">
            Dynamic review blocks scheduled around upcoming exam milestones and FSRS memory decay curves.
          </p>
        </div>

        <div className="adv-header-actions">
          {blocks.length > 0 && (
            <button
              type="button"
              className="adv-btn-secondary"
              onClick={handleResetSchedule}
              title="Reset study schedule"
            >
              <RotateCcw size={15} color="#777587" strokeWidth={1.5} />
              Reset Schedule
            </button>
          )}

          <button
            type="button"
            className="adv-btn-secondary"
            onClick={() => setIsAddExamModalOpen(true)}
          >
            <Award size={15} color="#dc2626" strokeWidth={1.5} />
            Add Exam
          </button>

          <button
            type="button"
            className="adv-btn-primary"
            onClick={() => {
              setAddBlockInitialData(undefined);
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={16} strokeWidth={2} />
            Add Study Block
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackToast && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles size={16} color="#10b981" />
          {feedbackToast}
        </div>
      )}

      {/* Top Urgency Ribbon: Neutral state if no exam, Priority Alert if exam exists */}
      <StudyUrgencyRibbon
        examAlert={examAlert}
        dailyTarget={dailyTarget}
        onAutoFillGap={handleAutoFill}
        onAddExam={() => setIsAddExamModalOpen(true)}
        isAutofilling={isAutofilling}
      />

      {/* Empty State Banner when user has not created study blocks or exams yet */}
      {isPlannerEmpty && (
        <EmptyState
          icon={Calendar}
          title="Your study plan starts here"
          description="Create your first study block or add an upcoming exam to build a personalized study schedule."
          actionLabel="Add Study Block"
          onAction={() => {
            setAddBlockInitialData(undefined);
            setIsAddModalOpen(true);
          }}
          secondaryLabel="Add Exam"
          onSecondaryAction={() => setIsAddExamModalOpen(true)}
          badgeText="Study Operations"
        />
      )}

      {/* Main 2-Column Responsive Layout: Calendar (flex) + Backlog Insights (fixed 360px) */}
      <div className="planner-main-split-grid">
        {/* Left Column: 7-Day Interactive Calendar */}
        <div style={{ minWidth: 0 }}>
          <StudyCalendarGrid
            blocks={blocks}
            onSelectBlock={(blk) => setSelectedBlock(blk)}
            onToggleComplete={handleToggleComplete}
            weekLabel={getDynamicWeekLabel()}
            onAddBlockForDay={handleAddBlockForDay}
          />
        </div>

        {/* Right Column: Real FSRS Queue, Real Milestones & PYQ Priorities */}
        <div style={{ minWidth: 0 }}>
          <StudyBacklogPanel
            dueFlashcardsCount={dueCardsCount}
            dueBreakdown={dueBreakdown}
            examDeadlines={examDeadlines}
            pyqPatterns={pyqPatterns}
            onNavigateToFlashcards={onNavigateToFlashcards}
            onNavigateToLecture={onNavigateToLecture}
            onAddExam={() => setIsAddExamModalOpen(true)}
            onDeleteExam={handleDeleteExam}
            onSchedulePyqTopic={handleSchedulePyqTopic}
          />
        </div>
      </div>

      {/* Modal Inspector for Clicking Existing Block */}
      {selectedBlock && (
        <StudyBlockModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onNavigateToLecture={onNavigateToLecture}
          onNavigateToFlashcards={onNavigateToFlashcards}
          onToggleComplete={handleToggleComplete}
          onDeleteBlock={handleDeleteStudyBlock}
        />
      )}

      {/* Add Study Block Modal */}
      <AddStudyBlockModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddBlockInitialData(undefined);
        }}
        onSave={handleCreateStudyBlock}
        initialData={addBlockInitialData}
        existingCourses={existingCourses}
      />

      {/* Add Exam Milestone Modal */}
      <AddExamModal
        isOpen={isAddExamModalOpen}
        onClose={() => setIsAddExamModalOpen(false)}
        onSave={handleCreateExam}
        existingCourses={existingCourses}
      />
    </div>
  );
};
