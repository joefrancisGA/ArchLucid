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
