import React, { useRef, useEffect } from 'react';
import { Sparkles, CheckCheck } from 'lucide-react';
import type { TutorMessage } from '../../types/lecture';
import { TutorSynthesisBubble } from './TutorSynthesisBubble';
import { EmptyState } from '../common/EmptyState';

interface TutorDialogueStreamProps {
  messages: TutorMessage[];
  isGenerating?: boolean;
  onSeekAudio?: (seconds: number) => void;
  onOpenTranscript?: (seconds: number) => void;
  onFollowUpClick?: (chipText: string) => void;
}

export const TutorDialogueStream: React.FC<TutorDialogueStreamProps> = ({
  messages,
  isGenerating = false,
  onSeekAudio,
  onOpenTranscript,
  onFollowUpClick,
}) => {
  const streamBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '8px 0 16px',
      }}
    >
      {messages.length === 0 && !isGenerating && (
        <EmptyState
          icon={Sparkles}
          title="Ask Your Lecture AI Tutor"
          description="Ask questions grounded strictly in your lecture transcripts and textbook readings with verifiable citations and audio seek links."
          badgeText="Context-Grounded Tutor"
          variant="default"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '440px', margin: '0 auto' }}>
            {[
              'Summarize the core thesis of this lecture',
              'Explain the most complex formula or mechanism step-by-step',
              'What high-yield questions might appear on the exam?',
            ].map((starter, idx) => (
              <button
                key={idx}
                type="button"
                className="btn-secondary-action"
                onClick={() => onFollowUpClick && onFollowUpClick(starter)}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-container-low)',
                  border: '1px solid var(--color-outline-variant)',
                  fontSize: '12px',
                  color: 'var(--color-on-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Sparkles size={14} color="var(--color-primary-container)" />
                <span>"{starter}"</span>
              </button>
            ))}
          </div>
        </EmptyState>
      )}

      {messages.map((msg) =>
        msg.sender === 'user' ? (
          <div key={msg.id} className="user-msg-row">
            <div className="user-msg-bubble">
              <p className="user-msg-text">{msg.text}</p>
              <div className="user-msg-meta">
                <span>{msg.timestamp}</span>
                <CheckCheck size={13} style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
          </div>
        ) : (
          <TutorSynthesisBubble
            key={msg.id}
            message={msg}
            onSeekAudio={onSeekAudio}
            onOpenTranscript={onOpenTranscript}
            onFollowUpClick={onFollowUpClick}
          />
        )
      )}

      {isGenerating && (
        <div className="tutor-response-row">
          <div className="tutor-avatar">
            <Sparkles size={16} />
          </div>
          <div
            className="tutor-synthesis-card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: 'var(--color-primary)',
                fontWeight: 600,
              }}
            >
              Retrieving grounded lecture context...
            </span>
            <span
              className="synthesis-latency"
              style={{ animation: 'pulse 1.5s infinite' }}
            >
              Reasoning
            </span>
          </div>
        </div>
      )}

      <div ref={streamBottomRef} />
    </div>
  );
};
