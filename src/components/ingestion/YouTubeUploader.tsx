import React, { useState } from 'react';
import { Video, Search, AlertCircle, Loader2, Edit3 } from 'lucide-react';
import type { Lecture } from '../../types/lecture';
import { fetchYouTube } from '../../services/api';

interface YouTubeUploaderProps {
  onSuccess: (lecture: Lecture) => void;
  onSwitchToManual?: (title: string, url: string) => void;
  defaultCourseCode?: string;
}

export const YouTubeUploader: React.FC<YouTubeUploaderProps> = ({
  onSuccess,
  onSwitchToManual,
  defaultCourseCode = 'General',
}) => {
  const [url, setUrl] = useState('');
  const [courseCode, setCourseCode] = useState(defaultCourseCode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusStage, setStatusStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setStatusStage('Fetching native captions...');

    // Dynamic timer-based status updates for fallback progression
    const timer1 = setTimeout(() => {
      setStatusStage('Captions unavailable — extracting lecture audio and transcribing locally…');
    }, 2500);

    const timer2 = setTimeout(() => {
      setStatusStage('Transcribing with faster-whisper…');
    }, 7000);

    try {
      const lecture = await fetchYouTube(url, courseCode, (_percent, status) => {
        if (status) setStatusStage(status);
      });
      clearTimeout(timer1);
      clearTimeout(timer2);
      setStatusStage('YouTube lecture processed successfully.');
      setTimeout(() => {
        onSuccess(lecture);
      }, 500);
    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      const msg = err instanceof Error ? err.message : 'Captions are unavailable for this video.';
      setErrorMsg(msg);
      setStatusStage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFallbackClick = () => {
    if (onSwitchToManual) {
      const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      const vid = match ? match[1] : '';
      const fallbackTitle = vid ? `YouTube Lecture (${vid})` : 'YouTube Lecture Notes';
      onSwitchToManual(fallbackTitle, url);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Course Selection */}
      <div className="course-select-row">
        <label style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
          Assign Course Code:
        </label>
        <select
          className="course-dropdown"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
        >
          <option value="General">General / Elective</option>
          <option value="CS 106B">CS 106B — Programming Abstractions</option>
          <option value="PHYS 402">PHYS 402 — Quantum Mechanics II</option>
          <option value="ECON 201">ECON 201 — Macroeconomic Policy</option>
          <option value="NEURO 301">NEURO 301 — Cellular Neuroscience</option>
        </select>
      </div>

      {/* URL Input Box */}
      <div
        className="glass-card"
        style={{
          padding: 'var(--space-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-md)',
          textAlign: 'center',
        }}
      >
        <div className="dropzone-giant-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
          <Video size={32} />
        </div>

        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
            Import from YouTube Lecture URL
          </h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
            Extracts auto-generated captions or transcribes lecture audio locally in seconds.
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: '580px', display: 'flex', gap: 'var(--space-xs)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-outline)',
              }}
            />
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '38px', borderRadius: 'var(--radius-md)' }}
              disabled={isProcessing}
            />
          </div>

          <button
            className="btn-primary-cta"
            onClick={handleFetch}
            disabled={isProcessing || !url.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              'Fetch Captions'
            )}
          </button>
        </div>

        {isProcessing && statusStage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--color-primary, #6366f1)',
              background: 'rgba(99, 102, 241, 0.08)',
              padding: '6px 14px',
              borderRadius: '9999px',
              marginTop: '4px',
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            <span>{statusStage}</span>
          </div>
        )}
      </div>

      {/* Fallback Banner if Captions Unavailable */}
      {errorMsg && (
        <div
          style={{
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: '#b45309' }}>
                Captions are unavailable for this video.
              </div>
              <div style={{ fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)' }}>
                {errorMsg}. You can easily paste the transcript text or lecture slides directly.
              </div>
            </div>
          </div>

          <button
            className="btn-secondary-action"
            onClick={handleFallbackClick}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <Edit3 size={14} />
            Paste Transcript
          </button>
        </div>
      )}
    </div>
  );
};

export default YouTubeUploader;
