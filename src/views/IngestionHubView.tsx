import React, { useState, useEffect } from 'react';
import {
  FileText,
  Mic,
  Video,
  Edit3,
  PlayCircle,
  Clock,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import type { Lecture } from '../types/lecture';
import { checkBackendHealth, fetchRecallSummary } from '../services/api';
import { PdfUploader } from '../components/ingestion/PdfUploader';
import { AudioUploader } from '../components/ingestion/AudioUploader';
import { YouTubeUploader } from '../components/ingestion/YouTubeUploader';
import { ManualTranscriptEditor } from '../components/ingestion/ManualTranscriptEditor';
import { LectureInspectorDrawer } from '../components/ingestion/LectureInspectorDrawer';
import '../styles/ingestion.css';

interface IngestionHubViewProps {
  lectures: Lecture[];
  onIngestSuccess: (lecture: Lecture) => void;
  onOpenWorkspace: (lecture: Lecture) => void;
}

export const IngestionHubView: React.FC<IngestionHubViewProps> = ({
  lectures,
  onIngestSuccess,
  onOpenWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'audio' | 'youtube' | 'manual'>('pdf');
  const [selectedLecture, setSelectedLecture] = useState<Lecture>(lectures[0] || null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'demo'>('checking');
  const [recallSummary, setRecallSummary] = useState<Record<string, { flashcardCount: number; quizQuestionCount: number }>>({});
  const [manualInitialData, setManualInitialData] = useState<{ title: string; text: string }>({
    title: '',
    text: '',
  });

  useEffect(() => {
    checkBackendHealth().then((res) => {
      setBackendStatus(res.isOnline ? 'connected' : 'demo');
    });
    fetchRecallSummary()
      .then((summary) => {
        if (summary) setRecallSummary(summary);
      })
      .catch(() => {});
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

    return { flashcardCount: fcCount, quizQuestionCount: quizCount };
  };

  const handleUploadSuccess = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    onIngestSuccess(lecture);
    onOpenWorkspace(lecture);
  };

  const handleSwitchToManualFromYoutube = (title: string, url: string) => {
    setManualInitialData({
      title,
      text: url ? `YouTube Lecture URL: ${url}\n\n` : '',
    });
    setActiveTab('manual');
  };

  const handleSwitchToManualFromAudio = (filename: string) => {
    setManualInitialData({
      title: filename ? filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Lecture Recording Notes',
      text: '',
    });
    setActiveTab('manual');
  };

  return (
    <div className="ingestion-hub-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Top Header & Metric Strip */}
      <div className="ingest-header-section">
        <div className="ingest-top-title-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-label)', color: 'var(--color-on-surface-variant)' }}>
              <span>Academic Vault</span>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--color-primary-container)', fontWeight: 600 }}>
                Media & Ingestion Pipeline
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--text-display)', fontWeight: 700, color: 'var(--color-on-surface)', marginTop: '4px' }}>
              Lecture Library & Ingestion Hub
            </h1>
          </div>

          <div className="ingest-metric-strip">
            <div className="ingest-metric-chip">
              <PlayCircle size={16} color="var(--color-primary-container)" />
              <span><strong>{lectures.length}</strong> Lectures Indexed</span>
            </div>
            <div className="ingest-metric-chip">
              <Clock size={16} color="#0ea5e9" />
              <span><strong>38h 42m</strong> Recorded Audio</span>
            </div>
            <div className="ingest-metric-chip">
              <BookOpen size={16} color="var(--color-primary-container)" />
              <span><strong>4</strong> Active Courses</span>
            </div>
            <div className="ingest-metric-chip">
              <span className={`status-dot ${backendStatus === 'connected' ? 'connected animate-pulse-subtle' : 'demo'}`} />
              <span><strong>AI Engine:</strong> {backendStatus === 'connected' ? 'Local Whisper (int8)' : 'Browser Simulation'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Split-Grid Layout: 8 cols for Ingestion & Library, 4 cols for Inspector Drawer */}
      <div
        className="ingestion-split-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: 'var(--space-xl)',
          alignItems: 'start',
        }}
      >
        {/* Left Column: 4 Ingestion Tabs + Recent Ingestion Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Tab Selection Bar */}
          <div className="ingest-tabs-container">
            <button
              className={`ingest-tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf')}
            >
              <FileText size={18} />
              <span>Slide Deck & Handouts (PDF)</span>
            </button>
            <button
              className={`ingest-tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveTab('audio')}
            >
              <Mic size={18} />
              <span>Audio / Video Recording</span>
            </button>
            <button
              className={`ingest-tab-btn ${activeTab === 'youtube' ? 'active' : ''}`}
              onClick={() => setActiveTab('youtube')}
            >
              <Video size={18} />
              <span>YouTube Lecture URL</span>
            </button>
            <button
              className={`ingest-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <Edit3 size={18} />
              <span>Manual Transcript / Notes</span>
            </button>
          </div>

          {/* Active Uploader Card */}
          <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
            {activeTab === 'pdf' && <PdfUploader onSuccess={handleUploadSuccess} />}
            {activeTab === 'audio' && (
              <AudioUploader
                onSuccess={handleUploadSuccess}
                onSwitchToManual={handleSwitchToManualFromAudio}
              />
            )}
            {activeTab === 'youtube' && (
              <YouTubeUploader
                onSuccess={handleUploadSuccess}
                onSwitchToManual={handleSwitchToManualFromYoutube}
              />
            )}
            {activeTab === 'manual' && (
              <ManualTranscriptEditor
                onSuccess={handleUploadSuccess}
                initialTitle={manualInitialData.title}
                initialText={manualInitialData.text}
              />
            )}
          </div>

          {/* Google Meet & Conference Ingestion Feature Card */}
          <div
            className="glass-card"
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  flexShrink: 0,
                }}
              >
                <Video size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
                    Google Meet & Zoom Lecture Ingestion
                  </h4>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(14, 165, 233, 0.15)',
                      color: '#0284c7',
                      fontWeight: 600,
                    }}
                  >
                    Workflow Supported
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', margin: '3px 0 0 0' }}>
                  Download recorded video (<code>.mp4</code>/<code>.m4a</code>) from Google Drive and drop into Audio / Video for speech-to-text, or paste Google Docs captions into Manual Notes.
                </p>
              </div>
            </div>

            <button
              className="btn-secondary-action"
              onClick={() => setActiveTab('audio')}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Mic size={14} />
              <span>Open Audio Uploader</span>
            </button>
          </div>

          {/* Recently Processed Media Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <h3 style={{ fontSize: 'var(--text-title)', fontWeight: 600, color: 'var(--color-on-surface)' }}>
              Processed Lectures in Library
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {lectures.map((lec) => {
                const isSelected = selectedLecture?.id === lec.id;
                return (
                  <div
                    key={lec.id}
                    className="glass-card"
                    onClick={() => setSelectedLecture(lec)}
                    style={{
                      padding: 'var(--space-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderColor: isSelected ? 'var(--color-primary-container)' : undefined,
                      background: isSelected ? 'var(--color-surface-container-low)' : undefined,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="course-code-badge">{lec.courseCode}</span>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                          {lec.title}
                        </h4>
                        <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{lec.date} • {lec.duration} • {lec.concepts.length} Key Concepts</span>
                          {(() => {
                            const counts = getLectureCounts(lec.id);
                            return (
                              <>
                                {counts.flashcardCount > 0 && (
                                  <span style={{ color: 'var(--color-primary-container)', fontWeight: 600 }}>
                                    • {counts.flashcardCount} Flashcards
                                  </span>
                                )}
                                {counts.quizQuestionCount > 0 && (
                                  <span style={{ color: '#059669', fontWeight: 600 }}>
                                    • {counts.quizQuestionCount} Quiz Qs
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn-secondary-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenWorkspace(lec);
                      }}
                    >
                      Open Notes
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Lecture Inspector Drawer */}
        {selectedLecture && (
          <LectureInspectorDrawer
            lecture={selectedLecture}
            onOpenWorkspace={onOpenWorkspace}
          />
        )}
      </div>
    </div>
  );
};

export default IngestionHubView;
