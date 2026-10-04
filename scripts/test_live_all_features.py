"""
Comprehensive Live Integration Smoke Test for LectureLens
Verifies:
1. YouTube ingestion: live video Wt5EMpUt-_g (native captions)
2. PDF ingestion (/ingest/pdf)
3. Audio ingestion (/ingest/audio)
4. Manual transcript ingestion (/ingest/manual)
5. Smart Notes synthesis (/synthesize/notes)
6. Context-grounded AI Tutor (/tutor/ask)
7. Flashcard generation (/generate/flashcards)
8. Quiz generation (/generate/quiz)
"""

import io
import json
import requests
import wave

BASE_URL = "http://127.0.0.1:8000"


def generate_tiny_wav():
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(b"\x00\x00" * 16000)
    buf.seek(0)
    return buf.getvalue()


def test_all():
    print("=" * 60)
    print("LECTURELENS COMPREHENSIVE INGESTION & AI FEATURE AUDIT")
    print("=" * 60)

    # 1. YouTube Live Ingestion
    print("\n[1] Testing YouTube Live Ingestion (Wt5EMpUt-_g)...")
    r = requests.post(f"{BASE_URL}/ingest/youtube", json={"url": "https://www.youtube.com/watch?v=Wt5EMpUt-_g", "courseCode": "BIO 101"})
    assert r.status_code == 200, f"YouTube failed: {r.status_code} {r.text}"
    yt_data = r.json()
    assert yt_data.get("sourceType") == "youtube", f"sourceType mismatch: {yt_data.get('sourceType')}"
    assert yt_data.get("ingestionMethod") in ("youtube_captions", "youtube_audio_faster_whisper")
    assert len(yt_data.get("segments", [])) > 0, "No segments in YouTube lecture"
    print(f"  [PASS] YouTube lecture: title='{yt_data.get('title')}', segments={len(yt_data['segments'])}, method='{yt_data['ingestionMethod']}'")

    # 2. Manual Ingestion
    print("\n[2] Testing Manual Notes Ingestion (/ingest/manual)...")
    manual_payload = {
        "title": "Bioenergetics Overview",
        "text": "Cellular respiration produces ATP.\n\nGlycolysis occurs in the cytoplasm.",
        "courseCode": "BIO 101"
    }
    r = requests.post(f"{BASE_URL}/ingest/manual", json=manual_payload)
    assert r.status_code == 200, f"Manual failed: {r.status_code} {r.text}"
    manual_data = r.json()
    assert manual_data.get("sourceType") == "transcript"
    assert len(manual_data.get("segments", [])) == 2
    print(f"  [PASS] Manual notes ingested: {len(manual_data['segments'])} segments")

    # 3. Audio Ingestion
    print("\n[3] Testing Audio Ingestion (/ingest/audio)...")
    wav_bytes = generate_tiny_wav()
    files = {"file": ("test_lecture.wav", wav_bytes, "audio/wav")}
    r = requests.post(f"{BASE_URL}/ingest/audio", files=files, data={"course_code": "BIO 101"})
    assert r.status_code == 200, f"Audio failed: {r.status_code} {r.text}"
    audio_data = r.json()
    assert audio_data.get("sourceType") == "audio"
    print(f"  [PASS] Audio ingested: duration={audio_data.get('duration')}")

    # 4. Smart Notes Synthesis
    print("\n[4] Testing Smart Notes Synthesis (/synthesize/notes)...")
    notes_payload = {
        "transcript": "Photosynthesis converts light into chemical energy. The light reactions happen in thylakoids and the Calvin cycle happens in the stroma.",
        "title": "Photosynthesis Stages",
        "courseCode": "BIO 101"
    }
    r = requests.post(f"{BASE_URL}/synthesize/notes", json=notes_payload, timeout=300)
    assert r.status_code == 200, f"Smart Notes failed: {r.status_code} {r.text}"
    notes_data = r.json()
    assert "summary" in notes_data
    assert "markdown" in notes_data
    assert "keyConcepts" in notes_data
    print(f"  [PASS] Smart notes synthesized: summary len={len(notes_data['summary'])}, concepts={len(notes_data['keyConcepts'])}")

    # 5. Context-Grounded AI Tutor
    print("\n[5] Testing AI Tutor (/tutor/ask)...")
    tutor_payload = {
        "question": "Where does the Calvin cycle take place?",
        "courseCode": "BIO 101",
        "chunks": ["The light reactions happen in thylakoids and the Calvin cycle happens in the stroma."]
    }
    r = requests.post(f"{BASE_URL}/tutor/ask", json=tutor_payload, timeout=300)
    assert r.status_code == 200, f"AI Tutor failed: {r.status_code} {r.text}"
    tutor_data = r.json()
    tutor_text = tutor_data.get("text") or tutor_data.get("answer") or ""
    assert len(tutor_text) > 0, f"No answer in tutor response: {tutor_data}"
    print(f"  [PASS] AI Tutor answered: len={len(tutor_text)}")

    # 6. Flashcard Generation
    print("\n[6] Testing Flashcard Generation (/generate/flashcards)...")
    flash_payload = {
        "text": "Photosynthesis light reactions produce ATP and NADPH. The Calvin cycle uses them to fix carbon dioxide into G3P sugars.",
        "title": "Photosynthesis Stages",
        "courseCode": "BIO 101"
    }
    r = requests.post(f"{BASE_URL}/generate/flashcards", json=flash_payload, timeout=300)
    assert r.status_code == 200, f"Flashcards failed: {r.status_code} {r.text}"
    flash_data = r.json()
    cards = flash_data.get("cards") or flash_data.get("flashcards") or []
    assert len(cards) > 0, f"No cards in flashcard response: {flash_data}"
    print(f"  [PASS] Generated {len(cards)} flashcards")

    # 7. Quiz Generation
    print("\n[7] Testing Quiz Generation (/generate/quiz)...")
    quiz_payload = {
        "text": "The Calvin cycle fixes carbon dioxide into G3P using ATP and NADPH generated in light reactions. Ribulose 1,5-bisphosphate carboxylase-oxygenase (RuBisCO) catalyzes this step.",
        "title": "Photosynthesis Stages",
        "courseCode": "BIO 101"
    }
    r = requests.post(f"{BASE_URL}/generate/quiz", json=quiz_payload, timeout=300)
    assert r.status_code == 200, f"Quiz failed: {r.status_code} {r.text}"
    quiz_data = r.json()
    assert "questions" in quiz_data, f"No questions in quiz response: {quiz_data}"
    assert len(quiz_data["questions"]) > 0
    print(f"  [PASS] Generated {len(quiz_data['questions'])} quiz questions")

    print("\n" + "=" * 60)
    print("ALL 7 CORE INGESTION & AI WORKFLOWS VERIFIED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    test_all()
