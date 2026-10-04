"""
Manual Transcript Ingestion & Parsing Service for LectureLens.
Parses explicit [MM:SS] timestamps into exact start/end seconds,
and gracefully falls back to estimated paragraph chunking when no timestamps are present.
"""

import re
from typing import Any, Dict, List, Optional, Tuple


def parse_timestamp_seconds(ts_str: str) -> float:
    """
    Convert timestamp string to total seconds.
    Supported:
      - '00:00' -> 0.0
      - '00:18' -> 18.0
      - '1:28'  -> 88.0
      - '01:28' -> 88.0
      - '02:05' -> 125.0
      - '02:22' -> 142.0
      - '03:18' -> 198.0
      - '01:05:22' -> 3922.0
    """
    if not ts_str:
        return 0.0
    parts = ts_str.strip().split(":")
    try:
        if len(parts) == 2:
            return round(float(parts[0]) * 60 + float(parts[1]), 2)
        elif len(parts) == 3:
            return round(float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2]), 2)
    except (ValueError, TypeError):
        pass
    return 0.0


# Regex pattern to match explicit timestamp markers:
# Matches [MM:SS], [M:SS], [HH:MM:SS], and ranges [MM:SS - MM:SS]
# Also handles unbracketed timestamps at the start of a line or paragraph like "00:18 Lecturer:"
TIMESTAMP_MARKER_REGEX = re.compile(
    r"(?:\[[ \t]*(\d{1,2}:\d{2}(?::\d{2})?)[ \t]*(?:-[ \t]*(\d{1,2}:\d{2}(?::\d{2})?)[ \t]*)?\]|"
    r"(?:^|\r?\n)[ \t]*(\d{1,2}:\d{2}(?::\d{2})?)[ \t]*(?:-[ \t]*(\d{1,2}:\d{2}(?::\d{2})?)[ \t]*)?[ \t]*[:-]?[ \t]+)"
)


def has_explicit_timestamps(text: str) -> bool:
    """Check if the text contains at least one explicit timestamp marker."""
    if not text:
        return False
    return bool(TIMESTAMP_MARKER_REGEX.search(text))


def parse_manual_transcript(cleaned_text: str) -> Tuple[List[Dict[str, Any]], float]:
    """
    Parse pasted transcript text into structured timestamped segments.
    If explicit timestamps are present, preserves exact seconds and strips the tag from text.
    If no timestamps are present, falls back to paragraph chunking with estimated speaking rate.
    """
    cleaned_text = cleaned_text.strip()
    if not cleaned_text:
        return [], 0.0

    matches = list(TIMESTAMP_MARKER_REGEX.finditer(cleaned_text))

    # Fallback to estimated timestamps if no explicit timestamps are found
    if not matches:
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", cleaned_text) if p.strip()]
        if not paragraphs:
            paragraphs = [cleaned_text]

        segments: List[Dict[str, Any]] = []
        current_time = 0.0

        for idx, para in enumerate(paragraphs, start=1):
            para_words = len(para.split())
            est_duration = max(5.0, round((para_words / 150.0) * 60.0, 1))
            end_time = round(current_time + est_duration, 1)

            # Detect speaker prefix if present (e.g. "Lecturer: ...")
            speaker = "Speaker"
            spk_match = re.match(r"^([A-Za-z0-9 _]+):\s*(.*)", para, re.DOTALL)
            if spk_match and len(spk_match.group(1).split()) <= 3:
                speaker = spk_match.group(1).strip()

            segments.append({
                "id": f"man-seg-{idx}",
                "start": current_time,
                "end": end_time,
                "startSeconds": current_time,
                "endSeconds": end_time,
                "speaker": speaker,
                "text": para,
            })
            current_time = end_time

        return segments, current_time

    # Explicit timestamps detected -> parse exact seconds
    segments: List[Dict[str, Any]] = []

    # Check for preamble text before the first timestamp
    first_m = matches[0]
    preamble = cleaned_text[:first_m.start()].strip()
    first_ts_str = first_m.group(1) or first_m.group(3)
    first_start = parse_timestamp_seconds(first_ts_str)

    if preamble:
        pre_words = len(preamble.split())
        pre_dur = max(5.0, round((pre_words / 150.0) * 60.0, 1))
        pre_end = first_start if first_start > 0 else pre_dur
        segments.append({
            "id": "man-seg-1",
            "start": 0.0,
            "end": pre_end,
            "startSeconds": 0.0,
            "endSeconds": pre_end,
            "speaker": "Speaker",
            "text": preamble,
        })

    for idx, m in enumerate(matches):
        ts_str = m.group(1) or m.group(3)
        range_end_str = m.group(2) or m.group(4)
        start_ts = parse_timestamp_seconds(ts_str)
        range_end = parse_timestamp_seconds(range_end_str) if range_end_str else None

        # Content is between end of this timestamp marker and the start of next timestamp marker
        content_start = m.end()
        content_end = matches[idx + 1].start() if idx + 1 < len(matches) else len(cleaned_text)
        content = cleaned_text[content_start:content_end].strip()

        # Determine segment end timestamp
        if range_end is not None and range_end > start_ts:
            end_ts = range_end
        elif idx + 1 < len(matches):
            next_ts_str = matches[idx + 1].group(1) or matches[idx + 1].group(3)
            next_start = parse_timestamp_seconds(next_ts_str)
            end_ts = next_start if next_start > start_ts else round(start_ts + 5.0, 1)
        else:
            # Final segment: estimate duration from word count
            words = len(content.split())
            dur = max(5.0, round((words / 150.0) * 60.0, 1))
            end_ts = round(start_ts + dur, 1)

        # Detect speaker prefix if present (e.g. "Lecturer: ...")
        speaker = "Speaker"
        spk_match = re.match(r"^([A-Za-z0-9 _]+):\s*(.*)", content, re.DOTALL)
        if spk_match and len(spk_match.group(1).split()) <= 3:
            speaker = spk_match.group(1).strip()

        segments.append({
            "id": f"man-seg-{len(segments) + 1}",
            "start": start_ts,
            "end": end_ts,
            "startSeconds": start_ts,
            "endSeconds": end_ts,
            "speaker": speaker,
            "text": content,
        })

    total_duration = segments[-1]["end"] if segments else 0.0
    return segments, total_duration
