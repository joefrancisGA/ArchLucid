"""Chapter 13: content-free audit records, cache keys, and token budgets."""

from __future__ import annotations

import unittest

import support  # noqa: F401
from ch13_governance import TokenBudget, audit_record, explanation_cache_key, record, sha256_of


class AuditRecord(unittest.TestCase):
    def test_book_example_is_valid(self) -> None:
        self.assertEqual(record["decision"], "approved")
        self.assertIs(record["contentRetained"], False)

    def test_unknown_field_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "not allowed in an audit record: prompt"):
            audit_record(prompt="Summarize the payments paths.")

    def test_free_text_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "reviewer must be a short identifier"):
            audit_record(reviewer="the security architect on call")

    def test_each_field_class(self) -> None:
        cases = {
            "attempt": (-1, "non-negative integer"),
            "inputTokens": (True, "non-negative integer"),
            "contentRetained": ("no", "true or false"),
            "audience": (3, "must be a string"),
            "packSha256": ("abc", "SHA-256"),
            "decision": ("maybe", "must be one of approved, pending, rejected"),
        }

        for name, (value, message) in cases.items():
            with self.subTest(name), self.assertRaisesRegex(ValueError, message):
                audit_record(**{name: value})

    def test_problems_are_joined(self) -> None:
        with self.assertRaisesRegex(ValueError, "attempt .*; decision"):
            audit_record(attempt=-1, decision="maybe")


class Hashing(unittest.TestCase):
    def test_key_order_does_not_matter(self) -> None:
        self.assertEqual(sha256_of({"a": 1, "b": [2]}), sha256_of({"b": [2], "a": 1}))

    def test_content_matters(self) -> None:
        self.assertNotEqual(sha256_of({"a": 1}), sha256_of({"a": 2}))


class CacheKey(unittest.TestCase):
    def test_length_prefixes_prevent_collisions(self) -> None:
        first = explanation_cache_key("a:b", "c", "board", "v4", "m1", "v2")
        second = explanation_cache_key("a", "b:c", "board", "v4", "m1", "v2")

        self.assertNotEqual(first, second)
        self.assertTrue(first.startswith("explain:3:a:b:1:c:"))

    def test_every_part_is_required(self) -> None:
        with self.assertRaises(ValueError):
            explanation_cache_key("contoso", "", "board", "v4", "m1", "v2")


class Budget(unittest.TestCase):
    def test_reserve_then_settle(self) -> None:
        budget = TokenBudget(1000)
        reservation = budget.reserve(400, 200)
        budget.settle(reservation, 450)

        self.assertEqual((reservation, budget.used, budget.reserved), (600, 450, 0))

    def test_reservation_that_would_overshoot_is_refused(self) -> None:
        budget = TokenBudget(1000)
        budget.reserve(500, 300)

        self.assertIsNone(budget.reserve(100, 101))
        self.assertEqual(budget.reserve(100, 100), 200)

    def test_usage_beyond_reservation_raises_after_recording(self) -> None:
        budget = TokenBudget(1000)
        reservation = budget.reserve(100, 100)

        with self.assertRaises(RuntimeError):
            budget.settle(reservation, 250)

        self.assertEqual(budget.used, 250)

    def test_invalid_inputs(self) -> None:
        with self.assertRaises(ValueError):
            TokenBudget(0)

        with self.assertRaises(ValueError):
            TokenBudget(10).reserve(-1, 5)

        with self.assertRaises(ValueError):
            TokenBudget(10).reserve(1, 0)


if __name__ == "__main__":
    unittest.main()
