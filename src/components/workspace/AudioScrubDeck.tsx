import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import '../../styles/workspace.css';

interface AudioScrubDeckProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onJump: (deltaSeconds: number) => void;
  speakerName?: string;
  topicTag?: string;
}

// Fixed 70-bar acoustic waveform pattern simulating speech dynamics
const WAVEFORM_HEIGHTS = [
  25, 45, 75, 30, 55, 85, 65, 95, 40, 70,
  80, 100, 50, 75, 60, 90, 80, 55, 70, 98,
  45, 72, 60, 88, 35, 65, 82, 48, 70, 92,
  55, 78, 62, 90, 40, 68, 85, 52, 75, 95,
  38, 64, 80, 45, 70, 92, 58, 82, 65, 96,
  42, 68, 85, 50, 72, 90, 60, 84, 48, 75,
  88, 55, 78, 62, 90, 45, 68, 82, 52, 70,
];

function formatTimecode(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const AudioScrubDeck: React.FC<AudioScrubDeckProps> = ({
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onJump,
  speakerName = 'Lecturer',
  topicTag = '',
}) => {
  const [speed, setSpeed] = useState<number>(1.25);
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const activeBarIndex = Math.floor(progressRatio * 70);

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="audio-scrub-deck" role="region" aria-label="Audio Playback and Scrubbing Controls">
      {/* Upper Control Bar */}
      <div className="audio-controls-row">
        {/* Left: Playback & Jump Controls + Timecode + Speaker */}
        <div className="audio-playback-group">
          <div className="audio-buttons-cluster">
            <button
              className="audio-jump-btn"
              onClick={() => onJump(-10)}
              title="Rewind 10 seconds"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw size={16} />
            </button>

            <button
              className="audio-play-toggle"
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause lecture' : 'Play lecture audio'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </button>

            <button
              className="audio-jump-btn"
              onClick={() => onJump(10)}
              title="Forward 10 seconds"
              aria-label="Forward 10 seconds"
            >
              <RotateCw size={16} />
            </button>
          </div>

          {/* Timecode */}
          <div className="audio-timecode-track">
            <span className="audio-time-current">{formatTimecode(currentTime)}</span>
            <span className="audio-time-total">/ {formatTimecode(duration)}</span>
          </div>

          {/* Speaker Diarization Chip */}
          <div className="speaker-diarization-chip">
            <span className="status-dot connected" style={{ width: '8px', height: '8px' }} />
            <strong style={{ color: 'var(--color-primary-container)' }}>{speakerName}</strong>
            {topicTag ? <span style={{ color: 'var(--color-on-surface-variant)' }}>• {topicTag}</span> : null}
          </div>
        </div>

        {/* Right: Speed Segmented Control & Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Speed Picker */}
          <div className="speed-segmented-picker" role="group" aria-label="Playback speed">
            {[1.0, 1.25, 1.5, 2.0].map((s) => (
              <button
                key={s}
                className={`speed-option-btn ${speed === s ? 'active' : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Volume Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-on-surface-variant)' }}>
            <Volume2 size={16} />
            <div
              style={{
                width: '60px',
                height: '5px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-container-highest)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '80%',
                  height: '100%',
                  background: 'var(--color-primary-container)',
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>
          </div>

          {/* Transcript Verified Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--text-micro)',
              fontWeight: 600,
              color: '#047857',
            }}
          >
            <CheckCircle2 size={14} color="#10b981" />
            <span>Whisper STT Ready</span>
          </div>
        </div>
      </div>

      {/* 70-Bar Dynamic Waveform */}
      <div
        className="waveform-track-container"
        onClick={handleWaveformClick}
        title="Click anywhere to scrub playback"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-label="Lecture audio timeline"
      >
        {WAVEFORM_HEIGHTS.map((h, idx) => {
          const isPlayed = idx <= activeBarIndex;
          return (
            <div
              key={idx}
              className={`waveform-bar ${isPlayed ? 'played' : 'unplayed'}`}
              style={{ height: `${h}%` }}
            />
          );
        })}

        {/* Draggable Playhead Node */}
        <div
          className="waveform-playhead-node"
          style={{ left: `${progressRatio * 100}%` }}
        >
          <div className="waveform-scrub-handle" />
        </div>
      </div>
    </div>
  );
};

export default AudioScrubDeck;
