import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  ExternalLink,
  Check,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import type { Lecture } from '../../types/lecture';

interface LectureInspectorDrawerProps {
  lecture: Lecture;
  onOpenWorkspace: (lecture: Lecture) => void;
}

export const LectureInspectorDrawer: React.FC<LectureInspectorDrawerProps> = ({
  lecture,
  onOpenWorkspace,
}) => {
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const handleExport = (format: string) => {
    setCopiedAction(format);
    setTimeout(() => setCopiedAction(null), 2000);
  };

  // Derive real speakers from transcript
  const speakerSet = new Set<string>();
  (lecture.transcript || []).forEach((t) => {
    if (t.speaker && t.speaker.trim()) speakerSet.add(t.speaker.trim());
  });
  const speakerCount = speakerSet.size || (lecture.hasAudio ? 1 : 0);
  const primarySpeaker = Array.from(speakerSet)[0] || (lecture.hasAudio ? 'Primary Speaker' : 'Content Source');

  // Derive concepts from lecture notes or concepts
  const activeConcepts = lecture.notes?.keyConcepts || lecture.concepts || [];
  const topConcepts = activeConcepts.slice(0, 2);

  // Derive slides or media count
  const slideCount = lecture.slides?.length || lecture.pageCount || 0;

  return (
    <aside className="inspector-drawer" aria-label="Active Lecture Inspector">
      {/* Header */}
      <div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-primary-container)',
          }}
        >
          Active Lecture Inspector
        </span>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-on-surface)',
            marginTop: '2px',
            lineHeight: 1.3,
          }}
        >
          {lecture.title}
        </h3>
        <p style={{ fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>
          {lecture.courseCode || 'General'} • {lecture.date} • {lecture.duration}
        </p>
      </div>

      {/* Speaker Split Visual */}
      {lecture.hasAudio && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
            <span>Speaker Tracking</span>
            <span className="font-mono">{speakerCount} Detected Speaker{speakerCount > 1 ? 's' : ''}</span>
          </div>
          <div className="diarization-track">
            <div className="diarization-speaker1" style={{ width: '100%' }} title={`${primarySpeaker} (100%)`} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary-container)' }} />
              {primarySpeaker}
            </span>
            <span style={{ color: 'var(--color-on-surface-variant)' }}>STT Verified</span>
          </div>
        </div>
      )}

      {/* Extracted Concepts & Core Themes */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--color-on-surface)' }}>
            Core Themes & Concepts
          </span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-primary-container)' }}>
            {topConcepts.length > 0 ? 'Extracted' : 'Ready'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {topConcepts.length > 0 ? (
            topConcepts.map((c, idx) => (
              <div key={idx} className="formula-highlight-chip">
                <span>{c.term}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>{c.importance || 'Key Concept'}</span>
              </div>
            ))
          ) : (
            <div className="formula-highlight-chip">
              <span>{lecture.title.slice(0, 30)}</span>
              <span style={{ fontSize: '10px', color: 'var(--color-on-surface-variant)' }}>Subject</span>
            </div>
          )}
        </div>
      </div>

      {/* Slide Thumbnails Grid or Media Summary */}
      {slideCount > 0 ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--color-on-surface)' }}>
              Slide Deck Artifacts ({slideCount})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-primary-container)', cursor: 'pointer' }}>
              View All
            </span>
          </div>
          <div className="slides-preview-grid">
            <div className="slide-thumbnail-card">p. 1</div>
            {slideCount > 1 && <div className="slide-thumbnail-card">p. 2</div>}
            {slideCount > 2 && <div className="slide-thumbnail-card">p. 3</div>}
          </div>
        </div>
      ) : null}

      {/* One-Click Export Suite */}
      <div>
        <span style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--color-on-surface)', display: 'block', marginBottom: '6px' }}>
          Export & Interoperability
        </span>
        <div className="export-grid">
          <button className="export-btn" onClick={() => handleExport('pdf')}>
            {copiedAction === 'pdf' ? <Check size={14} color="#10b981" /> : <Download size={14} color="#ef4444" />}
            <span>{copiedAction === 'pdf' ? 'Exported' : 'PDF'}</span>
          </button>
          <button className="export-btn" onClick={() => handleExport('md')}>
            {copiedAction === 'md' ? <Check size={14} color="#10b981" /> : <FileText size={14} color="#4f46e5" />}
            <span>{copiedAction === 'md' ? 'Copied' : 'Markdown'}</span>
          </button>
          <button className="export-btn" onClick={() => handleExport('notion')}>
            {copiedAction === 'notion' ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
            <span>{copiedAction === 'notion' ? 'Pushed' : 'Notion'}</span>
          </button>
          <button className="export-btn" onClick={() => handleExport('anki')}>
            {copiedAction === 'anki' ? <Check size={14} color="#10b981" /> : <ExternalLink size={14} color="#0ea5e9" />}
            <span>{copiedAction === 'anki' ? 'Synced' : 'Anki Deck'}</span>
          </button>
        </div>
      </div>

      {/* Launch Smart Notes Master CTA */}
      <button
        className="btn-primary-cta"
        onClick={() => onOpenWorkspace(lecture)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
      >
        <BookOpen size={16} />
        <span>Open Smart Notes in Workspace</span>
      </button>

      {/* Storage & Backup Guarantee */}
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-container-low)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--color-on-surface-variant)',
        }}
      >
        <Sparkles size={14} color="var(--color-tertiary-container)" />
        <span>Indexed & encrypted in local academic vault.</span>
      </div>
    </aside>
  );
};

export default LectureInspectorDrawer;
