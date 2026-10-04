import React, { useState } from 'react';
import {
  X,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { LocalAiHealth } from '../../types/navigation';

interface LocalAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiHealth: LocalAiHealth;
  onCheckHealth: () => Promise<void>;
  onToggleDemoMode: () => void;
}

export const LocalAiModal: React.FC<LocalAiModalProps> = ({
  isOpen,
  onClose,
  aiHealth,
  onCheckHealth,
  onToggleDemoMode,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onCheckHealth();
    setIsRefreshing(false);
  };

  const isConnected = aiHealth.status === 'connected';

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="local-ai-title"
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <img
              src="/leclens.jpg"
              alt="LectureLens Logo"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                flexShrink: 0,
              }}
            />
            <div>
              <h2 id="local-ai-title" className="modal-title">
                Local AI Engine Status
              </h2>
              <p style={{ fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)' }}>
                Zero Cloud Costs • Full Privacy • Offline Processing
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Status Overview Card */}
          <div
            className={`status-summary-card ${
              isConnected ? 'connected' : 'offline'
            }`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                className={`status-dot ${isConnected ? 'connected' : 'offline'}`}
                style={{ width: '10px', height: '10px' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>
                  {isConnected
                    ? '🟢 Local AI Online (Ollama + Whisper)'
                    : '🟡 Interactive Demo Mode Active'}
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-micro)',
                    color: 'var(--color-on-surface-variant)',
                    marginTop: '2px',
                  }}
                >
                  {isConnected
                    ? `Connected to ${aiHealth.endpoint} (${aiHealth.latencyMs}ms latency)`
                    : 'Local FastAPI service not detected on localhost:8000. Operating with pre-seeded academic lectures.'}
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
                fontSize: 'var(--text-label)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isRefreshing ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
              Ping Service
            </button>
          </div>

          {/* Engine Metadata Pill Matrix */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-sm)',
            }}
          >
            <div
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-micro)',
                  color: 'var(--color-on-surface-variant)',
                  marginBottom: '2px',
                }}
              >
                Inference LLM
              </div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                {aiHealth.model || 'qwen3:0.6b'}
              </div>
            </div>

            <div
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-micro)',
                  color: 'var(--color-on-surface-variant)',
                  marginBottom: '2px',
                }}
              >
                Speech Engine
              </div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-label)' }}>
                {aiHealth.whisperEngine || 'faster-whisper'}
              </div>
            </div>

            <div
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-micro)',
                  color: 'var(--color-on-surface-variant)',
                  marginBottom: '2px',
                }}
              >
                Endpoint
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 'var(--text-label)',
                  fontFamily: 'var(--font-family-mono)',
                }}
              >
                :8000
              </div>
            </div>
          </div>

          {/* Quick Terminal Launch Commands */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-xs)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-label)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Terminal size={14} /> Local Setup Instructions (Terminal)
              </span>
              <span
                style={{
                  fontSize: 'var(--text-micro)',
                  color: 'var(--color-on-surface-variant)',
                }}
              >
                Phase 2 Bridge
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-on-surface-variant)',
                    marginBottom: '3px',
                  }}
                >
                  1. Launch Ollama inference model:
                </div>
                <div className="command-box">
                  <code>ollama serve ; ollama run qwen3:0.6b</code>
                  <button
                    className="copy-btn"
                    onClick={() =>
                      handleCopy('ollama serve ; ollama run qwen3:0.6b', 'cmd1')
                    }
                  >
                    {copiedKey === 'cmd1' ? (
                      <>
                        <Check size={12} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-on-surface-variant)',
                    marginBottom: '3px',
                  }}
                >
                  2. Launch FastAPI local bridge server:
                </div>
                <div className="command-box">
                  <code>python -m uvicorn main:app --reload --port 8000</code>
                  <button
                    className="copy-btn"
                    onClick={() =>
                      handleCopy(
                        'python -m uvicorn main:app --reload --port 8000',
                        'cmd2'
                      )
                    }
                  >
                    {copiedKey === 'cmd2' ? (
                      <>
                        <Check size={12} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Zero-Token Cost Guarantee */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(79, 70, 229, 0.05)',
              border: '1px solid rgba(79, 70, 229, 0.15)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <ShieldCheck size={16} color="var(--color-primary-container)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--color-on-surface)' }}>Zero Cloud Exposure:</strong> All audio transcription and LLM inference run strictly on your machine. No recordings or study notes are sent to external third-party APIs.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--text-label)', color: 'var(--color-on-surface-variant)' }}>
              Interactive Demo Mode:
            </span>
            <button
              onClick={onToggleDemoMode}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                background: aiHealth.isDemoMode
                  ? 'var(--color-primary-container)'
                  : 'var(--color-surface-container)',
                color: aiHealth.isDemoMode ? '#ffffff' : 'var(--color-on-surface)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {aiHealth.isDemoMode ? 'Enabled (Default)' : 'Disabled'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="btn-primary-cta"
            style={{ height: '34px', padding: '0 16px', fontSize: '13px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalAiModal;
