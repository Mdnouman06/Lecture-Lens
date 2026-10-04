import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Paperclip, Mic, ArrowUp } from 'lucide-react';
import type { KeyConcept } from '../../types/lecture';

interface TutorInputDeckProps {
  onSend: (text: string) => void;
  isGenerating?: boolean;
  defaultShortcuts?: string[];
  initialValue?: string;
  lectureTitle?: string;
  keyConcepts?: KeyConcept[];
}

export const TutorInputDeck: React.FC<TutorInputDeckProps> = ({
  onSend,
  isGenerating = false,
  defaultShortcuts,
  initialValue = '',
  lectureTitle,
  keyConcepts,
}) => {
  const [text, setText] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const shortcuts = useMemo(() => {
    if (defaultShortcuts && defaultShortcuts.length > 0) {
      return defaultShortcuts;
    }
    if (keyConcepts && keyConcepts.length > 0) {
      const topConcept = keyConcepts[0].term;
      return [
        `Explain "${topConcept}" in simple terms`,
        'What is the core thesis of this lecture?',
        `Give an intuitive analogy for ${topConcept}`,
        'What are the highest-yield exam takeaways?',
      ];
    }
    if (lectureTitle) {
      return [
        `Summarize core argument of ${lectureTitle}`,
        'Explain the key terms from this lecture',
        'Give a practical analogy for this concept',
        'What might be asked on an exam?',
      ];
    }
    return [
      'Summarize main argument',
      'Explain key terms from this lecture',
      'Give a practical analogy',
      'What might be asked on an exam?',
    ];
  }, [defaultShortcuts, keyConcepts, lectureTitle]);

  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim() || isGenerating) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleShortcutClick = (shortcutText: string) => {
    setText(shortcutText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  return (
    <div className="tutor-input-deck-container">
      {/* Horizontal Prompt Shortcuts */}
      <div className="prompt-shortcuts-row">
        <span className="shortcuts-label">Shortcuts:</span>
        {shortcuts.map((sc, i) => (
          <button
            key={i}
            type="button"
            className="prompt-chip"
            onClick={() => handleShortcutClick(sc)}
          >
            {sc.length > 36 ? `${sc.slice(0, 34)}...` : sc}
          </button>
        ))}
      </div>

      {/* Input Textarea Card */}
      <div className="tutor-input-box">
        <textarea
          ref={textareaRef}
          className="tutor-textarea"
          rows={2}
          placeholder="Ask anything across your lectures, slides, and syllabus..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
        />

        <div className="tutor-input-toolbar">
          <div className="toolbar-left">
            <div className="model-pill" title="Active Reasoning Model">
              <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
              <span>Intelligence 2.5</span>
            </div>

            <button
              type="button"
              className="icon-action-btn"
              title="Attach diagram, note or PDF"
            >
              <Paperclip size={15} />
            </button>

            <button
              type="button"
              className="icon-action-btn"
              title="Dictate question"
            >
              <Mic size={15} />
            </button>
          </div>

          <div className="toolbar-right">
            <span className="shortcut-hint">Return ↵ to query</span>
            <button
              type="button"
              className="send-action-btn"
              onClick={handleSubmit}
              disabled={!text.trim() || isGenerating}
              title="Send question"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
