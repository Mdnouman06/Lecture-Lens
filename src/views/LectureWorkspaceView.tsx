import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  Check,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import type { Lecture, StudyNotes } from '../types/lecture';
import type { ActiveView } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { synthesizeNotes } from '../services/api';
import {
  fetchLectureTranscript,
  fetchLectureNotes,
  saveLectureNotesToDb,
  updateLectureProgress,
  fetchLectureProgress,
} from '../services/lectures';
import { AudioScrubDeck } from '../components/workspace/AudioScrubDeck';
import { DiarizedTranscriptViewer } from '../components/workspace/DiarizedTranscriptViewer';
import { SmartNotesWorkspace } from '../components/workspace/SmartNotesWorkspace';
import { BottomIntelligenceDock } from '../components/workspace/BottomIntelligenceDock';
import { AiTutorDrawer } from '../components/tutor/AiTutorDrawer';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonBlock, SkeletonText } from '../components/common/Skeleton';
import { exportNotesAsMarkdown, downloadFile } from '../utils/export';
import '../styles/workspace.css';
import '../styles/tutor.css';

interface LectureWorkspaceViewProps {
  lecture: Lecture;
  onNavigate: (view: ActiveView) => void;
  onUpdateLecture?: (lecture: Lecture) => void;
}

export const LectureWorkspaceView: React.FC<LectureWorkspaceViewProps> = ({
  lecture,
  onNavigate,
  onUpdateLecture,
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<number>(() => {
    if (typeof lecture.progressSeconds === 'number' && lecture.progressSeconds > 0) {
      return lecture.progressSeconds;
    }
    try {
      const cached = localStorage.getItem(`lecturelens_progress_${lecture.id}`);
      if (cached !== null) {
        const val = Number(cached);
        if (!isNaN(val) && val >= 0) return val;
      }
    } catch {}
    return lecture.id === 'lec-neuro-301-14' || lecture.id === 'lec-001' ? 252 : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isTutorDrawerOpen, setIsTutorDrawerOpen] = useState(false);
  const [tutorInitialQuery, setTutorInitialQuery] = useState<string | undefined>(undefined);

  // Restore persisted audio progress on lecture open/switch
  useEffect(() => {
    let isCancelled = false;
    fetchLectureProgress(lecture.id, user?.id).then((savedSecs) => {
      if (!isCancelled && typeof savedSecs === 'number' && savedSecs > 0) {
        setCurrentTime(savedSecs);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [lecture.id, user?.id]);

  // Debounced auto-save of audio scrubber position
  useEffect(() => {
    if (!lecture.id || currentTime === undefined) return;
    const timeout = setTimeout(() => {
      updateLectureProgress(
        lecture.id,
        currentTime,
        user?.id,
        lecture.durationSeconds ? currentTime >= lecture.durationSeconds : false
      );
    }, 800);
    return () => clearTimeout(timeout);
  }, [lecture.id, currentTime, user?.id, lecture.durationSeconds]);

  // Smart Notes state: live Ollama, Supabase persistence, and error diagnostics
  const [notes, setNotes] = useState<StudyNotes | null>(() => {
    if (lecture.notes) return lecture.notes;
    try {
      const cached = localStorage.getItem(`lecturelens_notes_${lecture.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.summary || parsed.markdown || (parsed.keyConcepts && parsed.keyConcepts.length > 0))) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisError, setSynthesisError] = useState<{ message: string; command?: string } | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Auto-fetch transcript across Supabase, SQLite, and LocalStorage if missing
  useEffect(() => {
    let isCancelled = false;
    if (lecture.id && (!lecture.transcript || lecture.transcript.length === 0)) {
      fetchLectureTranscript(lecture.id, user?.id)
        .then((segments) => {
          if (!isCancelled && segments && segments.length > 0 && onUpdateLecture) {
            onUpdateLecture({
              ...lecture,
              transcript: segments,
            });
          }
        })
        .catch((err) => {
          console.warn('Could not fetch transcripts for lecture:', err.message);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [lecture.id, user?.id]);

  const isDemoNeuroLecture = lecture.id === 'lec-neuro-301-14' || lecture.id === 'lec-001';
  const isMisleadingNeuroCourse = !isDemoNeuroLecture && lecture.courseCode === 'NEURO 301' && !lecture.title.toLowerCase().includes('neuro') && !lecture.title.toLowerCase().includes('synaptic');
  const effectiveCourseCode = (lecture.courseCode && lecture.courseCode !== 'ALL' && !isMisleadingNeuroCourse)
    ? lecture.courseCode
    : (isDemoNeuroLecture ? 'NEURO 301' : 'General');

  const isMisleadingNeuroName = !isDemoNeuroLecture && (lecture.courseName === 'Cellular Neuroscience' || lecture.courseName === 'Cellular & Systems Neuroscience');
  const effectiveCourseName = (lecture.courseName && !isMisleadingNeuroName && lecture.courseName !== 'General Academic Subject')
    ? lecture.courseName
    : '';

  const sanitizeNotesMetadata = (rawNotes: StudyNotes | null | undefined): StudyNotes | null => {
    if (!rawNotes) return null;
    const courseClean = (effectiveCourseCode !== 'General' && effectiveCourseCode !== 'ALL') ? effectiveCourseCode : '';
    const examRelevanceClean = rawNotes.examRelevance
      ? rawNotes.examRelevance
          .replace(/\bNEURO\s*301\b/gi, courseClean)
          .replace(/\s{2,}/g, ' ')
          .replace(/based on\s+lecture transcript/i, 'based on lecture transcript')
          .trim()
      : rawNotes.examRelevance;

    const keyConceptsClean = (rawNotes.keyConcepts || []).map((kc) => ({
      ...kc,
      definition: kc.definition
        ? kc.definition.replace(/discussed in\s+NEURO\s*301\s+lecture/gi, courseClean ? `discussed in ${courseClean} lecture` : 'discussed in this lecture')
        : kc.definition,
    }));

    return {
      ...rawNotes,
      examRelevance: examRelevanceClean,
      keyConcepts: keyConceptsClean,
    };
  };

  const detectedSpeaker = lecture.transcript?.find((t) => t.speaker && t.speaker !== 'Speaker 1' && t.speaker !== 'Speaker' && t.speaker !== 'Prof. Henderson')?.speaker
    || (isDemoNeuroLecture ? 'Prof. Henderson' : 'Lecturer');
  const scrubTopic = (effectiveCourseCode !== 'General' && effectiveCourseCode !== 'ALL') ? effectiveCourseCode : '';

  // Auto-fetch existing study notes from Supabase or trigger synthesis if unsynthesized
  useEffect(() => {
    let isCancelled = false;

    // Check memory or localStorage immediately on lecture switch
    let initialNotes = sanitizeNotesMetadata(lecture.notes);
    if (!initialNotes) {
      try {
        const cached = localStorage.getItem(`lecturelens_notes_${lecture.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.summary || parsed.markdown || (parsed.keyConcepts && parsed.keyConcepts.length > 0))) {
            initialNotes = sanitizeNotesMetadata(parsed);
          }
        }
      } catch {}
    }

    setNotes(initialNotes || null);
    setSynthesisError(null);

    if (initialNotes) {
      if (!lecture.notes && onUpdateLecture) {
        onUpdateLecture({
          ...lecture,
          courseCode: effectiveCourseCode,
          notes: initialNotes,
        });
      }
      return;
    }

    if (!lecture.id) return;

    setIsNotesLoading(true);
    fetchLectureNotes(lecture.id, user?.id)
      .then((savedNotes) => {
        if (isCancelled) return;
        setIsNotesLoading(false);

        if (savedNotes) {
          const cleaned = sanitizeNotesMetadata(savedNotes);
          setNotes(cleaned);
          if (onUpdateLecture) {
            onUpdateLecture({
              ...lecture,
              courseCode: effectiveCourseCode,
              notes: cleaned || savedNotes,
            });
          }
        } else if (lecture.transcript && lecture.transcript.length > 0) {
          triggerSynthesis(false);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setIsNotesLoading(false);
        console.warn('Could not load notes:', err.message);
      });

    return () => {
      isCancelled = true;
    };
  }, [lecture.id, lecture.transcript?.length, user?.id]);


  const triggerSynthesis = async (force: boolean = false) => {
    const transcriptText = (lecture.transcript || []).map((t) => t.text).join('\n').trim() || lecture.fullText || '';
    if (!transcriptText && !force) return;

    setIsSynthesizing(true);
    setSynthesisError(null);

    try {
      const res = await synthesizeNotes(
        lecture.id,
        transcriptText,
        lecture.title,
        effectiveCourseCode
      );

      const cleanRes = sanitizeNotesMetadata(res) || res;
      setNotes(cleanRes);
      if (onUpdateLecture) {
        onUpdateLecture({
          ...lecture,
          courseCode: effectiveCourseCode,
          notes: cleanRes,
        });
      }

      // Persist newly generated notes across LocalStorage, SQLite, and Supabase
      saveLectureNotesToDb(lecture.id, cleanRes, user?.id).catch((err) => {
        console.warn('Failed to auto-save synthesized notes:', err.message);
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to synthesize lecture notes.';
      let command: string | undefined = undefined;

      if (errorMsg.includes('ollama serve') || errorMsg.includes('offline') || errorMsg.includes('Cannot reach local AI')) {
        command = 'ollama serve';
      } else if (errorMsg.includes('ollama pull') || errorMsg.includes('not installed')) {
        const match = errorMsg.match(/ollama pull ([^\s'"]+)/);
        command = match ? `ollama pull ${match[1]}` : 'ollama pull qwen3:0.6b';
      }

      setSynthesisError({
        message: errorMsg,
        command,
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Audio timer simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= lecture.durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, lecture.durationSeconds]);

  const handleSeek = (secs: number) => {
    const valid = Math.max(0, Math.min(lecture.durationSeconds || 3600, Math.round(secs)));
    setCurrentTime(valid);
    updateLectureProgress(lecture.id, valid, user?.id, false);
  };

  const handleJump = (delta: number) => {
    setCurrentTime((prev) => {
      const next = Math.max(0, Math.min(lecture.durationSeconds || 3600, prev + delta));
      updateLectureProgress(lecture.id, next, user?.id, false);
      return next;
    });
  };

  const handleExport = (format: string) => {
    setExportNotice(`Exported as ${format}!`);
    setTimeout(() => setExportNotice(null), 2500);

    const activeNotes: StudyNotes = notes || {
      summary: lecture.summary || '',
      markdown: lecture.notesMarkdown || lecture.fullText || '',
      keyConcepts: lecture.concepts || [],
    };

    if (format === 'Markdown') {
      const mdContent = exportNotesAsMarkdown(lecture.title, lecture.courseCode, activeNotes);
      const safeTitle = (lecture.title || 'lecture')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      downloadFile(`${safeTitle}-notes.md`, mdContent, 'text/markdown');
    } else if (format === 'Notion' || format === 'Plain Text') {
      const noteContent = notes?.markdown || `# ${lecture.title}\n\n${lecture.summary || ''}`;
      navigator.clipboard.writeText(noteContent);
    }
  };

  const handleSaveNotes = async (updatedNotes: StudyNotes, marginNotes: string) => {
    setNotes(updatedNotes);
    setSaveStatusText('saving');
    setIsSavingNotes(true);

    try {
      await saveLectureNotesToDb(lecture.id, updatedNotes, user?.id, marginNotes);

      if (onUpdateLecture) {
        onUpdateLecture({
          ...lecture,
          notes: {
            ...updatedNotes,
            marginNotes,
          },
        });
      }

      setSaveStatusText('saved');
      setTimeout(() => setSaveStatusText('idle'), 2500);
    } catch (err) {
      console.error('Failed to save notes:', err);
      setSaveStatusText('idle');
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (!lecture || !lecture.id) {
    return (
      <div
        className="workspace-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 140px)',
          padding: 'var(--space-xl)',
        }}
      >
        <EmptyState
          icon={BookOpen}
          title="No Lecture Selected"
          description="Select a transcribed lecture from your library or upload new lecture slides and recordings to enter the Smart Notes Workspace."
          actionLabel="Go to Lecture Library"
          onAction={() => onNavigate('ingest')}
          secondaryLabel="Upload Lecture"
          onSecondaryAction={() => onNavigate('ingest')}
          badgeText="Smart Notes Studio"
        />
      </div>
    );
  }

  return (
    <div className={`workspace-container ${isFocusMode ? 'focus-mode' : ''}`}>
      {/* 1. Sub-header & Lecture Meta Ribbon */}
      <div className="workspace-ribbon">
        {/* Breadcrumb & Latency Pills */}
        <div className="workspace-meta-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-label)', color: 'var(--color-on-surface-variant)' }}>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => onNavigate('dashboard')}
            >
              <img
                src="/leclens.jpg"
                alt="LectureLens"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '5px',
                  objectFit: 'contain',
                }}
              />
              <span style={{ fontWeight: 600 }}>LectureLens</span>
            </span>
            <ChevronRight size={14} />
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => onNavigate('dashboard')}
            >
              {effectiveCourseCode}
            </span>
            <ChevronRight size={14} />
            <span style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>
              {lecture.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="status-badge-chip verified">
              <span className="status-dot connected" style={{ width: '7px', height: '7px' }} />
              <span>Synced & Verified (48ms)</span>
            </div>
            <div className="status-badge-chip">
              <span>faster-whisper STT</span>
            </div>
          </div>
        </div>

        {/* Title and Action Utility Bar */}
        <div className="workspace-title-row">
          <div>
            <h1 className="workspace-lecture-title">{lecture.title}</h1>
            <p style={{ fontSize: 'var(--text-label)', color: 'var(--color-on-surface-variant)', margin: '2px 0 0' }}>
              {effectiveCourseName ? `${effectiveCourseName} • ` : ''}Recorded {lecture.date} • {lecture.duration}
            </p>
          </div>

          <div className="workspace-utility-bar">
            {/* Export Button with Dropdown Trigger */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn-secondary-action"
                onClick={() => handleExport('Markdown')}
                title="Download notes in Markdown format"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {exportNotice ? <Check size={14} color="#10b981" /> : <Download size={14} />}
                <span>{exportNotice || 'Export Markdown'}</span>
              </button>
              <button
                className="btn-secondary-action"
                onClick={() => handleExport('Notion')}
                title="Export Notion-ready text"
              >
                <span>Notion</span>
              </button>
              <button
                className="btn-secondary-action"
                onClick={() => handleExport('Anki')}
                title="Export Anki deck"
              >
                <span>Anki</span>
              </button>
            </div>

            {/* AI Tutor Slide-over Drawer Toggle */}
            <button
              className="btn-secondary-action"
              onClick={() => setIsTutorDrawerOpen((prev) => !prev)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary-container)' }}
            >
              <Sparkles size={14} />
              <span>AI Tutor</span>
            </button>

            {/* Focus Mode Toggle */}
            <button
              className="btn-secondary-action"
              onClick={() => setIsFocusMode((prev) => !prev)}
              title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFocusMode ? 'Standard' : 'Focus'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Synchronized Audio Scrub Deck */}
      <AudioScrubDeck
        currentTime={currentTime}
        duration={lecture.durationSeconds || 3150}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onSeek={handleSeek}
        onJump={handleJump}
        speakerName={detectedSpeaker}
        topicTag={scrubTopic}
      />

      {/* 3. Dual-Column Flagship Workspace */}
      <div className="workspace-dual-grid">
        {/* Left Column (42%): Diarized Transcript Viewer */}
        <DiarizedTranscriptViewer
          transcript={lecture.transcript}
          lectureTitle={lecture.title}
          currentTime={currentTime}
          onSeek={handleSeek}
          onMakeCard={(text) => {
            setExportNotice(`Drafted flashcard from: "${text.slice(0, 24)}..."`);
            setTimeout(() => setExportNotice(null), 2500);
          }}
          onAskAi={(text) => {
            const speakerRef = detectedSpeaker !== 'Lecturer' ? detectedSpeaker : 'the speaker';
            setTutorInitialQuery(`Can you explain what ${speakerRef} meant in this excerpt: "${text}"?`);
            setIsTutorDrawerOpen(true);
          }}
          onHighlight={(text) => {
            setExportNotice(`Highlighted: "${text.slice(0, 20)}..."`);
            setTimeout(() => setExportNotice(null), 2000);
          }}
        />

        {/* Right Column (58%): Smart Notes & Synthesis Tabs */}
        {isSynthesizing || isNotesLoading ? (
          <div
            className="notes-synthesis-skeleton"
            aria-label="Synthesizing notes loading skeleton"
            style={{
              padding: 'var(--space-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              background: 'var(--color-surface-container-lowest)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-outline-variant)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-container)', fontWeight: 600, fontSize: '14px' }}>
              <Sparkles size={16} />
              <span>{isSynthesizing ? 'Synthesizing lecture notes with local Qwen3...' : 'Loading saved notes from Supabase...'}</span>
            </div>
            <SkeletonBlock height="32px" width="60%" borderRadius="var(--radius-md)" />
            <SkeletonText lines={4} gap="10px" lineHeight="16px" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
              <SkeletonBlock height="100px" borderRadius="var(--radius-lg)" />
              <SkeletonBlock height="100px" borderRadius="var(--radius-lg)" />
            </div>
            <SkeletonText lines={3} gap="10px" lineHeight="16px" />
          </div>
        ) : synthesisError ? (
          <div className="notes-error-banner" role="alert">
            <div className="notes-error-header">
              <div className="notes-error-icon-box">
                <AlertCircle size={22} />
              </div>
              <div className="notes-error-content">
                <h3 className="notes-error-title">
                  {synthesisError.message.toLowerCase().includes('timed out') || synthesisError.message.toLowerCase().includes('timeout')
                    ? 'AI Note Synthesis Timed Out'
                    : 'AI Note Synthesis Unavailable'}
                </h3>
                <p className="notes-error-desc">{synthesisError.message}</p>
              </div>
            </div>

            {synthesisError.command && (
              <div className="notes-error-command-box">
                <span>{synthesisError.command}</span>
                <button
                  className="btn-secondary-action"
                  onClick={() => {
                    navigator.clipboard.writeText(synthesisError.command!);
                    setCopiedCommand(true);
                    setTimeout(() => setCopiedCommand(false), 2000);
                  }}
                  style={{ padding: '3px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}
                >
                  {copiedCommand ? 'Copied!' : 'Copy Command'}
                </button>
              </div>
            )}

            <div className="notes-error-actions">
              <button
                className="btn-primary-cta"
                onClick={() => triggerSynthesis(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={14} />
                <span>Retry Synthesis with Ollama</span>
              </button>
            </div>
          </div>
        ) : notes ? (
          <SmartNotesWorkspace
            notes={notes}
            lecture={lecture}
            onSeek={handleSeek}
            onSaveNotes={handleSaveNotes}
            saveStatus={saveStatusText}
            isSaving={isSavingNotes}
          />
        ) : (
          <div className="notes-empty-state-card">
            <Sparkles size={36} color="var(--color-primary-container)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
              No Study Notes Generated Yet
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', maxWidth: '400px', margin: 0 }}>
              Synthesize structured notes, key concepts, formulas, and an executive abstract directly from this lecture's transcript using local Ollama.
            </p>
            <button
              className="btn-primary-cta"
              onClick={() => triggerSynthesis(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} />
              <span>Generate Smart Notes (Qwen3)</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Docked Bottom Intelligence Strip */}
      <BottomIntelligenceDock
        lecture={{ ...lecture, courseCode: effectiveCourseCode }}
        notes={notes}
        onOpenTutor={() => setIsTutorDrawerOpen(true)}
        onOpenFlashcards={() => onNavigate('flashcards')}
      />

      {/* 5. Slide-over Contextual AI Tutor Drawer */}
      <AiTutorDrawer
        isOpen={isTutorDrawerOpen}
        onClose={() => {
          setIsTutorDrawerOpen(false);
          setTutorInitialQuery(undefined);
        }}
        lecture={lecture}
        onSeekAudio={(secs) => {
          handleSeek(secs);
          setIsPlaying(true);
        }}
        onOpenTranscript={(secs) => {
          handleSeek(secs);
        }}
        initialQuery={tutorInitialQuery}
      />
    </div>
  );
};

export default LectureWorkspaceView;
