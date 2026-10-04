import React, { useState, useEffect, useMemo } from 'react';
import {
  UploadCloud,
  Play,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { Lecture, CourseFilter } from '../../types/lecture';
import type { ActiveView } from '../../types/navigation';
import { EmptyState } from '../common/EmptyState';
import { SkeletonCard } from '../common/Skeleton';
import { fetchRecallSummary } from '../../services/api';

interface RecentLecturesProps {
  lectures: Lecture[];
  onSelectLecture?: (lecture: Lecture) => void;
  onNavigate: (view: ActiveView) => void;
  onUploadClick?: () => void;
  isLoading?: boolean;
}

export const RecentLectures: React.FC<RecentLecturesProps> = ({
  lectures,
  onSelectLecture,
  onNavigate,
  onUploadClick,
  isLoading = false,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [recallSummary, setRecallSummary] = useState<Record<string, { flashcardCount: number; quizQuestionCount: number }>>({});

  useEffect(() => {
    let isMounted = true;
    fetchRecallSummary()
      .then((summary) => {
        if (isMounted && summary) {
          setRecallSummary(summary);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [lectures]);

  const getLectureCounts = (lecId: string) => {
    const fromApi = recallSummary[lecId];
    let fcCount = fromApi?.flashcardCount ?? 0;
    let quizCount = fromApi?.quizQuestionCount ?? 0;

    if (fcCount === 0) {
      try {
        const cached = localStorage.getItem(`lecturelens_flashcards_${lecId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) fcCount = parsed.length;
        }
      } catch {}
    }

    if (quizCount === 0) {
      try {
        const cached = localStorage.getItem(`lecturelens_quiz_${lecId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.questions)) quizCount = parsed.questions.length;
        }
      } catch {}
    }

    // Check if quiz has a completed submission
    let quizCompleted = false;
    let quizScoreStr = '';
    try {
      const cachedRes = localStorage.getItem(`lecturelens_quiz_result_${lecId}`);
      if (cachedRes) {
        const parsed = JSON.parse(cachedRes);
        if (parsed && typeof parsed.score === 'number') {
          quizCompleted = true;
          quizScoreStr = `${parsed.score}/${parsed.totalQuestions || 5} (${parsed.percentage || 0}%)`;
        }
      }
    } catch {}

    // Check if lecture has notes
    let hasNotes = false;
    try {
      const cachedNotes = localStorage.getItem(`lecturelens_notes_${lecId}`);
      if (cachedNotes) {
        const parsed = JSON.parse(cachedNotes);
        if (parsed && (parsed.summary || parsed.markdown)) hasNotes = true;
      }
    } catch {}

    return { flashcardCount: fcCount, quizQuestionCount: quizCount, quizCompleted, quizScoreStr, hasNotes };
  };

  // Dynamically compute courses from actual lectures so we never display fake course counts
  const dynamicCourses = useMemo<CourseFilter[]>(() => {
    const counts: Record<string, { code: string; name: string; count: number }> = {};

    lectures.forEach((lec) => {
      const code = lec.courseCode || 'General';
      const name = lec.courseName || (code === 'General' ? 'General Academic' : code);
      if (!counts[code]) {
        counts[code] = { code, name, count: 0 };
      }
      counts[code].count += 1;
    });

    const list: CourseFilter[] = [
      { id: 'all', code: 'ALL', name: 'All Courses', count: lectures.length },
    ];

    Object.entries(counts).forEach(([code, item]) => {
      list.push({
        id: `course-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        code,
        name: item.name,
        count: item.count,
      });
    });

    return list;
  }, [lectures]);

  const filteredLectures =
    selectedCourse === 'all'
      ? lectures
      : lectures.filter((lec) => {
          const course = dynamicCourses.find((c) => c.id === selectedCourse);
          return course ? (lec.courseCode || 'General') === course.code : true;
        });

  const handleLectureAction = (lecture: Lecture, action: 'resume' | 'notes' | 'summary') => {
    if (onSelectLecture) {
      onSelectLecture(lecture);
    }
    if (action === 'resume' || action === 'notes') {
      onNavigate('workspace');
    } else {
      onNavigate('workspace');
    }
  };

  const handleDropzoneClick = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      onNavigate('ingest');
    }
  };

  return (
    <section className="recent-lectures-section" aria-label="Recent Lectures and Media">
      {/* Header with Title and Course Filter Pills */}
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Recent Lectures & Media</h2>
          <p className="section-subtitle">
            Transcribed recordings, slide decks, and AI-structured academic units
          </p>
        </div>
      </div>

      {/* Course Filter Pills */}
      <div className="filter-pills-row" role="tablist" aria-label="Filter lectures by course">
        {dynamicCourses.map((course: CourseFilter) => {
          const isActive = selectedCourse === course.id;
          return (
            <button
              key={course.id}
              className={`filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCourse(course.id)}
              role="tab"
              aria-selected={isActive}
            >
              {course.name} ({course.count})
            </button>
          );
        })}
      </div>

      {/* Upload Dropzone Bar */}
      <div
        className="dropzone-bar"
        onClick={handleDropzoneClick}
        role="button"
        tabIndex={0}
        aria-label="Upload lecture recording or lecture slides"
      >
        <div className="dropzone-content">
          <div className="dropzone-icon-tile">
            <UploadCloud size={22} strokeWidth={2} />
          </div>
          <div className="dropzone-text">
            <span className="dropzone-headline">
              Drop lecture recording or lecture slides here
            </span>
            <span className="dropzone-subcopy">
              MP4, M4A, Zoom recordings, or PDF slide decks • AI transcription in &lt;60s
            </span>
          </div>
        </div>

        <button
          className="browse-files-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleDropzoneClick();
          }}
        >
          Browse Files
        </button>
      </div>

      {/* Lecture List Items */}
      <div className="lectures-list">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <SkeletonCard height="130px" />
            <SkeletonCard height="130px" />
            <SkeletonCard height="130px" />
          </div>
        ) : filteredLectures.length === 0 ? (
          lectures.length === 0 ? (
            <EmptyState
              icon={UploadCloud}
              title="Your Lecture Vault is Empty"
              description="Upload your lecture slides (PDF), audio/video recording, or YouTube link to start building your personal study vault."
              actionLabel="+ Upload Your First Lecture"
              onAction={handleDropzoneClick}
              badgeText="Personal Vault"
            />
          ) : (
            <EmptyState
              icon={Filter}
              title="No Lectures in this Filter"
              description="No recordings or slide decks match the selected course. Drop a new lecture or reset the filter."
              actionLabel="View All Courses"
              onAction={() => setSelectedCourse('all')}
              variant="compact"
            />
          )
        ) : (
          filteredLectures.map((lecture) => {
            const savedProg = (() => {
              if (lecture.progressSeconds && lecture.progressSeconds > 0) return lecture.progressSeconds;
              try {
                const c = localStorage.getItem(`lecturelens_progress_${lecture.id}`);
                if (c !== null) {
                  const val = Number(c);
                  if (!isNaN(val) && val > 0) return val;
                }
              } catch {}
              return 0;
            })();

            const progressPercent = savedProg
              ? Math.min(100, Math.round((savedProg / (lecture.durationSeconds || 3150)) * 100))
              : 0;

            const formatTime = (secs: number) => {
              const m = Math.floor(secs / 60);
              const s = Math.floor(secs % 60);
              return `${m}:${s < 10 ? '0' : ''}${s}`;
            };

            return (
              <div key={lecture.id} className="lecture-card-item">
                {/* Header: Course Code, Date, Duration & Sync Tag */}
                <div>
                  <div className="lecture-card-header">
                    <div>
                      <div className="lecture-meta-badges">
                        <span className="course-code-badge">{lecture.courseCode || 'General'}</span>
                        <span className="lecture-date-text">• {lecture.date}</span>
                        <span className="lecture-date-text" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {lecture.duration}
                        </span>
                      </div>
                      <h3 className="lecture-title">{lecture.title}</h3>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <CheckCircle2 size={12} /> {lecture.status === 'processing' ? 'Processing' : 'Synced & Indexed'}
                    </div>
                  </div>

                  <p className="lecture-summary-text" style={{ marginTop: '8px' }}>
                    {lecture.summary || (lecture.transcript?.[0]?.text ? `${lecture.transcript[0].text.slice(0, 160)}...` : 'Transcribed lecture recording ready for study.')}
                  </p>
                </div>

                {/* Audio Progress Scrubber */}
                {lecture.hasAudio && (
                  <div className="audio-track-box">
                    <button
                      onClick={() => handleLectureAction(lecture, 'resume')}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'var(--color-primary-container)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Play from last position"
                    >
                      <Play size={12} fill="#ffffff" />
                    </button>
                    <div className="audio-track-progress">
                      <div
                        className="audio-track-fill"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="audio-timecode">
                      {savedProg > 0
                        ? `${formatTime(savedProg)} / ${lecture.duration}`
                        : lecture.duration}
                    </span>
                  </div>
                )}

                {/* Footer: Concepts & Action Buttons */}
                <div className="lecture-footer-row">
                  <div className="lecture-tags-group">
                    {(lecture.concepts || [])
                      .filter((concept) => {
                        const text = `${lecture.title || ''} ${lecture.summary || ''}`.toLowerCase();
                        const isNeuroOrPhys = text.includes('neuro') || text.includes('synaptic') || text.includes('quantum') || text.includes('physics');
                        if (!isNeuroOrPhys) {
                          const badList = [
                            'equilibrium state vector',
                            'feedback amplification',
                            'nmda',
                            'camkii',
                            'hebb',
                            'synaptic plasticity',
                            'action potential',
                          ];
                          if (badList.some((t) => concept.term.toLowerCase().includes(t))) return false;
                        }
                        return true;
                      })
                      .slice(0, 3)
                      .map((concept) => (
                        <span key={concept.id} className="concept-tag">
                          {concept.term}
                        </span>
                      ))}
                    {(() => {
                      const counts = getLectureCounts(lecture.id);
                      return (
                        <>
                          {counts.hasNotes && (
                            <span
                              className="concept-tag"
                              style={{
                                background: 'rgba(59, 130, 246, 0.08)',
                                color: '#2563eb',
                                fontWeight: 600,
                              }}
                            >
                              Notes Ready
                            </span>
                          )}
                          {counts.flashcardCount > 0 && (
                            <span
                              className="concept-tag"
                              style={{
                                background: 'rgba(79, 70, 229, 0.08)',
                                color: 'var(--color-primary-container)',
                                fontWeight: 600,
                              }}
                            >
                              Flashcards · {counts.flashcardCount}
                            </span>
                          )}
                          {counts.quizCompleted ? (
                            <span
                              className="concept-tag"
                              style={{
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#047857',
                                fontWeight: 700,
                              }}
                            >
                              ✓ Quiz {counts.quizScoreStr}
                            </span>
                          ) : counts.quizQuestionCount > 0 ? (
                            <span
                              className="concept-tag"
                              style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                color: '#059669',
                                fontWeight: 600,
                              }}
                            >
                              Quiz · {counts.quizQuestionCount} questions
                            </span>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>

                  <div className="lecture-buttons-group">
                    <button
                      className="btn-secondary-action"
                      onClick={() => handleLectureAction(lecture, 'summary')}
                    >
                      <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      AI Summary
                    </button>

                    <button
                      className="btn-secondary-action"
                      onClick={() => handleLectureAction(lecture, 'notes')}
                    >
                      <BookOpen size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Smart Notes
                    </button>

                    <button
                      className="btn-primary-action"
                      onClick={() => handleLectureAction(lecture, 'resume')}
                    >
                      <span>Resume</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default RecentLectures;
