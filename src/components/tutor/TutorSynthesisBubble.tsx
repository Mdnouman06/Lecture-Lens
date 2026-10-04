import React, { useState } from 'react';
import {
  Radio,
  Zap,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Layers,
  HelpCircle,
  BookmarkPlus,
} from 'lucide-react';
import type { TutorMessage } from '../../types/lecture';
import { CitationCard } from './CitationCard';

interface TutorSynthesisBubbleProps {
  message: TutorMessage;
  onSeekAudio?: (seconds: number) => void;
  onOpenTranscript?: (seconds: number) => void;
  onFollowUpClick?: (chipText: string) => void;
}

export const TutorSynthesisBubble: React.FC<TutorSynthesisBubbleProps> = ({
  message,
  onSeekAudio,
  onOpenTranscript,
  onFollowUpClick,
}) => {
  const [copied, setCopied] = useState(false);

  // If this is a diagnostic alert from offline Ollama or generation timeout
  if (message.topicBadge === 'Diagnostic Alert') {
    const isModelMissing = message.text.includes('pull') || message.text.includes('not installed');
    const isTimeout = message.text.toLowerCase().includes('timed out') || message.text.toLowerCase().includes('timeout');
    const commandToCopy = isModelMissing ? 'ollama pull qwen3:0.6b' : 'ollama serve';

    return (
      <div className="tutor-response-row">
        <div className="tutor-avatar" title="Diagnostic Alert">
          <AlertTriangle size={18} style={{ color: '#ba1a1a' }} />
        </div>

        <div className="tutor-error-card" style={{ flex: 1 }}>
          <div className="tutor-error-header">
            <div className="tutor-error-icon-box">
              <AlertTriangle size={18} />
            </div>
            <div className="tutor-error-content">
              <h4 className="tutor-error-title">
                {isModelMissing ? 'Ollama Model Missing' : isTimeout ? 'Request Timed Out' : 'Local Ollama Daemon Offline'}
              </h4>
              <p className="tutor-error-desc">{message.text}</p>
            </div>
          </div>

          {!isTimeout && (
            <div className="tutor-error-command-box">
              <code className="tutor-error-command-text">{commandToCopy}</code>
              <button
                type="button"
                className="tutor-error-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(commandToCopy);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const getStepIcon = (iconType: string) => {
    switch (iconType) {
      case 'presynaptic':
        return <Radio size={15} className="step-indigo" />;
      case 'postsynaptic':
        return <Zap size={15} className="step-teal" />;
      case 'coincidence':
      default:
        return <RefreshCw size={15} className="step-mint" />;
    }
  };

  const getFollowUpIcon = (chipText: string) => {
    if (chipText.toLowerCase().includes('flashcard')) {
      return <Layers size={13} style={{ color: 'var(--color-primary)' }} />;
    }
    if (chipText.toLowerCase().includes('mcq') || chipText.toLowerCase().includes('test')) {
      return <HelpCircle size={13} style={{ color: 'var(--color-secondary)' }} />;
    }
    return <BookmarkPlus size={13} style={{ color: 'var(--color-tertiary)' }} />;
  };

  return (
    <div className="tutor-response-row">
      <div className="tutor-avatar" title="LectureLens Cognitive Engine">
        <img
          src="/leclens.jpg"
          alt="LectureLens AI"
          style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'contain' }}
        />
      </div>

      <div className="tutor-synthesis-card">
        {/* Header with Topic Badge & Latency */}
        <div className="synthesis-header">
          <div className="synthesis-title-group">
            {message.isGrounded === false ? (
              <span className="out-of-scope-badge">
                <AlertCircle size={11} />
                Out of Scope
              </span>
            ) : (
              <>
                <span className="synthesis-tag">Grounded Synthesis</span>
                <span className="synthesis-dot" />
                <span className="synthesis-topic">
                  {message.topicBadge || 'Lecture Concept'}
                </span>
              </>
            )}
          </div>

          <span className="synthesis-latency">
            {message.latencyMs ? `Synthesized in ${(message.latencyMs / 1000).toFixed(1)}s` : 'Grounded'}
          </span>
        </div>

        {/* Narrative Prose */}
        <p className="synthesis-prose" style={{ whiteSpace: 'pre-line' }}>
          {message.text}
        </p>

        {/* 3-Step Sequence Card Grid */}
        {message.sequenceSteps && message.sequenceSteps.length > 0 && (
          <div className="sequence-step-grid">
            {message.sequenceSteps.map((step) => (
              <div key={step.stepNumber} className="sequence-step-card">
                <div className="sequence-step-header">
                  {getStepIcon(step.iconType)}
                  <span
                    className={
                      step.iconType === 'presynaptic'
                        ? 'step-indigo'
                        : step.iconType === 'postsynaptic'
                        ? 'step-teal'
                        : 'step-mint'
                    }
                  >
                    {step.title}
                  </span>
                </div>
                <p className="sequence-step-body">{step.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Direct Multimodal Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="citations-section">
            <span className="citations-label">
              Direct Multimodal Citations ({message.citations.length} References)
            </span>
            <div className="citations-grid">
              {message.citations.map((citation) => (
                <CitationCard
                  key={citation.id}
                  citation={citation}
                  onSeekAudio={onSeekAudio}
                  onOpenTranscript={onOpenTranscript}
                />
              ))}
            </div>
          </div>
        )}

        {/* High-Yield Past Exam Alert (PYQ) */}
        {message.examAlert && (
          <div className="pyq-alert-box">
            <AlertTriangle size={18} className="pyq-alert-icon" />
            <div className="pyq-alert-content">
              <span className="pyq-alert-title">{message.examAlert.title}</span>
              <p className="pyq-alert-desc">{message.examAlert.description}</p>
            </div>
          </div>
        )}

        {/* Recommended Follow-up Chips */}
        {message.followUps && message.followUps.length > 0 && (
          <div className="followups-row">
            <span className="followups-label">Recommended Follow-ups:</span>
            {message.followUps.map((chipText, i) => (
              <button
                key={i}
                type="button"
                className="followup-chip"
                onClick={() => onFollowUpClick && onFollowUpClick(chipText)}
              >
                {getFollowUpIcon(chipText)}
                <span>{chipText}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
