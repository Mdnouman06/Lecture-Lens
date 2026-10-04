"""
Unit and regression tests for Quiz Option Shuffling, Option Prefix Cleaning,
Answer Distribution, and Synchronized Scoring.
"""

import unittest
from unittest.mock import patch, MagicMock
from backend.services.ollama import (
    clean_option_text,
    parse_correct_index,
    shuffle_question_options,
    balance_quiz_options,
    generate_lecture_quiz,
    OllamaClient,
)
from backend.main import app
from fastapi.testclient import TestClient


class TestQuizShufflingAndScoring(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_clean_option_text_strips_prefixes(self):
        """Verify that letter prefixes and bullet points are stripped without altering scientific terms."""
        cases = [
            ("A) Dapsone", "Dapsone"),
            ("B. Rifampin", "Rifampin"),
            ("(C) Clofazimine", "Clofazimine"),
            ("D: Thalidomide", "Thalidomide"),
            ("A - Ethionamide", "Ethionamide"),
            ("- Dapsone 100mg", "Dapsone 100mg"),
            ("• Rifampin 600mg", "Rifampin 600mg"),
            ("C-fiber conduction velocity", "C-fiber conduction velocity"),
            ("ATP synthase activation", "ATP synthase activation"),
            ("B cells produce antibodies", "B cells produce antibodies"),
            ("T-cell mediated immunity", "T-cell mediated immunity"),
            ("A positive tuberculin skin test", "A positive tuberculin skin test"),
        ]
        for raw, expected in cases:
            self.assertEqual(clean_option_text(raw), expected)

    def test_parse_correct_index_formats(self):
        """Verify that correctIndex is parsed accurately from integers, string numbers, string letters, and option text."""
        options = ["Dapsone", "Rifampin", "Clofazimine", "Thalidomide"]

        # Integer indices
        self.assertEqual(parse_correct_index(0, options), 0)
        self.assertEqual(parse_correct_index(2, options), 2)

        # String numeric indices
        self.assertEqual(parse_correct_index("1", options), 1)
        self.assertEqual(parse_correct_index("3", options), 3)

        # String letter indices
        self.assertEqual(parse_correct_index("A", options), 0)
        self.assertEqual(parse_correct_index("b", options), 1)
        self.assertEqual(parse_correct_index("C", options), 2)
        self.assertEqual(parse_correct_index("d", options), 3)

        # Match text directly
        self.assertEqual(parse_correct_index("Rifampin", options), 1)
        self.assertEqual(parse_correct_index("B. Rifampin", options), 1)

        # Out-of-bounds fallback
        self.assertEqual(parse_correct_index(99, options), 0)
        self.assertEqual(parse_correct_index("Z", options), 0)
        self.assertEqual(parse_correct_index(None, options), 0)

    def test_shuffle_question_options_preserves_correctness(self):
        """Verify that shuffling moves the correct option to target position and keeps index synchronized."""
        original_options = ["A) Alpha", "B) Beta", "C) Gamma", "D) Delta"]
        correct_idx = 1  # Beta is correct

        for target in [0, 1, 2, 3]:
            shuffled_opts, new_idx = shuffle_question_options(
                original_options,
                correct_idx,
                target_idx=target,
            )
            # Exactly 4 options
            self.assertEqual(len(shuffled_opts), 4)
            # Cleaned options
            self.assertEqual(shuffled_opts[new_idx], "Beta")
            self.assertEqual(new_idx, target)
            # All 4 options present
            self.assertCountEqual(shuffled_opts, ["Alpha", "Beta", "Gamma", "Delta"])

    def test_balance_quiz_options_distribution(self):
        """Verify that 5-question quizzes avoid fixed A-only patterns and distribute naturally."""
        # Create an all-A biased quiz (the bug scenario)
        biased_questions = [
            {
                "id": f"q-{i}",
                "problemStatement": f"Test question {i}?",
                "options": [
                    f"A) Correct Answer {i}",
                    f"B) Wrong 1-{i}",
                    f"C) Wrong 2-{i}",
                    f"D) Wrong 3-{i}",
                ],
                "correctIndex": 0,
                "explanation": f"Option A is correct because of rule {i}.",
            }
            for i in range(5)
        ]

        all_a_occurred = False
        sample_distributions = []

        for _ in range(50):
            balanced = balance_quiz_options(biased_questions)
            indices = [q["correctIndex"] for q in balanced]
            sample_distributions.append(indices)

            # Invariant: Each question must have exactly 4 options
            for i, q in enumerate(balanced):
                self.assertEqual(len(q["options"]), 4)
                # The correct text must be at q["correctIndex"]
                self.assertEqual(q["options"][q["correctIndex"]], f"Correct Answer {i}")
                # Explanation letter must match new index
                letters = ["A", "B", "C", "D"]
                expected_letter = letters[q["correctIndex"]]
                self.assertIn(f"Option {expected_letter}", q["explanation"])

            # Check that it never produces all A's (all index 0)
            if indices == [0, 0, 0, 0, 0]:
                all_a_occurred = True

        self.assertFalse(all_a_occurred, "balance_quiz_options generated an all-A pattern!")

        # Verify that across the 50 runs, indices 0, 1, 2, 3 are all utilized
        flattened_indices = [idx for dist in sample_distributions for idx in dist]
        unique_indices = set(flattened_indices)
        self.assertEqual(unique_indices, {0, 1, 2, 3})

    def test_quiz_scoring_with_shuffled_options(self):
        """
        Verify that scoring uses the actual stored correct index after shuffling:
        - selecting the correct option yields full credit
        - selecting any distractor yields zero credit
        """
        # Controlled quiz where correct answers are distributed: Q0->B(1), Q1->D(3), Q2->A(0), Q3->C(2), Q4->B(1)
        shuffled_correct_answers = {"0": 1, "1": 3, "2": 0, "3": 2, "4": 1}

        # 1. Full credit test (all correct)
        resp_full = self.client.post(
            "/quiz/submit",
            json={
                "quizId": "quiz-test-perfect",
                "answers": {"0": 1, "1": 3, "2": 0, "3": 2, "4": 1},
                "correctAnswers": shuffled_correct_answers,
                "timeSpentSeconds": 120,
            },
        )
        self.assertEqual(resp_full.status_code, 200)
        data_full = resp_full.json()
        self.assertEqual(data_full["score"], 5)
        self.assertEqual(data_full["percentage"], 100)
        for q_idx in range(5):
            self.assertTrue(data_full["answers"][str(q_idx)]["isCorrect"])

        # 2. Zero credit test (all wrong)
        resp_zero = self.client.post(
            "/quiz/submit",
            json={
                "quizId": "quiz-test-zero",
                # Pick wrong index for each: (1->0, 3->1, 0->2, 2->3, 1->0)
                "answers": {"0": 0, "1": 1, "2": 2, "3": 3, "4": 0},
                "correctAnswers": shuffled_correct_answers,
                "timeSpentSeconds": 120,
            },
        )
        self.assertEqual(resp_zero.status_code, 200)
        data_zero = resp_zero.json()
        self.assertEqual(data_zero["score"], 0)
        self.assertEqual(data_zero["percentage"], 0)
        for q_idx in range(5):
            self.assertFalse(data_zero["answers"][str(q_idx)]["isCorrect"])

        # 3. Partial credit test (3 of 5 correct)
        resp_partial = self.client.post(
            "/quiz/submit",
            json={
                "quizId": "quiz-test-partial",
                "answers": {"0": 1, "1": 3, "2": 0, "3": 0, "4": 0},  # Q3 and Q4 are wrong
                "correctAnswers": shuffled_correct_answers,
                "timeSpentSeconds": 120,
            },
        )
        self.assertEqual(resp_partial.status_code, 200)
        data_partial = resp_partial.json()
        self.assertEqual(data_partial["score"], 3)
        self.assertEqual(data_partial["percentage"], 60)
        self.assertTrue(data_partial["answers"]["0"]["isCorrect"])
        self.assertTrue(data_partial["answers"]["1"]["isCorrect"])
        self.assertTrue(data_partial["answers"]["2"]["isCorrect"])
        self.assertFalse(data_partial["answers"]["3"]["isCorrect"])
        self.assertFalse(data_partial["answers"]["3"]["isCorrect"])
        self.assertFalse(data_partial["answers"]["4"]["isCorrect"])

    def test_direct_option_movement_to_each_position_abcd(self):
        """
        Directly verify requirement 13:
        - A question with a known correct answer can be moved to A (0)
        - Can be moved to B (1)
        - Can be moved to C (2)
        - Can be moved to D (3)
        - correctIndex always matches the actual correct option in options array
        - Scoring is strictly preserved:
          * Selecting the moved correctIndex yields isCorrect=True (score=1)
          * Selecting any other option yields isCorrect=False (score=0)
        """
        known_correct_text = "Target Correct Answer - Mitochondria"
        original_options = [
            known_correct_text,
            "Wrong Distractor 1 - Ribosome",
            "Wrong Distractor 2 - Endoplasmic Reticulum",
            "Wrong Distractor 3 - Golgi Apparatus",
        ]
        letters = ["A", "B", "C", "D"]

        for target_pos, letter in enumerate(letters):
            shuffled_opts, new_idx = shuffle_question_options(
                original_options,
                correct_idx=0,
                target_idx=target_pos,
            )
            # Verified moved to exact expected position
            self.assertEqual(
                new_idx,
                target_pos,
                f"Failed to move correct answer to {letter} (target index {target_pos})",
            )
            # Verified correctIndex matches the exact text in options array
            self.assertEqual(shuffled_opts[new_idx], known_correct_text)
            self.assertEqual(shuffled_opts[target_pos], known_correct_text)
            # Exactly 4 options and all distractors preserved
            self.assertEqual(len(shuffled_opts), 4)

            # Verified scoring: Selecting target_pos gives 100% credit
            resp_correct = self.client.post(
                "/quiz/submit",
                json={
                    "quizId": f"test-deterministic-{letter}",
                    "answers": {"0": target_pos},
                    "correctAnswers": {"0": new_idx},
                },
            )
            self.assertEqual(resp_correct.status_code, 200)
            data_correct = resp_correct.json()
            self.assertTrue(data_correct["answers"]["0"]["isCorrect"])
            self.assertEqual(data_correct["score"], 1)

            # Verified scoring: Selecting any other position gives zero credit
            wrong_pos = (target_pos + 1) % 4
            resp_wrong = self.client.post(
                "/quiz/submit",
                json={
                    "quizId": f"test-deterministic-{letter}-wrong",
                    "answers": {"0": wrong_pos},
                    "correctAnswers": {"0": new_idx},
                },
            )
            self.assertEqual(resp_wrong.status_code, 200)
            data_wrong = resp_wrong.json()
            self.assertFalse(data_wrong["answers"]["0"]["isCorrect"])
            self.assertEqual(data_wrong["score"], 0)


if __name__ == "__main__":
    unittest.main()

