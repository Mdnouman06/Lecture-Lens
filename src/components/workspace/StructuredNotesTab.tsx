import React from 'react';
import { Clock, BookOpen } from 'lucide-react';
import type { StudyNotes } from '../../types/lecture';

interface StructuredNotesTabProps {
  notes: StudyNotes;
  onSeek: (seconds: number) => void;
}

export const StructuredNotesTab: React.FC<StructuredNotesTabProps> = ({ notes, onSeek }) => {
  const markdownText = notes.markdown || '';

  const parseTimestampSeconds = (str: string): number | null => {
    const match = str.match(/\[(\d{1,2}):(\d{2})\]/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      return mins * 60 + secs;
    }
    return null;
  };

  const renderInlineFormatted = (text: string): React.ReactNode => {
    // Replace **bold**, *italic*, `code`, and $math$
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\$([^$]+)\$)/;

    while (remaining.length > 0) {
      const match = remaining.match(regex);
      if (!match || match.index === undefined) {
        parts.push(remaining);
        break;
      }

      if (match.index > 0) {
        parts.push(remaining.substring(0, match.index));
      }

      if (match[1]) {
        // Bold: **text**
        parts.push(<strong key={`b-${keyIdx++}`} style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>{match[2]}</strong>);
      } else if (match[3]) {
        // Italic: *text*
        parts.push(<em key={`i-${keyIdx++}`} style={{ fontStyle: 'italic' }}>{match[4]}</em>);
      } else if (match[5]) {
        // Code: `code`
        parts.push(
          <code
            key={`c-${keyIdx++}`}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--color-surface-container-highest)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9em',
              color: 'var(--color-primary-container)',
            }}
          >
            {match[6]}
          </code>
        );
      } else if (match[7]) {
        // Math: $math$
        parts.push(
          <span
            key={`m-${keyIdx++}`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontStyle: 'italic',
              background: 'rgba(79, 70, 229, 0.08)',
              padding: '1px 5px',
              borderRadius: '3px',
              color: 'var(--color-primary-container)',
              fontWeight: 600,
            }}
          >
            {match[8]}
          </span>
        );
      }

      remaining = remaining.substring(match.index + match[0].length);
    }

    return <>{parts}</>;
  };

  // If no markdown notes are generated yet
  if (!markdownText.trim()) {
    return (
      <div
        style={{
          padding: 'var(--space-xl)',
          textAlign: 'center',
          color: 'var(--color-on-surface-variant)',
          background: 'var(--color-surface-container-lowest)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-outline-variant)',
        }}
      >
        <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
        <h4 style={{ margin: '0 0 6px', color: 'var(--color-on-surface)' }}>No Structured Notes Available</h4>
        <p style={{ margin: 0, fontSize: 'var(--text-label)' }}>
          Click "Generate Smart Notes" or "Retry Synthesis" to synthesize detailed notes for this lecture.
        </p>
      </div>
    );
  }

  // Parse lines into structured blocks
  const lines = markdownText.split('\n');
  const blocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let tableLines: string[] = [];

  const flushCodeBlock = (key: number) => {
    if (codeBlockLines.length > 0) {
      const content = codeBlockLines.join('\n');
      blocks.push(
        <div
          key={`code-${key}`}
          className="equation-callout-box"
          style={{
            margin: 'var(--space-md) 0',
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--color-on-surface)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {content}
          </pre>
        </div>
      );
      codeBlockLines = [];
    }
  };

  const flushTable = (key: number) => {
    if (tableLines.length >= 2) {
      const rows = tableLines.map((row) =>
        row
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
      );
      const headerRow = rows[0] || [];
      const dataRows = rows.slice(2); // Skip separator row

      blocks.push(
        <div key={`table-${key}`} style={{ overflowX: 'auto', margin: 'var(--space-md) 0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--text-label)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--color-outline-variant)',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--color-surface-container-low)' }}>
                {headerRow.map((h, i) => (
                  <th
                    key={`th-${i}`}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: 'var(--color-on-surface)',
                      borderBottom: '1px solid var(--color-outline-variant)',
                    }}
                  >
                    {renderInlineFormatted(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr
                  key={`tr-${rIdx}`}
                  style={{
                    background: rIdx % 2 === 0 ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
                    borderBottom: '1px solid var(--color-outline-variant)',
                  }}
                >
                  {row.map((cell, cIdx) => (
                    <td key={`td-${rIdx}-${cIdx}`} style={{ padding: '8px 12px', color: 'var(--color-on-surface)' }}>
                      {renderInlineFormatted(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableLines = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check code block fence
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(idx);
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Check table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableLines.push(trimmed);
      return;
    } else if (tableLines.length > 0) {
      flushTable(idx);
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push(
        <hr
          key={`hr-${idx}`}
          style={{
            border: 'none',
            borderTop: '1px solid var(--color-outline-variant)',
            margin: 'var(--space-md) 0',
          }}
        />
      );
      return;
    }

    // H1 Header
    if (trimmed.startsWith('# ')) {
      const text = trimmed.substring(2);
      blocks.push(
        <h2
          key={`h1-${idx}`}
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--color-on-surface)',
            margin: 'var(--space-lg) 0 var(--space-xs)',
          }}
        >
          {renderInlineFormatted(text)}
        </h2>
      );
      return;
    }

    // H2 Header
    if (trimmed.startsWith('## ')) {
      const text = trimmed.substring(3);
      const tsSeconds = parseTimestampSeconds(text);
      const cleanText = text.replace(/\[\d{1,2}:\d{2}\]/, '').trim();

      blocks.push(
        <div
          key={`h2-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            margin: 'var(--space-lg) 0 var(--space-xs)',
            paddingBottom: '4px',
            borderBottom: '1px solid var(--color-outline-variant)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-on-surface)',
              margin: 0,
            }}
          >
            {renderInlineFormatted(cleanText)}
          </h3>

          {tsSeconds !== null && (
            <button
              onClick={() => onSeek(tsSeconds)}
              className="timestamp-badge"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title={`Jump to [${Math.floor(tsSeconds / 60)}:${(tsSeconds % 60).toString().padStart(2, '0')}]`}
            >
              <Clock size={12} />
              <span>[{Math.floor(tsSeconds / 60)}:{(tsSeconds % 60).toString().padStart(2, '0')}]</span>
            </button>
          )}
        </div>
      );
      return;
    }

    // H3 Header
    if (trimmed.startsWith('### ')) {
      const text = trimmed.substring(4);
      blocks.push(
        <h4
          key={`h3-${idx}`}
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-primary-container)',
            margin: 'var(--space-md) 0 var(--space-xs)',
          }}
        >
          {renderInlineFormatted(text)}
        </h4>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quoteText = trimmed.substring(2);
      blocks.push(
        <div
          key={`quote-${idx}`}
          style={{
            margin: 'var(--space-sm) 0',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-container-low)',
            borderLeft: '3px solid var(--color-primary-container)',
            fontSize: 'var(--text-label)',
            color: 'var(--color-on-surface)',
            lineHeight: 1.5,
          }}
        >
          {renderInlineFormatted(quoteText)}
        </div>
      );
      return;
    }

    // Numbered step / item: 1. ...
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const itemContent = numMatch[2];
      blocks.push(
        <div
          key={`num-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            margin: '6px 0',
            fontSize: 'var(--text-body)',
            lineHeight: 1.6,
          }}
        >
          <span
            style={{
              flexShrink: 0,
              width: '22px',
              height: '22px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surface-container-highest)',
              color: 'var(--color-primary-container)',
              fontWeight: 700,
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '2px',
            }}
          >
            {num}
          </span>
          <div style={{ flex: 1, color: 'var(--color-on-surface)' }}>
            {renderInlineFormatted(itemContent)}
          </div>
        </div>
      );
      return;
    }

    // Unordered list item: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemContent = trimmed.substring(2);
      blocks.push(
        <div
          key={`li-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            margin: '4px 0 4px 12px',
            fontSize: 'var(--text-body)',
            lineHeight: 1.55,
          }}
        >
          <span style={{ color: 'var(--color-primary-container)', fontWeight: 700, marginTop: '2px' }}>•</span>
          <div style={{ flex: 1, color: 'var(--color-on-surface)' }}>
            {renderInlineFormatted(itemContent)}
          </div>
        </div>
      );
      return;
    }

    // Regular paragraph
    if (trimmed.length > 0) {
      blocks.push(
        <p
          key={`p-${idx}`}
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--color-on-surface)',
            lineHeight: 1.65,
            margin: '0 0 var(--space-sm) 0',
          }}
        >
          {renderInlineFormatted(trimmed)}
        </p>
      );
    }
  });

  if (inCodeBlock) flushCodeBlock(lines.length);
  if (tableLines.length > 0) flushTable(lines.length);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      {blocks}
    </div>
  );
};

export default StructuredNotesTab;
