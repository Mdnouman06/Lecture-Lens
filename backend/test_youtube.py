"""
Unit tests for LectureLens YouTube ingestion pipeline.
Covers:
A. Standard YouTube URL extraction
B. YouTube short URL extraction
C. Native transcript success (instance API)
D. Native transcript unavailable -> audio fallback
E. Audio fallback returns valid timestamped segments
F. yt-dlp failure returns truthful error
G. No synthetic transcript returned
H. Truthful source metadata (sourceType: 'youtube', ingestionMethod)
"""

import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.youtube import (
    extract_video_id,
    fetch_youtube_captions,
    extract_youtube_audio_and_transcribe,
    get_video_title,
    ingest_youtube_lecture,
)


class MockSnippet:
    def __init__(self, text: str, start: float, duration: float):
        self.text = text
        self.start = start
        self.duration = duration


class TestYouTubeIngestionPipeline(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    # -------------------------------------------------------------------------
    # A. Standard YouTube URL Extraction
    # -------------------------------------------------------------------------
    def test_standard_url_extraction(self):
        urls = [
            "https://www.youtube.com/watch?v=Wt5EMpUt-_g",
            "http://www.youtube.com/watch?v=Wt5EMpUt-_g&feature=share",
            "https://youtube.com/watch?v=Wt5EMpUt-_g&t=120s",
            "https://m.youtube.com/watch?v=Wt5EMpUt-_g",
        ]
        for url in urls:
            vid = extract_video_id(url)
            self.assertEqual(vid, "Wt5EMpUt-_g", f"Failed for {url}")

    # -------------------------------------------------------------------------
    # B. YouTube Short URL Extraction
    # -------------------------------------------------------------------------
    def test_short_and_embed_url_extraction(self):
        urls = [
            ("https://youtu.be/Wt5EMpUt-_g", "Wt5EMpUt-_g"),
            ("https://youtu.be/Wt5EMpUt-_g?t=45", "Wt5EMpUt-_g"),
            ("https://www.youtube.com/embed/Wt5EMpUt-_g", "Wt5EMpUt-_g"),
            ("https://www.youtube.com/shorts/Wt5EMpUt-_g", "Wt5EMpUt-_g"),
            ("Wt5EMpUt-_g", "Wt5EMpUt-_g"),
        ]
        for url, expected in urls:
            vid = extract_video_id(url)
            self.assertEqual(vid, expected, f"Failed for {url}")

    def test_invalid_url_returns_none(self):
        invalid_urls = [
            "https://example.com/not-youtube",
            "https://vimeo.com/12345678",
            "not-a-youtube-url",
            "",
            None,
        ]
        for url in invalid_urls:
            self.assertIsNone(extract_video_id(url), f"Should be None for {url}")

    # -------------------------------------------------------------------------
    # C. Native Transcript Success (Instance API)
    # -------------------------------------------------------------------------
    @patch("backend.services.youtube._fetch_transcript_data")
    def test_native_transcript_success(self, mock_fetch_data):
        mock_fetch_data.return_value = [
            MockSnippet("Photosynthesis takes place in chloroplasts.", 0.5, 4.0),
            MockSnippet("Light reactions convert solar energy to ATP.", 5.0, 5.5),
        ]

        result = fetch_youtube_captions("Wt5EMpUt-_g")
        self.assertTrue(result["success"])
        self.assertFalse(result["fallback_required"])
        self.assertEqual(result["sourceType"], "youtube")
        self.assertEqual(result["ingestionMethod"], "youtube_captions")
        self.assertEqual(len(result["segments"]), 2)

        # Check timestamp schema: start, end, startSeconds, endSeconds
        seg1 = result["segments"][0]
        self.assertEqual(seg1["start"], 0.5)
        self.assertEqual(seg1["end"], 4.5)
        self.assertEqual(seg1["startSeconds"], 0.5)
        self.assertEqual(seg1["endSeconds"], 4.5)
        self.assertEqual(seg1["text"], "Photosynthesis takes place in chloroplasts.")
        self.assertEqual(result["durationSeconds"], 10.5)

    # -------------------------------------------------------------------------
    # D. Native Transcript Unavailable -> Audio Fallback
    # -------------------------------------------------------------------------
    @patch("backend.main.get_video_title", return_value="Photosynthesis Lecture")
    @patch("backend.main.extract_youtube_audio_and_transcribe")
    @patch("backend.main.fetch_youtube_captions")
    def test_native_unavailable_triggers_audio_fallback(self, mock_fetch_captions, mock_audio_fallback, _mock_title):
        mock_fetch_captions.return_value = {
            "success": False,
            "fallback_required": True,
            "error": "Captions are disabled by the video owner",
        }

        mock_audio_fallback.return_value = {
            "success": True,
            "fallback_required": False,
            "sourceType": "youtube",
            "ingestionMethod": "youtube_audio_faster_whisper",
            "videoId": "Wt5EMpUt-_g",
            "title": "Photosynthesis Lecture",
            "durationSeconds": 287.0,
            "segments": [
                {
                    "id": "yt-seg-1",
                    "start": 0.0,
                    "end": 5.0,
                    "startSeconds": 0.0,
                    "endSeconds": 5.0,
                    "speaker": "Speaker",
                    "text": "Breaking down photosynthesis stages.",
                }
            ],
            "fullText": "Breaking down photosynthesis stages.",
            "wordCount": 4,
        }

        resp = self.client.post("/ingest/youtube", json={"url": "https://www.youtube.com/watch?v=Wt5EMpUt-_g"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertFalse(data.get("fallbackRequired", False))
        self.assertEqual(data["sourceType"], "youtube")
        self.assertEqual(data["ingestionMethod"], "youtube_audio_faster_whisper")
        self.assertEqual(data["title"], "Photosynthesis Lecture")
        self.assertEqual(len(data["segments"]), 1)
        mock_audio_fallback.assert_called_once()

    # -------------------------------------------------------------------------
    # E. Audio Fallback Returns Valid Timestamped Segments
    # -------------------------------------------------------------------------
    @patch("backend.services.youtube.yt_dlp.YoutubeDL")
    @patch("backend.services.youtube.transcribe_audio")
    def test_audio_fallback_valid_segments(self, mock_transcribe, mock_ydl_class):
        mock_ydl_instance = MagicMock()
        mock_ydl_instance.extract_info.return_value = {
            "id": "Wt5EMpUt-_g",
            "title": "Photosynthesis Lecture Audio",
            "ext": "m4a",
        }
        mock_ydl_instance.prepare_filename.return_value = "dummy.m4a"
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl_instance

        mock_transcribe.return_value = {
            "durationSeconds": 120.0,
            "segments": [
                {"id": "seg-1", "startSeconds": 0.0, "endSeconds": 15.0, "speaker": "Lecturer", "text": "Light reactions."},
                {"id": "seg-2", "startSeconds": 15.0, "endSeconds": 30.0, "speaker": "Lecturer", "text": "Calvin cycle."},
            ],
            "fullText": "Light reactions. Calvin cycle.",
            "wordCount": 4,
        }

        with patch("os.path.exists", return_value=True):
            result = extract_youtube_audio_and_transcribe("https://www.youtube.com/watch?v=Wt5EMpUt-_g", "Wt5EMpUt-_g")

        self.assertTrue(result["success"])
        self.assertEqual(result["ingestionMethod"], "youtube_audio_faster_whisper")
        self.assertEqual(len(result["segments"]), 2)
        # Verify schema conformity
        for seg in result["segments"]:
            self.assertIn("start", seg)
            self.assertIn("end", seg)
            self.assertIn("startSeconds", seg)
            self.assertIn("endSeconds", seg)
            self.assertIn("speaker", seg)
            self.assertIn("text", seg)

    # -------------------------------------------------------------------------
    # F. yt-dlp Failure Returns Truthful Error
    # -------------------------------------------------------------------------
    @patch("backend.services.youtube.yt_dlp.YoutubeDL")
    def test_ytdlp_failure_returns_truthful_error(self, mock_ydl_class):
        mock_ydl_instance = MagicMock()
        mock_ydl_instance.extract_info.side_effect = Exception("HTTP 403 Forbidden: YouTube blocked the request")
        mock_ydl_class.return_value.__enter__.return_value = mock_ydl_instance

        result = extract_youtube_audio_and_transcribe("https://www.youtube.com/watch?v=Wt5EMpUt-_g", "Wt5EMpUt-_g")

        self.assertFalse(result["success"])
        self.assertTrue(result["fallback_required"])
        self.assertTrue(result["is_download_error"])
        self.assertIn("YouTube audio download failed", result["error"])
        self.assertIn("could not be downloaded for local transcription", result["message"])

    # -------------------------------------------------------------------------
    # G. No Synthetic Transcript Returned When All Fail
    # -------------------------------------------------------------------------
    @patch("backend.main.extract_youtube_audio_and_transcribe")
    @patch("backend.main.fetch_youtube_captions")
    def test_no_synthetic_transcript_on_failure(self, mock_fetch_captions, mock_audio_fallback):
        mock_fetch_captions.return_value = {
            "success": False,
            "fallback_required": True,
            "error": "No captions available",
        }
        mock_audio_fallback.return_value = {
            "success": False,
            "fallback_required": True,
            "is_download_error": True,
            "error": "Download blocked",
            "message": "The video could not be downloaded for local transcription.",
        }

        resp = self.client.post("/ingest/youtube", json={"url": "https://www.youtube.com/watch?v=Wt5EMpUt-_g"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertTrue(data.get("fallbackRequired"))
        # Ensure NO synthetic segments are returned
        self.assertNotIn("segments", data)
        self.assertNotIn("fullText", data)
        # Truthful error message preserved
        self.assertIn("could not be downloaded", data["message"])

    # -------------------------------------------------------------------------
    # H. Source Metadata is Truthful and Accurate
    # -------------------------------------------------------------------------
    @patch("backend.main.get_video_title", return_value="Khan Academy Biology")
    @patch("backend.main.fetch_youtube_captions")
    def test_source_metadata_native(self, mock_fetch, _mock_title):
        mock_fetch.return_value = {
            "success": True,
            "sourceType": "youtube",
            "ingestionMethod": "youtube_captions",
            "durationSeconds": 60.0,
            "segments": [{"id": "yt-1", "start": 0, "end": 5, "startSeconds": 0, "endSeconds": 5, "text": "Hi", "speaker": "Speaker"}],
            "fullText": "Hi",
            "wordCount": 1,
        }

        resp = self.client.post("/ingest/youtube", json={"url": "https://www.youtube.com/watch?v=Wt5EMpUt-_g"})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertEqual(data["sourceType"], "youtube")
        self.assertEqual(data["ingestionMethod"], "youtube_captions")
        self.assertNotEqual(data["sourceType"], "pdf")
        self.assertNotEqual(data["sourceType"], "transcript")


if __name__ == "__main__":
    unittest.main()
