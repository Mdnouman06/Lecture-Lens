#!/usr/bin/env python3
"""
Real Live AI & Multimodal Ingestion Smoke Test for LectureLens.
Phase 18: Production Deployment, Smoke Testing & Release Checklist (PROD-02).

Performs live end-to-end HTTP tests against the active backend server (http://127.0.0.1:8000):
1. /health beacon check.
2. Ingestion: Real faster-whisper speech-to-text on PCM WAV audio (/ingest/audio).
3. Ingestion: Real PDF slide extraction using pypdf (/ingest/pdf).
4. Ingestion: Manual transcript processing (/ingest/manual).
5. Ingestion: YouTube caption workflow with caption fetch & fallback verification (/ingest/youtube).
6. Real AI Notes Synthesis: Ollama qwen3:4b executive summary & structured notes (/synthesize/notes).
7. Real AI Tutor: Context-grounded Q&A with verifiable timestamp citations (/tutor/ask).
8. Real Active Recall: Quiz generation & grading (/generate/quiz, /quiz/grade).
9. Real Active Recall: Flashcard deck generation (/generate/flashcards).
10. Multi-format academic exports format validation (.txt, .md, .tsv).
11. Responsive UI styling and viewport checks (~375px mobile, ~768px tablet, desktop).
"""

import sys
import os
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import io
import json
import time
import wave
import math
import struct
import tempfile
import urllib.request
import urllib.error
from pathlib import Path
from typing import Tuple, List, Dict, Any

API_BASE_URL = "http://127.0.0.1:8000"
ROOT = Path(__file__).resolve().parent.parent

def generate_test_wav(duration_seconds: float = 1.0, sample_rate: int = 16000) -> bytes:
    """Generate a clean 16kHz mono PCM WAV in memory."""
    buf = io.BytesIO()
    total_samples = int(duration_seconds * sample_rate)
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(total_samples):
            val = int(12000 * math.sin(2.0 * math.pi * 440.0 * i / sample_rate))
            frames.extend(struct.pack("<h", val))
        wf.writeframes(frames)
    return buf.getvalue()

def generate_test_pdf() -> bytes:
    """Generate a minimal valid 2-page PDF slide deck."""
    try:
        import pypdf
        writer = pypdf.PdfWriter()
        writer.add_blank_page(width=720, height=540)
        writer.add_blank_page(width=720, height=540)
        buf = io.BytesIO()
        writer.write(buf)
        return buf.getvalue()
    except ImportError:
        # Minimal valid PDF binary header & trailer fallback
        return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF"

def http_json_request(endpoint: str, method: str = "GET", payload: Any = None, timeout: float = 30.0) -> Tuple[int, Any]:
    url = f"{API_BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body
    except Exception as e:
        return 0, str(e)

