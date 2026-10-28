"""Tests for private-beta rate-limit diagnostics."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import report_private_beta_rate_limit_diagnostics as sut


class TestPrivateBetaRateLimitDiagnostics(unittest.TestCase):
    def test_forty_invalid_rate_limit_observation_fixtures_hold(self) -> None:
        invalid_statuses = [None, "", "429", True, False, -1, 0, 99, 600, 700,
                            1.5, [], {}, "OK", "500", -429, 999, 1000, 2.0, 200.5]
        invalid_budget_values = [float("inf"), float("-inf"), float("nan"), "Infinity",
                                 "-Infinity", "NaN", -1, -0.1, [], {}]
        cases = [
            {"status": value, "identity": "tenant:x"} for value in invalid_statuses
        ] + [
            {"status": 429, "identity": "tenant:x",
             "retryAfterSeconds": 2,
             "retryBudgetRemaining": value,
             "retryBudgetLimit": 5}
            for value in invalid_budget_values
        ] + [
            {"status": 429, "identity": "tenant:x",
             "retryAfterSeconds": value,
             "retryBudgetRemaining": 2,
             "retryBudgetLimit": 5}
            for value in invalid_budget_values
        ]
        self.assertEqual(len(cases), 40)
        for i, sample in enumerate(cases):
            with self.subTest(case=i):
                summary = sut.evaluate_observations([sample])
                self.assertEqual(summary["disposition"], "HOLD", sample)

    def test_finite_valid_budget_passes(self) -> None:
        summary = sut.evaluate_observations([{
            "status": 429, "identity": "tenant:x", "retryAfterSeconds": 1.5,
            "retryBudgetRemaining": 2, "retryBudgetLimit": 5,
        }])
        self.assertEqual(summary["disposition"], "PASS")

    def test_accepts_retry_after_identity_and_budget(self) -> None:
        summary = sut.evaluate_observations(
            [
                {
                    "status": 429,
                    "identity": "tenant:tenant-a",
                    "retryAfterSeconds": 3,
                    "retryBudgetRemaining": 2,
                    "retryBudgetLimit": 5,
                }
            ]
        )

        self.assertEqual(summary["disposition"], "PASS")
        self.assertEqual(summary["rateLimitedCount"], 1)
        self.assertEqual(summary["observations"][0]["classification"], "retry-after")

    def test_classifies_long_retry_after_separately_from_exhaustion(self) -> None:
        summary = sut.evaluate_observations(
            [
                {
                    "status": 429,
                    "identity": "tenant:tenant-a",
                    "retryAfterSeconds": 900,
                    "retryBudgetRemaining": 2,
                    "retryBudgetLimit": 5,
                },
                {
                    "status": 429,
                    "identity": "tenant:tenant-a",
                    "retryAfterSeconds": 2,
                    "retryBudgetRemaining": 0,
                    "retryBudgetLimit": 5,
                },
            ]
        )

        self.assertEqual(summary["observations"][0]["classification"], "long-retry-after")
        self.assertEqual(summary["observations"][1]["classification"], "retry-budget-exhausted")
        self.assertEqual(len(summary["warnings"]), 1)

    def test_rejects_missing_retry_after_identity_and_exhausted_budget(self) -> None:
        summary = sut.evaluate_observations(
            [
                {
                    "status": 429,
                    "retryBudgetRemaining": 0,
                    "retryBudgetLimit": 3,
                }
            ]
        )

        self.assertEqual(summary["disposition"], "HOLD")
        self.assertEqual(len(summary["issues"]), 3)


if __name__ == "__main__":
    unittest.main()
