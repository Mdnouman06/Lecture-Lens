"""
Backend Input Sanitization & Prompt Injection Protection Module
Phase 14: Data Persistence, Authentication, Security & RLS Hardening (SEC-01, SEC-02)

Provides:
1. Prompt sanitization against adversarial jailbreaks and template breakout.
2. Delimiter escaping to protect LLM system instruction boundaries.
3. Media file container validation and path traversal defenses.
"""

import re
from pathlib import Path
from typing import Tuple, Set

# Known adversarial prompt injection patterns
ADVERSARIAL_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|commands?)",
    r"system\s*prompt\s*override",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"act\s+as\s+an?\s+unrestricted\s+ai",
    r"jailbreak",
    r"bypass\s+(all\s+)?safety\s+filters?",
    r"pretend\s+you\s+have\s+no\s+(rules|guidelines|restrictions)",
]

COMPILED_INJECTION_REGEX = re.compile(
    "|".join(f"({pattern})" for pattern in ADVERSARIAL_INJECTION_PATTERNS),
    re.IGNORECASE
)

# Allowed media formats across LectureLens
DEFAULT_ALLOWED_EXTENSIONS: Set[str] = {
    ".mp3",
    ".wav",
    ".mp4",
    ".m4a",
    ".webm",
    ".pdf",
}

def sanitize_prompt_input(text: str, max_chars: int = 4000) -> str:
    """
    Sanitizes user query or transcript text before interpolating into LLM prompt templates.
    1. Truncates input beyond max_chars.
    2. Removes null bytes and dangerous control characters.
    3. Neutralizes adversarial injection strings.
    4. Escapes prompt template delimiters (triple quotes and code fences).
    """
    if not text:
        return ""

    if not isinstance(text, str):
        text = str(text)

    # 1. Strip null bytes and non-printable control characters (preserve \n, \r, \t)
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)

    # 2. Bound length
    if len(cleaned) > max_chars:
        cleaned = cleaned[:max_chars]

    # 3. Neutralize adversarial prompt injection patterns
    cleaned = COMPILED_INJECTION_REGEX.sub("[BLOCKED_INJECTION_ATTEMPT]", cleaned)

    # 4. Neutralize false system role headers
    cleaned = re.sub(r"(?i)###\s*(system|instruction|developer)\s*:", "### [USER_INPUT]:", cleaned)

    # 5. Escape triple quotes to prevent template escaping
    cleaned = cleaned.replace('"""', r'\"\"\"')

    # 6. Escape triple backticks to prevent markdown code fence breaking
    cleaned = cleaned.replace("```", r"\`\`\`")

    return cleaned.strip()

def validate_media_filename(filename: str, allowed_extensions: Set[str] = None) -> Tuple[bool, str]:
    """
    Validates a file upload name for path traversal attacks and allowed extensions.
    Returns (is_valid, sanitized_basename_or_error).
    """
    if not filename:
        return False, "Filename cannot be empty"

    if allowed_extensions is None:
        allowed_extensions = DEFAULT_ALLOWED_EXTENSIONS

    # Reject path traversal patterns and directory separators
    if ".." in filename or "/" in filename or "\\" in filename or "~" in filename:
        return False, "Path traversal sequence detected in filename"

    clean_name = filename

    # Check extension
    suffix = Path(clean_name).suffix.lower()
    if not suffix:
        return False, "File must have a valid extension"

    if suffix not in allowed_extensions:
        return False, f"Unsupported file extension '{suffix}'. Allowed: {', '.join(sorted(allowed_extensions))}"

    return True, clean_name

def check_request_size(content_length: int, max_bytes: int = 100 * 1024 * 1024) -> bool:
    """
    Enforces payload size constraints (default 100MB).
    """
    if content_length is None or content_length < 0:
        return True
    return content_length <= max_bytes
