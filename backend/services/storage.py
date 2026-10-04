"""
Persistent SQLite Database Storage for LectureLens.
Provides durable, lecture-grounded persistence for:
1. Flashcard Decks & FSRS Spaced-Repetition Review States.
2. Multiple-Choice Exam Quizzes (preserving randomized option order & correctIndex).
3. Quiz Completion Results & Accuracy Telemetry.
"""

import os
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DB_DIR / "lecturelens.db"


@contextmanager
def _get_connection():
    """Return a thread-safe connection with dictionary-like row factory and auto-close."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=10.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db() -> None:
    """Initialize database tables with indexes for lecture-associated persistence."""
    with _get_connection() as conn:
        cursor = conn.cursor()

        # 1. Flashcards Table: one active, canonical deck per lecture_id
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS lecture_flashcards (
                lecture_id TEXT PRIMARY KEY,
                cards_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )

        # 2. Quizzes Table: one active, canonical quiz per lecture_id
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS lecture_quizzes (
                lecture_id TEXT PRIMARY KEY,
                quiz_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )

        # 3. Quiz Submissions Table: historical submission attempts per lecture & quiz
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS quiz_submissions (
                id TEXT PRIMARY KEY,
                lecture_id TEXT NOT NULL,
                quiz_id TEXT NOT NULL,
                score INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                answers_json TEXT NOT NULL,
                time_spent_seconds INTEGER NOT NULL DEFAULT 0,
                completed_at TEXT NOT NULL
            );
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_submissions_lecture_id
            ON quiz_submissions (lecture_id);
            """
        )

        # 4. Lecture Notes Table: durable, synthesized study notes per lecture_id
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS lecture_notes (
                lecture_id TEXT PRIMARY KEY,
                notes_json TEXT NOT NULL,
                margin_notes TEXT DEFAULT '',
                highlights_json TEXT DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )

        # 5. Lecture Transcripts Table: durable timestamped segments per lecture_id
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS lecture_transcripts (
                lecture_id TEXT PRIMARY KEY,
                segments_json TEXT NOT NULL,
                full_text TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )

        # 6. Lecture Progress Table: persistent audio scrubber position per lecture_id
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS lecture_progress (
                lecture_id TEXT PRIMARY KEY,
                progress_seconds REAL NOT NULL DEFAULT 0,
                completed INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL
            );
            """
        )

        # 7. PYQ Papers Table: durable previous year exam papers & questions
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS pyq_papers (
                id TEXT PRIMARY KEY,
                course_code TEXT NOT NULL,
                paper_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_pyq_papers_course
            ON pyq_papers (course_code);
            """
        )
        conn.commit()


# Initialize database upon module import
init_db()


# ==============================================================================
# Flashcard Persistence
# ==============================================================================

def save_lecture_flashcards(lecture_id: str, cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Persist generated or updated flashcards for a specific lecture.
    Replaces the active deck cleanly, preventing uncontrolled duplicates.
    Preserves all card metadata, academic citations, and FSRS review telemetry.
    """
    if not lecture_id or not str(lecture_id).strip():
        raise ValueError("lecture_id is required to save flashcards.")

    now_iso = datetime.now(timezone.utc).isoformat()

    # Ensure all cards have lectureId set properly
    normalized_cards = []
    for i, card in enumerate(cards):
        c = dict(card)
        c["lectureId"] = lecture_id
        if not c.get("id"):
            c["id"] = f"fc-{lecture_id}-{i + 1}"
        # Ensure reviewed and reps flags are explicitly preserved
        is_reviewed = bool(c.get("reviewed") or c.get("lastReviewed") or c.get("rating") or (c.get("reps", 0) > 0))
        c["reviewed"] = is_reviewed
        c["reps"] = int(c.get("reps") or (1 if is_reviewed else 0))
        if "mastered" not in c:
            c["mastered"] = False
        if not c.get("difficulty"):
            c["difficulty"] = c.get("rating") or ("good" if is_reviewed else "new")
        if not c.get("intervalDisplay"):
            c["intervalDisplay"] = "1.0d"
        normalized_cards.append(c)

    cards_json = json.dumps(normalized_cards)

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO lecture_flashcards (lecture_id, cards_json, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(lecture_id) DO UPDATE SET
                cards_json = excluded.cards_json,
                updated_at = excluded.updated_at;
            """,
            (str(lecture_id), cards_json, now_iso, now_iso),
        )
        conn.commit()

    return normalized_cards