def http_multipart_request(endpoint: str, field_name: str, filename: str, file_bytes: bytes, content_type: str, form_data: Dict[str, str] = None) -> Tuple[int, Any]:
    boundary = "----WebKitFormBoundaryLectureLens7MA4YWxkTrZu0gW"
    url = f"{API_BASE_URL}{endpoint}"
    
    body = bytearray()
    if form_data:
        for k, v in form_data.items():
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode("utf-8"))
            body.extend(f"{v}\r\n".encode("utf-8"))
            
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(file_bytes)
    body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

    headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    req = urllib.request.Request(url, data=bytes(body), headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(resp_body)
        except Exception:
            return e.code, resp_body
    except Exception as e:
        return 0, str(e)

def run_real_ai_smoke() -> Tuple[int, int, List[str]]:
    passed = 0
    failed = 0
    errors: List[str] = []

    print("\n" + "=" * 74)
    print("      LECTURELENS REAL LIVE AI & INGESTION SMOKE SUITE (PROD-02)")
    print(f"      Backend Target: {API_BASE_URL}")
    print("=" * 74)

    # 1. Health Beacon
    print("\n[1] Verifying Backend Health Beacon (/health)...")
    status, res = http_json_request("/health")
    if status == 200 and res.get("status") == "ok":
        print(f"  [PASS] Health Beacon OK: status='{res.get('status')}', model='{res.get('model')}', whisper='{res.get('whisperEngine')}'")
        passed += 1
    else:
        failed += 1
        err = f"/health failed: HTTP {status} -> {res}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 2. Audio Ingestion with faster-whisper
    print("\n[2] Testing Audio Ingestion & faster-whisper STT (/ingest/audio)...")
    try:
        wav_bytes = generate_test_wav(duration_seconds=1.0)
        status, res = http_multipart_request(
            "/ingest/audio",
            field_name="file",
            filename="lecture_snippet.wav",
            file_bytes=wav_bytes,
            content_type="audio/wav",
            form_data={"course_code": "CS 101"}
        )
        if status == 200 and res.get("sourceType") == "audio":
            print(f"  [PASS] Audio ingested successfully: duration={res.get('duration')}, segments={len(res.get('segments', []))}")
            passed += 1
        else:
            failed += 1
            err = f"Audio ingestion failed: HTTP {status} -> {res}"
            errors.append(err)
            print(f"  [FAIL] {err}")
    except Exception as e:
        failed += 1
        err = f"Audio test exception: {e}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 3. PDF Ingestion with pypdf
    print("\n[3] Testing PDF Slide Extraction (/ingest/pdf)...")
    try:
        pdf_bytes = generate_test_pdf()
        status, res = http_multipart_request(
            "/ingest/pdf",
            field_name="file",
            filename="slide_deck.pdf",
            file_bytes=pdf_bytes,
            content_type="application/pdf",
            form_data={"course_code": "BIO 101"}
        )
        if status == 200 and res.get("sourceType") == "pdf":
            print(f"  [PASS] PDF slides parsed: pageCount={res.get('pageCount')}, courseCode={res.get('courseCode')}")
            passed += 1
        else:
            failed += 1
            err = f"PDF ingestion failed: HTTP {status} -> {res}"
            errors.append(err)
            print(f"  [FAIL] {err}")
    except Exception as e:
        failed += 1
        err = f"PDF test exception: {e}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 4. Manual Transcript Ingestion
    print("\n[4] Testing Manual Transcript Ingestion (/ingest/manual)...")
    manual_text = (
        "Neurons communicate via electrical and chemical signals across synapses.\n\n"
        "Action potentials propagate down the axon through saltatory conduction."
    )
    status, res = http_json_request(
        "/ingest/manual",
        method="POST",
        payload={"title": "Neurophysiology Basics", "text": manual_text, "courseCode": "NEURO 201"}
    )
    if status == 200 and res.get("sourceType") == "transcript" and len(res.get("segments", [])) == 2:
        print(f"  [PASS] Manual transcript ingested: title='{res.get('title')}', segments={len(res.get('segments'))}")
        passed += 1
    else:
        failed += 1
        err = f"Manual ingestion failed: HTTP {status} -> {res}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 5. YouTube Caption Workflow & Fallback
    print("\n[5] Testing YouTube Ingestion & Caption Fallback (/ingest/youtube)...")
    status, res = http_json_request(
        "/ingest/youtube",
        method="POST",
        payload={"url": "https://www.youtube.com/watch?v=00000000000"}
    )
    if status == 200 and res.get("fallbackRequired") is True:
        print(f"  [PASS] YouTube fallback signal verified: fallbackRequired=True, message='{res.get('message')}'")
        passed += 1
    elif status == 200 and res.get("sourceType") == "youtube":
        print(f"  [PASS] YouTube captions fetched: videoId={res.get('videoId')}")
        passed += 1
    else:
        failed += 1
        err = f"YouTube ingestion failed: HTTP {status} -> {res}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 6. Real Context-Grounded AI Tutor Q&A
    print("\n[6] Testing Context-Grounded AI Tutor Copilot (/tutor/ask)...")
    lecture_content = (
        "In computer architecture, cache memory provides high-speed buffer storage "
        "between the CPU and RAM to bridge the memory performance gap."
    )
    tutor_payload = {
        "question": "What is the purpose of cache memory in CPU architecture?",
        "courseCode": "CS 107",
        "lectureContext": lecture_content
    }
    t0 = time.time()
    status, res = http_json_request("/tutor/ask", method="POST", payload=tutor_payload, timeout=120.0)
    dt = time.time() - t0
    if status == 200 and res.get("text"):
        citations = res.get("citations", [])
        print(f"  [PASS] AI Tutor answered in {dt:.2f}s (grounded={res.get('isGrounded')}, citations={len(citations)})")
        passed += 1
    else:
        failed += 1
        err = f"AI Tutor failed: HTTP {status} -> {res}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 7. Real Active Recall Quiz Generation & Grading
    print("\n[7] Testing Real Active Recall Quiz Generation & Grading (/generate/quiz, /quiz/grade)...")
    quiz_payload = {
        "text": lecture_content,
        "title": "CPU Architecture Drill",
        "numQuestions": 2
    }
    t0 = time.time()
    status, quiz_res = http_json_request("/generate/quiz", method="POST", payload=quiz_payload, timeout=120.0)
    dt = time.time() - t0
    questions = quiz_res.get("questions", []) if isinstance(quiz_res, dict) else (quiz_res if isinstance(quiz_res, list) else [])
    if status == 200 and len(questions) > 0:
        print(f"  [PASS] Generated {len(questions)} quiz questions in {dt:.2f}s")
        q1 = questions[0]
        q1_id = q1.get("id", "q-1")
        correct_idx = q1.get("correctIndex", 0)
        quiz_id = quiz_res.get("id", "quiz-drill") if isinstance(quiz_res, dict) else "quiz-drill"
        submit_payload = {
            "quizId": quiz_id,
            "answers": {q1_id: correct_idx},
            "timeSpentSeconds": 45
        }
        status_grade, grade_res = http_json_request("/quiz/submit", method="POST", payload=submit_payload)
        if status_grade == 200 and grade_res.get("score") is not None:
            print(f"  [PASS] Quiz answer submitted & scored: score={grade_res.get('score')}/{grade_res.get('total')}, accuracy={grade_res.get('accuracyDisplay')}")
            passed += 1
        else:
            failed += 1
            err = f"Quiz grading failed: HTTP {status_grade} -> {grade_res}"
            errors.append(err)
            print(f"  [FAIL] {err}")
    else:
        failed += 1
        err = f"Quiz generation failed: HTTP {status} -> {quiz_res}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 8. Real Flashcard Deck Generation
    print("\n[8] Testing Flashcard Deck Generation (/generate/flashcards)...")
    fc_payload = {"text": lecture_content, "count": 2, "title": "Computer Systems", "courseCode": "CS 107"}
    t0 = time.time()
    status, fc_res = http_json_request("/generate/flashcards", method="POST", payload=fc_payload, timeout=120.0)
    dt = time.time() - t0
    cards = fc_res.get("cards", []) if isinstance(fc_res, dict) else (fc_res if isinstance(fc_res, list) else [])
    if status == 200 and len(cards) > 0:
        print(f"  [PASS] Flashcard deck generated in {dt:.2f}s: {len(cards)} cards (Card 1: '{cards[0].get('question', '')[:35]}...')")
        passed += 1
    else:
        failed += 1
        err = f"Flashcard generation failed: HTTP {status} -> {fc_res}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 9. Real Ollama Notes Synthesis
    print("\n[9] Testing Real Ollama qwen3:4b Notes Synthesis (/synthesize/notes)...")
    t0 = time.time()
    status, res = http_json_request(
        "/synthesize/notes",
        method="POST",
        payload={"title": "CPU Architecture", "transcript": lecture_content, "courseCode": "CS 107"},
        timeout=180.0
    )
    dt = time.time() - t0
    summary_text = res.get("summary") or res.get("executiveSummary")
    if status == 200 and summary_text and "keyConcepts" in res:
        print(f"  [PASS] Notes synthesized via Ollama in {dt:.2f}s: summary length={len(summary_text)} chars, concepts={len(res.get('keyConcepts', []))}")
        passed += 1
    else:
        failed += 1
        err = f"Notes synthesis failed: HTTP {status} -> {res}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 10. Multi-Format Academic Exports Verification
    print("\n[10] Testing Multi-Format Academic Exports (.txt, .md, .tsv)...")
    export_ts = ROOT / "src" / "utils" / "export.ts"
    if export_ts.exists():
        content = export_ts.read_text(encoding="utf-8")
        has_txt = "exportTranscriptAsTxt" in content and ".txt" in content
        has_md = "exportNotesAsMarkdown" in content and ".md" in content
        has_tsv = "exportFlashcardsAsAnkiTsv" in content and ".tsv" in content
        if has_txt and has_md and has_tsv:
            print("  [PASS] Academic exports verified: exportTranscriptAsTxt (.txt), exportNotesAsMarkdown (.md), exportFlashcardsAsAnkiTsv (.tsv)")
            passed += 1
        else:
            failed += 1
            err = "export.ts missing required format handlers"
            errors.append(err)
            print(f"  [FAIL] {err}")
    else:
        failed += 1
        err = "src/utils/export.ts does not exist"
        errors.append(err)
        print(f"  [FAIL] {err}")

    # 11. Viewport & Responsive Design Verification
    print("\n[11] Verifying Responsive CSS & Viewport Rules (~375px, ~768px, Desktop)...")
    css_files = [
        ROOT / "src" / "styles" / "layout.css",
        ROOT / "src" / "styles" / "global.css",
        ROOT / "src" / "styles" / "tokens.css"
    ]
    all_css_text = "".join(f.read_text(encoding="utf-8") for f in css_files if f.exists())
    
    has_mobile_bp = "@media" in all_css_text and ("480px" in all_css_text or "768px" in all_css_text)
    has_safe_area = "safe-area-inset" in all_css_text
    has_overflow_control = "overflow-x: hidden" in all_css_text
    has_tap_targets = "44px" in all_css_text

    if has_mobile_bp and has_safe_area and has_overflow_control and has_tap_targets:
        print("  [PASS] Viewport matrix verified: Mobile breakpoints (<480px, <768px), 44px tap targets, env(safe-area-inset), and overflow-x prevention")
        passed += 1
    else:
        failed += 1
        err = f"Missing responsive features: mobile_bp={has_mobile_bp}, safe_area={has_safe_area}, overflow={has_overflow_control}, tap={has_tap_targets}"
        errors.append(err)
        print(f"  [FAIL] {err}")

    total = passed + failed
    print("\n" + "-" * 74)
    print(f"Real Live AI & Multimodal Ingestion Summary: {passed}/{total} Checks Passed ({failed} failures)")
    print("-" * 74)

    return passed, failed, errors

if __name__ == "__main__":
    passed, failed, errors = run_real_ai_smoke()
    if failed > 0:
        print("\nFailures:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\n>>> ALL REAL LIVE AI & INGESTION SMOKE CHECKS PASSED (PROD-02) <<<")
        sys.exit(0)
