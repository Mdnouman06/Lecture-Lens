import React from 'react';
import { Play, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import type { TutorCitation } from '../../types/lecture';

interface CitationCardProps {
  citation: TutorCitation;
  onSeekAudio?: (seconds: number) => void;
  onOpenTranscript?: (seconds: number) => void;
}

export const CitationCard: React.FC<CitationCardProps> = ({
  citation,
  onSeekAudio,
  onOpenTranscript,
}) => {
  const isAudio = citation.sourceType === 'audio';
  const durationSec =
    citation.timeStart !== undefined && citation.timeEnd !== undefined
      ? citation.timeEnd - citation.timeStart
      : null;

  const handleListenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (citation.timeStart !== undefined && onSeekAudio) {
      onSeekAudio(citation.timeStart);
    }
  };

  const handleOpenTranscriptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (citation.timeStart !== undefined && onOpenTranscript) {
      onOpenTranscript(citation.timeStart);
    }
  };

  return (
    <div
      className="citation-card"
      onClick={citation.timeStart !== undefined && onSeekAudio ? handleListenClick : undefined}
      style={{ cursor: citation.timeStart !== undefined && onSeekAudio ? 'pointer' : undefined }}
    >
      <div className="citation-top">
        <div className="citation-meta-row">
          <span className={`citation-source-pill ${!isAudio ? 'pdf' : ''}`}>
            {citation.sourceTitle}
          </span>
          <span className="citation-timecode">
            {citation.timecodeDisplay || citation.pageNumber || 'Lec Excerpt'}
          </span>
        </div>

        <h4 className="citation-title">
          {citation.sourceTitle || (isAudio ? 'Lecture Audio Transcript' : 'Lecture Material')}
        </h4>

        <p className="citation-quote">"{citation.quote}"</p>
      </div>

      <div className="citation-footer">
        {isAudio && citation.timeStart !== undefined ? (
          <button
            type="button"
            className="listen-btn"
            onClick={handleListenClick}
            title={`Seek audio to ${citation.timecodeDisplay || 'timestamp'}`}
          >
            <Play size={13} fill="currentColor" />
            <span>Listen {durationSec ? `(${durationSec}s)` : ''}</span>
          </button>
        ) : (
          <button
            type="button"
            className="listen-btn"
            style={{ background: 'var(--color-surface-container-high)', color: 'var(--color-on-surface)' }}
          >
            <FileText size={13} />
            <span>View Excerpt</span>
          </button>
        )}

        {isAudio && onOpenTranscript ? (
          <button
            type="button"
            className="citation-transcript-link"
            onClick={handleOpenTranscriptClick}
          >
            <span>Open Transcript</span>
            <ExternalLink size={12} />
          </button>
        ) : (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-tertiary, #005338)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <CheckCircle2 size={12} />
            <span>{Math.round(citation.relevanceScore * 100)}% match</span>
          </span>
        )}
      </div>
    </div>
  );
};
