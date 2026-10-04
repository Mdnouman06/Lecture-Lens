"""
YouTube Caption Retrieval & Audio Fallback Ingestion Service for LectureLens
Fetches auto-generated or official captions using modern youtube-transcript-api,
and gracefully falls back to local yt-dlp audio download + faster-whisper transcription.
"""

import os
import re
import shutil
import tempfile
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlparse

try:
    from youtube_transcript_api import (
        NoTranscriptFound,
        TranscriptsDisabled,
        YouTubeTranscriptApi,
    )
    HAS_YT_API = True
except ImportError:
    HAS_YT_API = False
    YouTubeTranscriptApi = None

try:
    import yt_dlp
    HAS_YTDLP = True
except ImportError:
    HAS_YTDLP = False
    yt_dlp = None

try:
    from services.transcription import transcribe_audio
except ImportError:
    try:
        from backend.services.transcription import transcribe_audio
    except ImportError:
        transcribe_audio = None


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube 11-character video ID from varied URL formats.
    Supported:
      - https://www.youtube.com/watch?v=dQw4w9WgXcQ
      - https://youtu.be/dQw4w9WgXcQ
      - https://www.youtube.com/embed/dQw4w9WgXcQ
      - https://www.youtube.com/shorts/dQw4w9WgXcQ
    """
    if not url:
        return None

    url = url.strip()

    # youtu.be/<id>
    if "youtu.be/" in url:
        parsed = urlparse(url)
        path = parsed.path.lstrip("/").split("?")[0].split("/")[0]
        if re.match(r"^[a-zA-Z0-9_-]{11}$", path):
            return path

    # youtube.com/embed/<id> or /shorts/<id>
    match = re.search(r"youtube\.com/(?:embed|shorts)/([a-zA-Z0-9_-]{11})", url)
    if match:
        return match.group(1)

    # youtube.com/watch?v=<id>
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        query_params = parse_qs(parsed.query)
        if "v" in query_params and query_params["v"]:
            vid = query_params["v"][0]
            if re.match(r"^[a-zA-Z0-9_-]{11}$", vid):
                return vid

    # If already an 11-char ID without path/protocol
    if re.match(r"^[a-zA-Z0-9_-]{11}$", url) and not ("/" in url or "http" in url):
        return url

    return None


def get_video_title(video_id: str, default: Optional[str] = None) -> str:
    """
    Fetch YouTube video title using oEmbed endpoint (fast, lightweight, no API key).
    Falls back to default or generic title if uncontactable.
    """
    default_title = default or f"YouTube Lecture ({video_id})"
    try:
        import requests
        resp = requests.get(
            f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json",
            timeout=4,
        )
        if resp.status_code == 200:
            data = resp.json()
            title = data.get("title")
            if title and title.strip():
                return title.strip()
    except Exception:
        pass
    return default_title


def _fetch_transcript_data(video_id: str) -> Any:
    """
    Retrieve transcript snippets using the supported instance API:
    YouTubeTranscriptApi().fetch(video_id, languages=["en"])
    with fallback to static API for backwards compatibility / mock testing.
    """
    if not HAS_YT_API or YouTubeTranscriptApi is None:
        raise RuntimeError("youtube-transcript-api is not installed.")

    api = None
    try:
        api = YouTubeTranscriptApi()
    except TypeError:
        api = YouTubeTranscriptApi

    # Try modern instance fetch: YouTubeTranscriptApi().fetch(video_id, languages=["en"])
    if hasattr(api, "fetch"):
        try:
            return api.fetch(video_id, languages=["en"])
        except Exception:
            try:
                return api.fetch(video_id, languages=["en", "en-US", "en-GB", "a.en"])
            except Exception:
                return api.fetch(video_id)

    # Static API fallback if present
    if hasattr(YouTubeTranscriptApi, "get_transcript"):
        return YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "en-US", "en-GB", "a.en"])

    if api is not None and hasattr(api, "get_transcript"):
        return api.get_transcript(video_id, languages=["en", "en-US", "en-GB", "a.en"])

    raise AttributeError("No supported fetch or get_transcript method found on YouTubeTranscriptApi")


def fetch_youtube_captions(video_id: str) -> Dict[str, Any]:
    """
    Query YouTube transcript API and format into timestamped segments.
    Uses instance API YouTubeTranscriptApi().fetch(video_id, languages=["en"]).
    Returns structured result with fallback_required flag on failure.
    """
    if not HAS_YT_API or YouTubeTranscriptApi is None:
        return {
            "success": False,
            "fallback_required": True,
            "videoId": video_id,
            "error": "youtube-transcript-api is not installed.",
            "message": "Captions are unavailable for this video.",
        }

    try:
        transcript_data = _fetch_transcript_data(video_id)

        segments: List[Dict[str, Any]] = []
        full_text_parts: List[str] = []
        total_duration = 0.0

        for idx, item in enumerate(transcript_data, start=1):
            if isinstance(item, dict):
                start = round(float(item.get("start", 0.0)), 2)
                duration = round(float(item.get("duration", 0.0)), 2)
                text = str(item.get("text", "")).strip()
            else:
                start = round(float(getattr(item, "start", 0.0)), 2)
                duration = round(float(getattr(item, "duration", 0.0)), 2)
                text = str(getattr(item, "text", "")).strip()

            end = round(start + duration, 2)

            if text:
                segments.append({
                    "id": f"yt-seg-{idx}",
                    "start": start,
                    "end": end,
                    "startSeconds": start,
                    "endSeconds": end,
                    "speaker": "Speaker",
                    "text": text,
                })
                full_text_parts.append(text)
                if end > total_duration:
                    total_duration = end

        combined_text = " ".join(full_text_parts)

        return {
            "success": True,
            "fallback_required": False,
            "sourceType": "youtube",
            "ingestionMethod": "youtube_captions",
            "videoId": video_id,
            "durationSeconds": total_duration,
            "segments": segments,
            "fullText": combined_text,
            "wordCount": len(combined_text.split()),
        }

    except TranscriptsDisabled:
        return {
            "success": False,
            "fallback_required": True,
            "videoId": video_id,
            "error": "Captions are disabled by the video owner for this YouTube lecture.",
            "message": "Captions are unavailable for this video.",
        }
    except NoTranscriptFound:
        return {
            "success": False,
            "fallback_required": True,
            "videoId": video_id,
            "error": "No English transcript could be found for this video.",
            "message": "Captions are unavailable for this video.",
        }
    except Exception as exc:
        return {
            "success": False,
            "fallback_required": True,
            "videoId": video_id,
            "error": f"Failed to fetch YouTube captions: {str(exc)}",
            "message": "Captions are unavailable for this video.",
        }


def extract_youtube_audio_and_transcribe(url: str, video_id: str) -> Dict[str, Any]:
    """
    Local audio fallback:
    Downloads best available audio via yt-dlp and transcribes using local faster-whisper.
    Does NOT use cloud APIs or Gemini.
    """
    if not HAS_YTDLP or yt_dlp is None:
        return {
            "success": False,
            "fallback_required": True,
            "videoId": video_id,
            "error": "yt-dlp is not installed in the backend Python environment.",
            "message": "Captions are unavailable for this video.",
            "is_download_error": True,
        }

    target_url = url if url.startswith("http") else f"https://www.youtube.com/watch?v={video_id}"
    extracted_title = None

    with tempfile.TemporaryDirectory() as tmpdir:
        outtmpl = os.path.join(tmpdir, "%(id)s.%(ext)s")
        ydl_opts = {
            "format": "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best",
            "outtmpl": outtmpl,
            "quiet": True,
            "no_warnings": True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(target_url, download=True)
                if isinstance(info, dict):
                    extracted_title = info.get("title")
                    target_file = ydl.prepare_filename(info)
                else:
                    target_file = os.path.join(tmpdir, f"{video_id}.m4a")

                if not os.path.exists(target_file):
                    candidates = [
                        os.path.join(tmpdir, f)
                        for f in os.listdir(tmpdir)
                        if os.path.isfile(os.path.join(tmpdir, f))
                    ]
                    if candidates:
                        target_file = candidates[0]
                    else:
                        raise FileNotFoundError("Audio extraction produced no media file on disk.")
        except Exception as exc:
            err_msg = str(exc)
            return {
                "success": False,
                "fallback_required": True,
                "videoId": video_id,
                "error": f"YouTube audio download failed: {err_msg}",
                "message": "YouTube audio download failed. The video could not be downloaded for local transcription.",
                "is_download_error": True,
            }

        try:
            if transcribe_audio is None:
                raise RuntimeError("transcribe_audio service is unavailable.")
            whisper_res = transcribe_audio(target_file)
        except Exception as exc:
            err_msg = str(exc)
            return {
                "success": False,
                "fallback_required": True,
                "videoId": video_id,
                "error": f"faster-whisper transcription failed: {err_msg}",
                "message": f"Audio extracted but local faster-whisper transcription failed: {err_msg}",
                "is_download_error": False,
            }

    raw_segs = whisper_res.get("segments", [])
    segments: List[Dict[str, Any]] = []
    for idx, seg in enumerate(raw_segs, start=1):
        start = round(float(seg.get("startSeconds", seg.get("start", 0.0))), 2)
        end = round(float(seg.get("endSeconds", seg.get("end", 0.0))), 2)
        text = str(seg.get("text", "")).strip()
        speaker = seg.get("speaker", "Speaker")
        if text:
            segments.append({
                "id": f"yt-seg-{idx}",
                "start": start,
                "end": end,
                "startSeconds": start,
                "endSeconds": end,
                "speaker": speaker,
                "text": text,
            })

    total_secs = round(float(whisper_res.get("durationSeconds", 0.0)), 2)
    if not total_secs and segments:
        total_secs = segments[-1]["endSeconds"]

    combined_text = whisper_res.get("fullText", " ".join(s["text"] for s in segments))

    return {
        "success": True,
        "fallback_required": False,
        "sourceType": "youtube",
        "ingestionMethod": "youtube_audio_faster_whisper",
        "videoId": video_id,
        "title": extracted_title,
        "durationSeconds": total_secs,
        "segments": segments,
        "fullText": combined_text,
        "wordCount": len(combined_text.split()),
    }


def ingest_youtube_lecture(url: str, video_id: str) -> Dict[str, Any]:
    """
    Unified YouTube Ingestion Pipeline:
    1. Attempt native captions via YouTubeTranscriptApi().fetch(video_id, languages=["en"]).
    2. If native captions fail for ANY recoverable reason, fall back to yt-dlp + faster-whisper.
    3. Return structured transcript segments or truthful error message if both fail.
    """
    # 1. Native caption attempt
    native_res = fetch_youtube_captions(video_id)
    if native_res.get("success", False) and native_res.get("segments"):
        if not native_res.get("title"):
            native_res["title"] = get_video_title(video_id)
        return native_res

    # 2. Local audio fallback via yt-dlp + faster-whisper
    audio_res = extract_youtube_audio_and_transcribe(url, video_id)
    if audio_res.get("success", False) and audio_res.get("segments"):
        if not audio_res.get("title"):
            audio_res["title"] = get_video_title(video_id)
        return audio_res

    # 3. Both failed
    if audio_res.get("is_download_error"):
        user_msg = audio_res.get("message", "The video could not be downloaded for local transcription.")
    else:
        user_msg = "Captions are unavailable for this video."

    return {
        "success": False,
        "fallback_required": True,
        "videoId": video_id,
        "url": url,
        "error": audio_res.get("error") or native_res.get("error") or "Captions and audio fallback unavailable",
        "message": user_msg,
    }

