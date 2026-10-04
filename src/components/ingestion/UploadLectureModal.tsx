import React, { useState } from 'react';
import { X, FileText, Mic, Video, Edit3 } from 'lucide-react';
import type { Lecture } from '../../types/lecture';
import { PdfUploader } from './PdfUploader';
import { AudioUploader } from './AudioUploader';
import { YouTubeUploader } from './YouTubeUploader';
import { ManualTranscriptEditor } from './ManualTranscriptEditor';

interface UploadLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lecture: Lecture) => void;
  initialTab?: 'pdf' | 'audio' | 'youtube' | 'manual';
}

export const UploadLectureModal: React.FC<UploadLectureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'pdf',
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'audio' | 'youtube' | 'manual'>(initialTab);
  const [manualInitialData, setManualInitialData] = useState<{ title: string; text: string }>({
    title: '',
    text: '',
  });

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSuccess = (lecture: Lecture) => {
    onSuccess(lecture);
    onClose();
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
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div
        className="modal-container"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/leclens.jpg"
              alt="LectureLens Logo"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                flexShrink: 0,
              }}
            />
            <div>
              <h2 id="upload-modal-title" className="modal-title">
                Upload & Ingest Lecture Media
              </h2>
              <p style={{ fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)', margin: 0 }}>
                Local Whisper STT • PyPDF Extraction • YouTube Caption Retrieval
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ padding: 'var(--space-md) var(--space-lg) 0' }}>
          <div className="ingest-tabs-container">
            <button
              className={`ingest-tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf')}
            >
              <FileText size={16} />
              <span>PDF Slides</span>
            </button>
            <button
              className={`ingest-tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveTab('audio')}
            >
              <Mic size={16} />
              <span>Audio / Video</span>
            </button>
            <button
              className={`ingest-tab-btn ${activeTab === 'youtube' ? 'active' : ''}`}
              onClick={() => setActiveTab('youtube')}
            >
              <Video size={16} />
              <span>YouTube URL</span>
            </button>
            <button
              className={`ingest-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <Edit3 size={16} />
              <span>Manual Notes</span>
            </button>
          </div>
        </div>

        {/* Modal Body with Active Uploader */}
        <div className="modal-body" style={{ paddingTop: 'var(--space-sm)' }}>
          {activeTab === 'pdf' && <PdfUploader onSuccess={handleSuccess} />}
          {activeTab === 'audio' && (
            <AudioUploader
              onSuccess={handleSuccess}
              onSwitchToManual={handleSwitchToManualFromAudio}
            />
          )}
          {activeTab === 'youtube' && (
            <YouTubeUploader
              onSuccess={handleSuccess}
              onSwitchToManual={handleSwitchToManualFromYoutube}
            />
          )}
          {activeTab === 'manual' && (
            <ManualTranscriptEditor
              onSuccess={handleSuccess}
              initialTitle={manualInitialData.title}
              initialText={manualInitialData.text}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadLectureModal;