def get_lecture_flashcards(lecture_id: str) -> List[Dict[str, Any]]:
    """Retrieve the saved flashcard deck for a specific lecture, or empty list if none."""
    if not lecture_id:
        return []

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT cards_json FROM lecture_flashcards WHERE lecture_id = ?",
            (str(lecture_id),),
        )
        row = cursor.fetchone()
        if row and row["cards_json"]:
            try:
                return json.loads(row["cards_json"])
            except Exception:
                return []
    return []


def update_flashcard_fsrs_review(
    lecture_id: str,
    card_id: str,
    rating: str,
    mastered: Optional[bool] = None,
    difficulty: Optional[Any] = None,
    stability: Optional[float] = None,
    reviewed: Optional[bool] = None,
    last_reviewed: Optional[str] = None,
    reps: Optional[int] = None,
) -> bool:
    """
    Update FSRS spaced repetition review telemetry for a single card in the lecture's deck.
    Preserves the review state across browser refreshes and lecture reopenings.
    """
    cards = get_lecture_flashcards(lecture_id)
    if not cards:
        return False

    now_iso = datetime.now(timezone.utc).isoformat()
    updated = False
    for card in cards:
        if card.get("id") == card_id:
            card["reviewed"] = True
            card["rating"] = rating
            card["difficulty"] = rating
            card["lastReviewed"] = last_reviewed or now_iso
            card["reps"] = reps if reps is not None else (int(card.get("reps") or 0) + 1)

            if mastered is not None:
                card["mastered"] = bool(mastered)
            else:
                card["mastered"] = rating in ("good", "easy")

            if stability is not None:
                card["stability"] = float(stability)
            else:
                card["stability"] = 3.0 if rating == "easy" else (1.5 if rating == "good" else 0.5)

            card["intervalDisplay"] = f"{card['stability']:.1f}d"
            updated = True
            break

    if updated:
        save_lecture_flashcards(lecture_id, cards)
        return True

    return False


# ==============================================================================
# Quiz Persistence
# ==============================================================================

def save_lecture_quiz(lecture_id: str, quiz_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persist the active generated quiz for a lecture.
    Strictly preserves the exact options array order and correctIndex.
    Replaces any previous active quiz cleanly without orphaned duplicates.
    """
    if not lecture_id or not str(lecture_id).strip():
        raise ValueError("lecture_id is required to save quiz.")

    now_iso = datetime.now(timezone.utc).isoformat()

    quiz_to_store = dict(quiz_payload)
    quiz_to_store["lectureId"] = str(lecture_id)
    if not quiz_to_store.get("id"):
        quiz_to_store["id"] = f"quiz-{lecture_id}"

    # Ensure questions list is valid and strictly retains ordering and options
    raw_questions = quiz_to_store.get("questions", [])
    normalized_questions = []
    for i, q in enumerate(raw_questions):
        norm_q = dict(q)
        if not norm_q.get("id"):
            norm_q["id"] = f"q-{i + 1}"
        # Ensure options list is cloned without reordering
        norm_q["options"] = list(norm_q.get("options", []))
        norm_q["correctIndex"] = int(norm_q.get("correctIndex", 0))
        normalized_questions.append(norm_q)

    quiz_to_store["questions"] = normalized_questions
    quiz_to_store["updatedAt"] = now_iso
    quiz_json = json.dumps(quiz_to_store)

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO lecture_quizzes (lecture_id, quiz_json, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(lecture_id) DO UPDATE SET
                quiz_json = excluded.quiz_json,
                updated_at = excluded.updated_at;
            """,
            (str(lecture_id), quiz_json, now_iso, now_iso),
        )
        conn.commit()

    return quiz_to_store


