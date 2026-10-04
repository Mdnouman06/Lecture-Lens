"""
Audio Transcription Service for LectureLens
CTranslate2-based faster-whisper speech-to-text pipeline.
"""

import os
import time
from typing import Any, Dict, List, Optional

try:
    from faster_whisper import WhisperModel
    HAS_WHISPER = True
except ImportError:
    HAS_WHISPER = False
    WhisperModel = None


class Transcriber:
    """Lazy-loaded singleton for WhisperModel inference."""

    _instance: Optional["Transcriber"] = None
    _model: Any = None

    def __init__(self, model_size: str = "base", device: str = "cpu", compute_type: str = "int8"):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type

    @classmethod
    def get_instance(cls) -> "Transcriber":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_model(self):
        if not HAS_WHISPER:
            raise RuntimeError(
                "faster-whisper is not installed. Please install dependencies via `pip install -r requirements.txt`"
            )
        if self._model is None:
            # Initialize model (downloads weights if first run)
            self._model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
            )
        return self._model

    def transcribe_file(self, file_path: str) -> Dict[str, Any]:
        """
        Transcribe audio/video file into structured timestamped segments.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found at: {file_path}")

        model = self.get_model()
        segments_raw, info = model.transcribe(
            file_path,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            beam_size=5,
        )

        segments: List[Dict[str, Any]] = []
        full_text_parts: List[str] = []

        for idx, seg in enumerate(segments_raw, start=1):
            cleaned_text = seg.text.strip()
            if cleaned_text:
                segments.append({
                    "id": f"seg-{idx}",
                    "startSeconds": round(seg.start, 2),
                    "endSeconds": round(seg.end, 2),
                    "speaker": "Speaker 1",
                    "text": cleaned_text,
                })
                full_text_parts.append(cleaned_text)

        total_duration = round(info.duration, 2) if hasattr(info, "duration") else 0.0
        combined_text = " ".join(full_text_parts)

        return {
            "durationSeconds": total_duration,
            "language": info.language if hasattr(info, "language") else "en",
            "segments": segments,
            "fullText": combined_text,
            "wordCount": len(combined_text.split()),
        }


def transcribe_audio(file_path: str) -> Dict[str, Any]:
    """Helper entrypoint for audio transcription."""
    transcriber = Transcriber.get_instance()
    return transcriber.transcribe_file(file_path)
