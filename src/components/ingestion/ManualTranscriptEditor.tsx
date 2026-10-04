import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Lecture } from '../../types/lecture';
import { submitManual } from '../../services/api';

interface ManualTranscriptEditorProps {
  onSuccess: (lecture: Lecture) => void;
  initialTitle?: string;
  initialText?: string;
  defaultCourseCode?: string;
}

export const ManualTranscriptEditor: React.FC<ManualTranscriptEditorProps> = ({
  onSuccess,
  initialTitle = '',
  initialText = '',
  defaultCourseCode = 'General',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [courseCode, setCourseCode] = useState(defaultCourseCode);
  const [text, setText] = useState(initialText);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleCleanText = () => {
    // Clean excessive blank lines and trailing spaces
    const cleaned = text
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string, i: number, arr: string[]) => l !== '' || (i > 0 && arr[i - 1] !== ''))
      .join('\n');
    setText(cleaned);
  };

  const handleProcess = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const lecture = await submitManual(title || 'Manual Lecture Notes', text, courseCode);
      onSuccess(lecture);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Title & Course Selection Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '240px' }}>
          <label style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
            Lecture Title:
          </label>
          <input
            type="text"
            className="search-input"
            style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
            placeholder="e.g. Monetary Policy & Liquidity Preference"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
            Course Code:
          </label>
          <select
            className="course-dropdown"
            style={{ width: '100%', height: '36px' }}
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          >
            <option value="General">General / Elective</option>
            <option value="CS 106B">CS 106B — Computer Science</option>
            <option value="PHYS 402">PHYS 402 — Quantum Physics</option>
            <option value="ECON 201">ECON 201 — Macroeconomics</option>
            <option value="NEURO 301">NEURO 301 — Neuroscience</option>
          </select>
        </div>
      </div>

      {/* Transcript Text Area */}
      <div className="glass-card" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
            Paste Lecture Audio Transcript or Slide Content:
          </span>
          <button
            type="button"
            className="btn-secondary-action"
            onClick={handleCleanText}
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Format & Clean Text
          </button>
        </div>

        <textarea
          style={{
            width: '100%',
            height: '240px',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-outline-variant)',
            background: 'var(--color-surface-container-low)',
            fontSize: 'var(--text-body)',
            fontFamily: 'var(--font-family-base)',
            color: 'var(--color-on-surface)',
            resize: 'vertical',
            lineHeight: 1.6,
          }}
          placeholder="Paste professor lecture transcript, raw notes, or bullet points here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
          <span>{wordCount} words • {text.length} characters</span>
          <span>Automatic paragraph chunking enabled</span>
        </div>
      </div>

      {/* Submit Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
        <button
          className="btn-primary-cta"
          onClick={handleProcess}
          disabled={isProcessing || !text.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Structuring Notes...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Process & Index Notes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ManualTranscriptEditor;