def get_lecture_quiz(lecture_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve the saved active quiz for a specific lecture, or None if none has been generated."""
    if not lecture_id:
        return None

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT quiz_json FROM lecture_quizzes WHERE lecture_id = ?",
            (str(lecture_id),),
        )
        row = cursor.fetchone()
        if row and row["quiz_json"]:
            try:
                return json.loads(row["quiz_json"])
            except Exception:
                return None
    return None


# ==============================================================================
# Quiz Submissions & Results Persistence
# ==============================================================================

def save_quiz_submission(
    lecture_id: str,
    quiz_id: str,
    score: int,
    total_questions: int,
    answers: Dict[str, Any],
    time_spent_seconds: int = 0,
    submission_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Persist completed quiz results and answers telemetry."""
    sub_id = submission_id or f"sub-{lecture_id}-{int(datetime.now().timestamp() * 1000)}"
    now_iso = datetime.now(timezone.utc).isoformat()
    answers_json = json.dumps(answers)

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO quiz_submissions (
                id, lecture_id, quiz_id, score, total_questions, answers_json, time_spent_seconds, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (
                sub_id,
                str(lecture_id),
                str(quiz_id),
                int(score),
                int(total_questions),
                answers_json,
                int(time_spent_seconds),
                now_iso,
            ),
        )
        conn.commit()

    percentage = round((score / max(total_questions, 1)) * 100)
    return {
        "id": sub_id,
        "lectureId": str(lecture_id),
        "quizId": str(quiz_id),
        "score": score,
        "totalQuestions": total_questions,
        "percentage": percentage,
        "answers": answers,
        "timeSpentSeconds": time_spent_seconds,
        "completedAt": now_iso,
    }


def get_quiz_submissions(lecture_id: str) -> List[Dict[str, Any]]:
    """Retrieve all completed quiz submissions for a lecture, newest first."""
    if not lecture_id:
        return []

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, lecture_id, quiz_id, score, total_questions, answers_json, time_spent_seconds, completed_at
            FROM quiz_submissions
            WHERE lecture_id = ?
            ORDER BY completed_at DESC;
            """,
            (str(lecture_id),),
        )
        rows = cursor.fetchall()
        results = []
        for r in rows:
            try:
                answers = json.loads(r["answers_json"])
            except Exception:
                answers = {}
            score = int(r["score"])
            total = int(r["total_questions"])
            results.append({
                "id": r["id"],
                "lectureId": r["lecture_id"],
                "quizId": r["quiz_id"],
                "score": score,
                "totalQuestions": total,
                "percentage": round((score / max(total, 1)) * 100),
                "answers": answers,
                "timeSpentSeconds": r["time_spent_seconds"],
                "completedAt": r["completed_at"],
            })
        return results


def get_latest_quiz_result(lecture_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve the most recent completed quiz result for a lecture."""
    subs = get_quiz_submissions(lecture_id)
    return subs[0] if subs else None


# ==============================================================================
# Lecture Notes Persistence (Durable 3-Tier Support)
# ==============================================================================

def save_lecture_notes(
    lecture_id: str,
    notes: Dict[str, Any],
    margin_notes: str = "",
    highlights: Optional[List[Any]] = None,
) -> Dict[str, Any]:
    """Persist synthesized or user-edited lecture study notes cleanly."""
    if not lecture_id:
        return {}

    now_iso = datetime.now(timezone.utc).isoformat()
    notes_json = json.dumps(notes, ensure_ascii=False)
    highlights_json = json.dumps(highlights or [], ensure_ascii=False)

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO lecture_notes (lecture_id, notes_json, margin_notes, highlights_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(lecture_id) DO UPDATE SET
                notes_json = excluded.notes_json,
                margin_notes = excluded.margin_notes,
                highlights_json = excluded.highlights_json,
                updated_at = excluded.updated_at;
            """,
            (str(lecture_id), notes_json, margin_notes or "", highlights_json, now_iso, now_iso),
        )
        conn.commit()

    return {
        "lectureId": str(lecture_id),
        "notes": notes,
        "marginNotes": margin_notes,
        "highlights": highlights or [],
        "updatedAt": now_iso,
    }


def get_lecture_notes(lecture_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve persisted study notes for a specific lecture."""
    if not lecture_id:
        return None

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT notes_json, margin_notes, highlights_json, updated_at FROM lecture_notes WHERE lecture_id = ?",
            (str(lecture_id),),
        )
        row = cursor.fetchone()
        if not row:
            return None

        try:
            notes = json.loads(row["notes_json"])
        except Exception:
            notes = {}

        try:
            highlights = json.loads(row["highlights_json"])
        except Exception:
            highlights = []

        return {
            "lectureId": str(lecture_id),
            "notes": notes,
            "marginNotes": row["margin_notes"] or "",
            "highlights": highlights,
            "updatedAt": row["updated_at"],
        }


# ==============================================================================
# Lecture Transcripts Persistence
# ==============================================================================

def save_lecture_transcripts(
    lecture_id: str,
    segments: List[Dict[str, Any]],
    full_text: str = "",
) -> List[Dict[str, Any]]:
    """Persist timestamped transcript segments for a lecture."""
    if not lecture_id:
        return []

    now_iso = datetime.now(timezone.utc).isoformat()
    segments_json = json.dumps(segments, ensure_ascii=False)

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO lecture_transcripts (lecture_id, segments_json, full_text, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(lecture_id) DO UPDATE SET
                segments_json = excluded.segments_json,
                full_text = excluded.full_text,
                updated_at = excluded.updated_at;
            """,
            (str(lecture_id), segments_json, full_text or "", now_iso, now_iso),
        )
        conn.commit()

    return segments


def get_lecture_transcripts(lecture_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve persisted transcript segments and full text for a lecture."""
    if not lecture_id:
        return None

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT segments_json, full_text, updated_at FROM lecture_transcripts WHERE lecture_id = ?",
            (str(lecture_id),),
        )
        row = cursor.fetchone()
        if not row:
            return None

        try:
            segments = json.loads(row["segments_json"])
        except Exception:
            segments = []

        return {
            "lectureId": str(lecture_id),
            "segments": segments,
            "fullText": row["full_text"] or "",
            "updatedAt": row["updated_at"],
        }


# ==============================================================================
# Lecture Progress Persistence
# ==============================================================================

def save_lecture_progress(
    lecture_id: str,
    progress_seconds: float,
    completed: bool = False,
) -> Dict[str, Any]:
    """Persist audio scrubber position and completion flag."""
    if not lecture_id:
        return {}

    now_iso = datetime.now(timezone.utc).isoformat()

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO lecture_progress (lecture_id, progress_seconds, completed, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(lecture_id) DO UPDATE SET
                progress_seconds = excluded.progress_seconds,
                completed = excluded.completed,
                updated_at = excluded.updated_at;
            """,
            (str(lecture_id), float(progress_seconds), 1 if completed else 0, now_iso),
        )
        conn.commit()

    return {
        "lectureId": str(lecture_id),
        "progressSeconds": float(progress_seconds),
        "completed": bool(completed),
        "updatedAt": now_iso,
    }


def get_lecture_progress(lecture_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve persisted audio scrubber position for a lecture."""
    if not lecture_id:
        return None

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT progress_seconds, completed, updated_at FROM lecture_progress WHERE lecture_id = ?",
            (str(lecture_id),),
        )
        row = cursor.fetchone()
        if not row:
            return None

        return {
            "lectureId": str(lecture_id),
            "progressSeconds": float(row["progress_seconds"]),
            "completed": bool(row["completed"]),
            "updatedAt": row["updated_at"],
        }


# ==============================================================================
# PYQ Paper SQLite Persistence
# ==============================================================================

def save_pyq_paper(paper_dict: Dict[str, Any]) -> None:
    """Persist uploaded PYQ paper and question patterns to SQLite."""
    paper_id = paper_dict.get("id")
    if not paper_id:
        return

    course_code = paper_dict.get("courseCode", "ALL")
    paper_json = json.dumps(paper_dict, ensure_ascii=False)
    now_iso = datetime.now(timezone.utc).isoformat()

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO pyq_papers (id, course_code, paper_json, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                course_code = excluded.course_code,
                paper_json = excluded.paper_json;
            """,
            (str(paper_id), course_code, paper_json, now_iso),
        )
        conn.commit()


def get_all_pyq_papers(course_code: str = "ALL") -> List[Dict[str, Any]]:
    """Retrieve all persisted PYQ papers from SQLite."""
    with _get_connection() as conn:
        cursor = conn.cursor()
        if course_code and course_code != "ALL":
            cursor.execute(
                "SELECT paper_json FROM pyq_papers WHERE course_code = ? OR course_code = 'ALL' ORDER BY created_at DESC",
                (course_code,),
            )
        else:
            cursor.execute("SELECT paper_json FROM pyq_papers ORDER BY created_at DESC")

        rows = cursor.fetchall()
        papers = []
        for r in rows:
            try:
                p = json.loads(r["paper_json"])
                papers.append(p)
            except Exception:
                pass
        return papers


def delete_pyq_paper(paper_id: str) -> bool:
    """Delete a PYQ paper from SQLite."""
    if not paper_id:
        return False

    with _get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM pyq_papers WHERE id = ?", (str(paper_id),))
        conn.commit()
        return cursor.rowcount > 0


# ==============================================================================
# Aggregate Recall Summary for Lecture Library
# ==============================================================================

def get_recall_summary() -> Dict[str, Dict[str, Any]]:
    """
    Returns a truthful summary map of active flashcard, quiz, notes, and transcript states.
    Used by Lecture Library to display truthful badges without hardcoded demo values.
    """
    summary: Dict[str, Dict[str, Any]] = {}

    def _default():
        return {
            "flashcardCount": 0,
            "hasQuiz": False,
            "quizQuestionCount": 0,
            "hasNotes": False,
            "hasTranscript": False,
            "quizCompleted": False,
            "latestScore": None,
        }

    with _get_connection() as conn:
        cursor = conn.cursor()

        # Flashcards counts
        cursor.execute("SELECT lecture_id, cards_json FROM lecture_flashcards")
        for row in cursor.fetchall():
            lec_id = row["lecture_id"]
            try:
                cards = json.loads(row["cards_json"])
                count = len(cards) if isinstance(cards, list) else 0
            except Exception:
                count = 0
            if lec_id not in summary:
                summary[lec_id] = _default()
            summary[lec_id]["flashcardCount"] = count

        # Quiz counts
        cursor.execute("SELECT lecture_id, quiz_json FROM lecture_quizzes")
        for row in cursor.fetchall():
            lec_id = row["lecture_id"]
            if lec_id not in summary:
                summary[lec_id] = _default()
            try:
                quiz = json.loads(row["quiz_json"])
                q_list = quiz.get("questions", []) if isinstance(quiz, dict) else []
                q_count = len(q_list) if isinstance(q_list, list) else 0
            except Exception:
                q_count = 0
            summary[lec_id]["hasQuiz"] = q_count > 0
            summary[lec_id]["quizQuestionCount"] = q_count

        # Notes status
        cursor.execute("SELECT lecture_id FROM lecture_notes")
        for row in cursor.fetchall():
            lec_id = row["lecture_id"]
            if lec_id not in summary:
                summary[lec_id] = _default()
            summary[lec_id]["hasNotes"] = True

        # Transcripts status
        cursor.execute("SELECT lecture_id FROM lecture_transcripts")
        for row in cursor.fetchall():
            lec_id = row["lecture_id"]
            if lec_id not in summary:
                summary[lec_id] = _default()
            summary[lec_id]["hasTranscript"] = True

        # Quiz submissions
        cursor.execute("SELECT lecture_id, score, total_questions, completed_at FROM quiz_submissions ORDER BY completed_at DESC")
        for row in cursor.fetchall():
            lec_id = row["lecture_id"]
            if lec_id not in summary:
                summary[lec_id] = _default()
            if not summary[lec_id]["quizCompleted"]:
                summary[lec_id]["quizCompleted"] = True
                summary[lec_id]["latestScore"] = {
                    "score": row["score"],
                    "total": row["total_questions"],
                    "completedAt": row["completed_at"],
                }

    return summary
