import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Sparkles, BookOpen, CheckCheck, Play } from 'lucide-react';
import type { Lecture, TutorMessage } from '../../types/lecture';
import { TutorSynthesisBubble } from './TutorSynthesisBubble';
import { TutorInputDeck } from './TutorInputDeck';
import { askAiTutor } from '../../services/api';

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: Lecture;
  onSeekAudio?: (seconds: number) => void;
  onOpenTranscript?: (seconds: number) => void;
  initialQuery?: string;
}

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  lecture,
  onSeekAudio,
  onOpenTranscript,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle auto-dispatch when an initial query is passed
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (userQuestion: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: TutorMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userQuestion,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsGenerating(true);

    try {
      const response = await askAiTutor({
        question: userQuestion,
        lectureId: lecture.id,
        courseCode: lecture.courseCode,
        contextSegments: lecture.transcript || [],
        notesSummary: lecture.notes?.summary || lecture.summary,
      });

      const newAiMsg: TutorMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: timeStr,
        topicBadge: response.topicBadge,
        latencyMs: response.latencyMs,
        sequenceSteps: response.sequenceSteps,
        citations: response.citations,
        examAlert: response.examAlert,
        followUps: response.followUps,
        isGrounded: response.isGrounded,
      };

      setMessages((prev) => [...prev, newAiMsg]);
    } catch (err: any) {
      const errMsg = err?.message || 'Could not connect to AI Tutor service.';
      const isOffline =
        errMsg.toLowerCase().includes('offline') ||
        errMsg.toLowerCase().includes('cannot reach') ||
        errMsg.toLowerCase().includes('503');
      const isModelMissing =
        errMsg.toLowerCase().includes('not installed') ||
        errMsg.toLowerCase().includes('404');

      let errorText = errMsg;
      if (isOffline) {
        errorText =
          "Local Ollama daemon is offline or unreachable at http://localhost:11434. Please run 'ollama serve' in your terminal.";
      } else if (isModelMissing) {
        errorText =
          "Model 'qwen3:0.6b' is not installed in local Ollama. Please run 'ollama pull qwen3:0.6b' in your terminal.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: errorText,
          timestamp: timeStr,
          topicBadge: 'Diagnostic Alert',
          isGrounded: false,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearSession = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`tutor-drawer-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <aside
        className={`tutor-drawer ${isOpen ? 'open' : ''}`}
        aria-label="AI Tutor Copilot"
        role="dialog"
      >
        {/* Header */}
        <div className="tutor-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/leclens.jpg"
              alt="LectureLens Logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                flexShrink: 0,
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                AI Tutor Copilot
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'var(--color-primary-fixed)',
                    color: 'var(--color-primary)',
                  }}
                >
                  Grounded
                </span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--color-on-surface-variant)',
                  maxWidth: '220px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {lecture.courseCode} • {lecture.title}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="icon-action-btn"
              onClick={handleClearSession}
              title="Restart session"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              className="icon-action-btn"
              onClick={onClose}
              title="Close drawer (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dialogue Stream Body */}
        <div ref={scrollRef} className="tutor-drawer-body">
          {messages.length === 0 ? (
            <div className="tutor-empty-greeting">
              <div className="tutor-empty-icon-box">
                <BookOpen size={26} strokeWidth={2} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 className="tutor-empty-title">
                  {lecture.courseCode} Study Copilot
                </h3>
                <p className="tutor-empty-desc">
                  Ask questions strictly grounded in <strong>{lecture.title}</strong>. Answers cite verifiable audio timestamp ranges and link directly to audio playback.
                </p>
              </div>

              <div className="tutor-empty-features">
                <div className="tutor-feature-item">
                  <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>Strict grounding in transcript & notes</span>
                </div>
                <div className="tutor-feature-item">
                  <Play size={14} style={{ color: 'var(--color-tertiary)' }} />
                  <span>Click citations to jump to exact audio timecode</span>
                </div>
                <div className="tutor-feature-item">
                  <CheckCheck size={14} style={{ color: '#059669' }} />
                  <span>Detects out-of-scope questions without hallucinations</span>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) =>
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
                  onFollowUpClick={handleSend}
                />
              )
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
        </div>

        {/* Input Deck */}
        <TutorInputDeck
          onSend={handleSend}
          isGenerating={isGenerating}
          lectureTitle={lecture.title}
          keyConcepts={lecture.concepts || lecture.notes?.keyConcepts}
        />
      </aside>
    </>
  );
};
