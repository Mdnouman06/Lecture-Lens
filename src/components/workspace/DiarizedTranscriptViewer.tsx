import React, { useState, useEffect, useRef } from 'react';
import {
  Subtitles,
  Search,
  Sparkles,
  MessageSquare,
  Highlighter,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import type { TranscriptSegment } from '../../types/lecture';
import { exportTranscriptAsTxt, downloadFile } from '../../utils/export';
import '../../styles/workspace.css';

interface DiarizedTranscriptViewerProps {
  transcript: TranscriptSegment[];
  lectureTitle?: string;
  currentTime: number;
  onSeek: (seconds: number) => void;
  onMakeCard?: (text: string) => void;
  onAskAi?: (text: string) => void;
  onHighlight?: (text: string) => void;
}

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const DiarizedTranscriptViewer: React.FC<DiarizedTranscriptViewerProps> = ({
  transcript,
  lectureTitle,
  currentTime,
  onSeek,
  onMakeCard,
  onAskAi,
  onHighlight,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to active spoken line
  useEffect(() => {
    if (autoScroll && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentTime, autoScroll]);

  const handleCopyTimestamp = (seg: TranscriptSegment) => {
    const stamp = `[${formatSeconds(seg.startSeconds)}]`;
    navigator.clipboard.writeText(`${stamp} ${seg.text}`);
    setCopiedId(seg.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadTranscript = () => {
    if (!transcript || transcript.length === 0) {
      setDownloadNotice({
        type: 'error',
        message: 'No transcript segments found for this lecture.',
      });
      setTimeout(() => setDownloadNotice(null), 3500);
      return;
    }

    const fullText = exportTranscriptAsTxt(lectureTitle || 'Lecture', 'ACAD', transcript);
    const safeTitle = (lectureTitle || 'lecture-transcript')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const filename = `${safeTitle}-${new Date().toISOString().slice(0, 10)}.txt`;
    downloadFile(filename, fullText, 'text/plain');
    setDownloadNotice({
      type: 'success',
      message: 'Transcript TXT downloaded successfully.',
    });
    setTimeout(() => setDownloadNotice(null), 2500);
  };

  // Filter segments based on search
  const filteredTranscript = transcript.filter((seg) =>
    searchQuery.trim() === ''
      ? true
      : seg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seg.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchCount = searchQuery.trim() ? filteredTranscript.length : 0;

  // Highlight query term in text
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: 'var(--color-primary-fixed)',
            color: 'var(--color-primary-container)',
            borderRadius: '2px',
            padding: '1px 3px',
            fontWeight: 600,
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <aside className="transcript-panel" aria-label="Timestamped Live Transcript">
      {/* Top Header: Title & Auto-scroll Toggle */}
      <div className="transcript-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Subtitles size={18} color="var(--color-primary-container)" />
          <h3 style={{ fontSize: 'var(--text-title)', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>
            Live Transcript
          </h3>
        </div>

        <button
          onClick={() => setAutoScroll((prev) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--text-micro)',
            fontWeight: 600,
            color: autoScroll ? '#047857' : 'var(--color-on-surface-variant)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Toggle automatic scrolling with audio playback"
        >
          <span
            className={`status-dot ${autoScroll ? 'connected' : 'demo'}`}
            style={{ width: '7px', height: '7px' }}
          />
          <span>{autoScroll ? 'Auto-Scrolling' : 'Manual Scroll'}</span>
        </button>
      </div>

      {/* Real-time Search Bar with Match Counter */}
      <div className="transcript-search-wrapper">
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '10px',
            color: 'var(--color-outline)',
          }}
        />
        <input
          type="text"
          placeholder="Search transcript terms (e.g. key concepts, names)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Filter transcript"
        />
        {searchQuery.trim() && (
          <div className="search-matches-chip">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </div>
        )}
      </div>

      {/* Scrollable Transcript Feed */}
      <div className="transcript-feed-scroll" role="feed">
        {filteredTranscript.length === 0 ? (
          <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
            No transcript segments match "{searchQuery}"
          </div>
        ) : (
          filteredTranscript.map((seg) => {
            const isActive =
              currentTime >= seg.startSeconds && currentTime <= seg.endSeconds;
            const isStudent = seg.speaker.toLowerCase().includes('student');

            return (
              <div
                key={seg.id}
                ref={isActive ? activeLineRef : null}
                className={`transcript-block ${isActive ? 'active-spoken' : ''}`}
                onClick={() => onSeek(seg.startSeconds)}
                style={isStudent ? { marginLeft: '12px', borderLeft: '2px solid #0ea5e9' } : {}}
              >
                {/* Speaker Header Row */}
                <div className="transcript-speaker-row">
                  <span className={`speaker-tag ${isActive ? 'active' : ''}`}>
                    {seg.speaker}
                  </span>

                  <span
                    className="timestamp-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(seg.startSeconds);
                    }}
                    title="Jump to this moment"
                  >
                    {formatSeconds(seg.startSeconds)}
                  </span>
                </div>

                {/* Paragraph Content */}
                <p
                  style={{
                    fontSize: isActive ? 'var(--text-body)' : 'var(--text-label)',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                    lineHeight: 1.55,
                    fontStyle: isStudent ? 'italic' : 'normal',
                    margin: 0,
                  }}
                >
                  {renderHighlightedText(seg.text, searchQuery)}
                </p>

                {/* Active Line Inline Action Toolbar */}
                {isActive && (
                  <div
                    className="transcript-inline-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="inline-action-chip"
                      onClick={() => onMakeCard && onMakeCard(seg.text)}
                      title="Generate flashcard from active sentence"
                    >
                      <Sparkles size={12} color="var(--color-primary-container)" />
                      <span>Make Card</span>
                    </button>

                    <button
                      className="inline-action-chip"
                      onClick={() => onAskAi && onAskAi(seg.text)}
                      title="Ask AI Tutor about this spoken point"
                    >
                      <MessageSquare size={12} color="#0284c7" />
                      <span>Ask AI</span>
                    </button>

                    <button
                      className="inline-action-chip"
                      onClick={() => onHighlight && onHighlight(seg.text)}
                      title="Highlight this sentence"
                    >
                      <Highlighter size={12} color="#059669" />
                      <span>Highlight</span>
                    </button>

                    <button
                      className="inline-action-chip"
                      onClick={() => handleCopyTimestamp(seg)}
                      title="Copy timestamped quote"
                      style={{ marginLeft: 'auto' }}
                    >
                      {copiedId === seg.id ? (
                        <>
                          <Check size={12} color="#10b981" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>[{formatSeconds(seg.startSeconds)}]</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Download Status Notification */}
      {downloadNotice && (
        <div
          style={{
            margin: '4px 0',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            background: downloadNotice.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: downloadNotice.type === 'error' ? '#ef4444' : '#10b981',
            border: `1px solid ${downloadNotice.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
          }}
          role="status"
        >
          {downloadNotice.message}
        </div>
      )}

      {/* Bottom Export Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
          borderTop: '1px solid var(--color-outline-variant)',
          fontSize: 'var(--text-micro)',
          color: 'var(--color-on-surface-variant)',
        }}
      >
        <span>Synced with Whisper STT</span>
        <button
          onClick={handleDownloadTranscript}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--color-primary-container)',
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Download text file transcript"
        >
          <span>Download TXT</span>
          <Download size={13} />
        </button>
      </div>
    </aside>
  );
};

export default DiarizedTranscriptViewer;
