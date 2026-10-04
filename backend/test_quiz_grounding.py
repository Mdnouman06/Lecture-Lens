"""
Unit and regression tests for Quiz Lecture-Grounding, Hallucination/Leakage Detection,
and Context-Specific Retry Logic.
"""

import json
import unittest
from unittest.mock import patch, MagicMock

from backend.services.ollama import (
    validate_quiz_grounding,
    generate_lecture_quiz,
    OllamaClient,
    OllamaOfflineError,
)
from backend.main import app
from fastapi.testclient import TestClient


class TestQuizGrounding(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_validate_quiz_grounding_clean_lecture(self):
        """Verify that questions matching lecture domain pass validation."""
        os_lecture_text = (
            "An operating system manages computer hardware and software resources. "
            "A process is a program in execution containing a program counter, stack, and data section. "
            "Context switching saves the state of the active process to PCB."
        )
        questions = [
            {
                "id": "q-1",
                "problemStatement": "What data structure maintains the state of an active process during context switching?",
                "options": ["Process Control Block (PCB)", "Page Table Entry", "Kernel Buffer Cache", "Inode Table"],
                "correctIndex": 0,
                "explanation": "The PCB stores the program counter and register state.",
            },
            {
                "id": "q-2",
                "problemStatement": "Which component of a process contains temporary data such as function parameters?",
                "options": ["Stack", "Heap", "Text section", "Data section"],
                "correctIndex": 0,
                "explanation": "The stack stores activation records and local variables.",
            },
        ]

        is_valid, leaks = validate_quiz_grounding(questions, os_lecture_text, "Operating Systems: Processes", "CS 301")
        self.assertTrue(is_valid)
        self.assertEqual(len(leaks), 0)

    def test_validate_quiz_grounding_catches_neuro_leak_on_cs_lecture(self):
        """Verify that neurobiology concepts leaking into a CS lecture are detected as leaks."""
        os_lecture_text = (
            "An operating system manages computer hardware and software resources. "
            "A process is a program in execution. Virtual memory uses page tables."
        )
        questions_with_neuro_leak = [
            {
                "id": "q-1",
                "problemStatement": "What data structure maintains the state of a process?",
                "options": ["Process Control Block", "Page Table", "Thread Buffer", "Segment Register"],
                "correctIndex": 0,
                "explanation": "The PCB stores state.",
            },
            {
                "id": "q-2",
                "problemStatement": "Which receptor requires membrane depolarization to expel magnesium ions?",
                "options": ["NMDA receptor", "AMPA receptor", "GABA-A receptor", "Kainate receptor"],
                "correctIndex": 0,
                "explanation": "The NMDA pore block is relieved by depolarization.",
            },
        ]

        is_valid, leaks = validate_quiz_grounding(questions_with_neuro_leak, os_lecture_text, "CS 101: Operating Systems", "General")
        self.assertFalse(is_valid)
        self.assertTrue(any("nmda" in l.lower() or "receptor" in l.lower() for l in leaks))

    def test_validate_quiz_grounding_catches_pharm_leak_on_general_lecture(self):
        """Verify that leprosy/pharmacology terms leaking into a literature/movie lecture are detected."""
        lost_lecture_text = (
            "Explaining Everything About Lost: Oceanic flight 815 crashed on a tropical island. "
            "Jack Shephard, Locke, and Kate explore the mysteries, including the Dharma Initiative and the Hatch."
        )
        questions_with_pharm_leak = [
            {
                "id": "q-1",
                "problemStatement": "What is the first-line bactericidal drug in WHO multidrug therapy for leprosy?",
                "options": ["Rifampin", "Dapsone", "Clofazimine", "Thalidomide"],
                "correctIndex": 0,
                "explanation": "Rifampin is bactericidal against Mycobacterium leprae.",
            },
            {
                "id": "q-2",
                "problemStatement": "Which flight crashed on the mysterious island in Lost?",
                "options": ["Oceanic 815", "Ajira 316", "Pacific 404", "Skyline 101"],
                "correctIndex": 0,
                "explanation": "Oceanic 815 crashed in 2004.",
            },
        ]

        is_valid, leaks = validate_quiz_grounding(questions_with_pharm_leak, lost_lecture_text, "Lost In 3 Minutes", "General")
        self.assertFalse(is_valid)
        self.assertTrue(any("rifampin" in l.lower() or "dapsone" in l.lower() for l in leaks))

    def test_validate_quiz_grounding_allows_neuro_terms_for_neuro_course(self):
        """Verify that neurobiology lectures legitimately pass neuro terms."""
        neuro_lecture_text = (
            "Long-Term Potentiation (LTP) in the hippocampus requires NMDA receptor activation. "
            "Magnesium ions block the channel pore at resting potential until depolarization."
        )
        neuro_questions = [
            {
                "id": "q-1",
                "problemStatement": "What relieves the magnesium block of NMDA receptors during LTP induction?",
                "options": ["Membrane depolarization", "Hyperpolarization", "Calcium efflux", "GABA binding"],
                "correctIndex": 0,
                "explanation": "Depolarization expels the Mg2+ ion from the channel pore.",
            }
        ]

        is_valid, leaks = validate_quiz_grounding(neuro_questions, neuro_lecture_text, "Synaptic Plasticity", "NEURO 301")
        self.assertTrue(is_valid)
        self.assertEqual(len(leaks), 0)

    def test_quiz_generator_retries_on_hallucination_leak(self):
        """
        Verify that generate_lecture_quiz detects leakage in the first attempt,
        applies corrective feedback in retry prompt, and succeeds with clean output.
        """
        leaking_response = json.dumps({
            "id": "quiz-leaking",
            "title": "CS 101 Quiz",
            "courseCode": "General",
            "timeLimitMinutes": 15,
            "questions": [
                {
                    "id": "q-1",
                    "problemStatement": "Which drug is used for erythema nodosum leprosum?",
                    "options": ["Thalidomide", "Aspirin", "Ibuprofen", "Penicillin"],
                    "correctIndex": 0,
                    "explanation": "Thalidomide treats ENL.",
                },
                {
                    "id": "q-2",
                    "problemStatement": "What is an Operating System process?",
                    "options": ["A program in execution", "A hardware device", "A hard drive sector", "A keyboard buffer"],
                    "correctIndex": 0,
                    "explanation": "A process is a program in execution.",
                },
                {
                    "id": "q-3",
                    "problemStatement": "What is virtual memory?",
                    "options": ["An abstraction of physical memory", "RAM chips", "Optical disc", "Network storage"],
                    "correctIndex": 0,
                    "explanation": "Virtual memory provides an address space abstraction.",
                },
                {
                    "id": "q-4",
                    "problemStatement": "What is the CPU scheduler?",
                    "options": ["Selects processes from ready queue", "Controls power supply", "Prints documents", "Formats hard disks"],
                    "correctIndex": 0,
                    "explanation": "Scheduler picks from ready queue.",
                },
                {
                    "id": "q-5",
                    "problemStatement": "What is a system call?",
                    "options": ["Interface between user space and kernel", "A telephone call", "A monitor cable", "An interrupt handler for mouse"],
                    "correctIndex": 0,
                    "explanation": "System calls request kernel services.",
                },
            ]
        })

        clean_response = json.dumps({
            "id": "quiz-clean",
            "title": "CS 101 Quiz",
            "courseCode": "General",
            "timeLimitMinutes": 15,
            "questions": [
                {
                    "id": "q-1",
                    "problemStatement": "What data structure does the OS use to track process state?",
                    "options": ["Process Control Block (PCB)", "File Allocation Table", "Memory Bus", "Device Driver"],
                    "correctIndex": 0,
                    "explanation": "PCB maintains the execution context.",
                },
                {
                    "id": "q-2",
                    "problemStatement": "What is an Operating System process?",
                    "options": ["A program in execution", "A hardware device", "A hard drive sector", "A keyboard buffer"],
                    "correctIndex": 0,
                    "explanation": "A process is a program in execution.",
                },
                {
                    "id": "q-3",
                    "problemStatement": "What is virtual memory?",
                    "options": ["An abstraction of physical memory", "RAM chips", "Optical disc", "Network storage"],
                    "correctIndex": 0,
                    "explanation": "Virtual memory provides an address space abstraction.",
                },
                {
                    "id": "q-4",
                    "problemStatement": "What is the CPU scheduler?",
                    "options": ["Selects processes from ready queue", "Controls power supply", "Prints documents", "Formats hard disks"],
                    "correctIndex": 0,
                    "explanation": "Scheduler picks from ready queue.",
                },
                {
                    "id": "q-5",
                    "problemStatement": "What is a system call?",
                    "options": ["Interface between user space and kernel", "A telephone call", "A monitor cable", "An interrupt handler for mouse"],
                    "correctIndex": 0,
                    "explanation": "System calls request kernel services.",
                },
            ]
        })

        with patch.object(OllamaClient, "is_available", return_value=True), \
             patch.object(OllamaClient, "check_model_installed", return_value=True), \
             patch.object(OllamaClient, "generate", side_effect=[leaking_response, clean_response]) as mock_gen:

            quiz = generate_lecture_quiz(
                transcript_text="An operating system manages hardware. Processes are programs in execution. Virtual memory pages memory.",
                title="OS Fundamentals",
                course_code="General",
            )

            # Assert generator was called twice (initial attempt + retry after leak detection)
            self.assertEqual(mock_gen.call_count, 2)
            retry_prompt = mock_gen.call_args[0][0]
            self.assertIn("CRITICAL CORRECTION REQUIRED", retry_prompt)

            # Assert resulting quiz has no leaked questions
            for q in quiz["questions"]:
                text_blob = (q["problemStatement"] + " " + " ".join(q["options"])).lower()
                self.assertNotIn("thalidomide", text_blob)
                self.assertNotIn("leprosy", text_blob)

    def test_course_code_bleed_sanitization_in_prompt(self):
        """
        Verify that a non-neuro lecture with default NEURO 301 course code gets sanitized
        so that NEURO 301 is not passed into the prompt constraints.
        """
        mock_response = json.dumps({
            "id": "quiz-test",
            "title": "OS Lecture",
            "courseCode": "General",
            "timeLimitMinutes": 15,
            "questions": [
                {
                    "id": f"q-{i}",
                    "problemStatement": f"Question {i} about operating systems?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctIndex": 0,
                    "explanation": "Explanation.",
                }
                for i in range(5)
            ]
        })

        with patch.object(OllamaClient, "is_available", return_value=True), \
             patch.object(OllamaClient, "check_model_installed", return_value=True), \
             patch.object(OllamaClient, "generate", return_value=mock_response) as mock_gen:

            quiz = generate_lecture_quiz(
                transcript_text="Operating systems scheduling algorithms and virtual memory allocation.",
                title="Operating Systems 101",
                course_code="NEURO 301",  # Bleed artifact
            )

            prompt_sent = mock_gen.call_args[0][0]
            # Ensure "Course: NEURO 301" was NOT passed
            self.assertNotIn("Course: NEURO 301", prompt_sent)
            self.assertIn("Course: General", prompt_sent)


if __name__ == "__main__":
    unittest.main()
