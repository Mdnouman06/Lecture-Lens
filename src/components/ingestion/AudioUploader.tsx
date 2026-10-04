import React, { useState, useRef } from 'react';
import { Mic, Radio, Loader2, AlertCircle, Video, HelpCircle, Edit3, ChevronDown, ChevronUp, Download, Sparkles } from 'lucide-react';
import type { Lecture } from '../../types/lecture';
import { uploadAudio } from '../../services/api';

interface AudioUploaderProps {
  onSuccess: (lecture: Lecture) => void;
  onSwitchToManual?: (filename: string) => void;
  defaultCourseCode?: string;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onSuccess,
  onSwitchToManual,
  defaultCourseCode = 'General',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [courseCode, setCourseCode] = useState(defaultCourseCode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMeetGuide, setShowMeetGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setProgress(15);
    try {
      const lecture = await uploadAudio(selectedFile, courseCode, (p) => setProgress(p));
      if (!lecture.transcript || lecture.transcript.length === 0) {
        setErrorMessage('Transcription completed, but no spoken audio/words were recognized in this recording.');
        return;
      }
      setProgress(100);
      // Brief visual pause so the user perceives 100% completion before workspace transitions
      await new Promise((r) => setTimeout(r, 400));
      onSuccess(lecture);
      setSelectedFile(null);
      setProgress(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transcription failed. Please check local AI service.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepText = (p: number) => {
    if (p < 30) return 'Uploading audio to local temporary scratch...';
    if (p < 75) return 'Running faster-whisper CTranslate2 speech-to-text...';
    if (p < 95) return 'Aligning timestamped segments & speaker tags...';
    return 'Finalizing vector transcript representation (100%)...';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Course Selection and Meet Guide Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="course-select-row" style={{ margin: 0 }}>
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

        <button
          type="button"
          className="btn-secondary-action"
          onClick={() => setShowMeetGuide(!showMeetGuide)}
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-primary)',
          }}
        >
          <HelpCircle size={14} />
          <span>Google Meet Guide</span>
          {showMeetGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Google Meet Instructional Guide Box (Expandable) */}
      {showMeetGuide && (
        <div
          className="glass-card"
          style={{
            padding: 'var(--space-md)',
            background: 'rgba(14, 165, 233, 0.05)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 600, fontSize: '14px' }}>
            <Video size={18} />
            <span>How to Import Google Meet & Zoom Recordings</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '4px' }}>
            <div style={{ padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                <Download size={14} color="#0284c7" />
                <span>1. Download Recording</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                In your university Google Drive, open the "Meet Recordings" folder and download the <code>.mp4</code> or <code>.m4a</code> file.
              </p>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                <Mic size={14} color="#0284c7" />
                <span>2. Drop into Uploader</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                Drop the file directly into the box below. Local <code>faster-whisper</code> transcribes all speakers with timecodes.
              </p>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                <Sparkles size={14} color="#0284c7" />
                <span>3. Or Paste Captions</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                If your class generates Google Docs meeting captions, copy the text and paste into the "Manual Notes" tab.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Feedback Banner with Manual Fallback Button */}
      {errorMessage && (
        <div
          className="glass-card"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
          {onSwitchToManual && (
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => onSwitchToManual(selectedFile?.name || 'Lecture Audio')}
              style={{ fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit3 size={13} />
              <span>Paste Transcript Manually</span>
            </button>
          )}
        </div>
      )}

      {/* Audio File Dropzone */}
      <div
        className={`uploader-dropzone-well ${isDragging ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*,video/*,.m4a,.mp3,.wav,.mp4,.webm"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="dropzone-giant-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0284c7' }}>
          <Mic size={32} />
        </div>

        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
            {selectedFile ? selectedFile.name : 'Drop lecture recording or video file here'}
          </h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
            {selectedFile
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for faster-whisper transcription`
              : 'MP3, WAV, M4A, MP4, WebM • Google Meet & Zoom recordings supported'}
          </p>

          {/* Formats Strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '10px' }}>
            <span className="course-code-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>MP3</span>
            <span className="course-code-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>WAV</span>
            <span className="course-code-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>M4A</span>
            <span className="course-code-badge" style={{ fontSize: '11px', padding: '2px 8px' }}>MP4</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#0284c7',
                border: '1px solid rgba(14, 165, 233, 0.28)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Video size={11} /> Google Meet & Zoom Supported
            </span>
          </div>
        </div>

        {!selectedFile && (
          <button
            type="button"
            className="browse-files-btn"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse Audio / Video File
          </button>
        )}
      </div>

      {/* Progress Box & Action Buttons */}
      {selectedFile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {isProcessing && (
            <div className="progress-card-box" style={{ margin: '0 auto' }}>
              <div className="progress-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={14} className="animate-spin" />
                  {getStepText(progress)}
                </span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="progress-track-bar">
                <div className="progress-track-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-steps-list">
                <span>Upload</span>
                <span>CTranslate2 Whisper</span>
                <span>Timecodes</span>
                <span>Index</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <button
              className="btn-secondary-action"
              onClick={() => setSelectedFile(null)}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="btn-primary-cta"
              onClick={handleProcess}
              disabled={isProcessing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <Radio size={16} />
                  Transcribe & Index Lecture
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
