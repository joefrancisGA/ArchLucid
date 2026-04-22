"""Threshold smoke tests for golden_cohort_budget_probe.py (simulate mode, no Azure)."""

from __future__ import annotations

import os
import subprocess
import sys
import unittest
from pathlib import Path


class TestGoldenCohortBudgetProbeSimulate(unittest.TestCase):
    def _run(self, mtd: str) -> int:
        repo = Path(__file__).resolve().parents[2]
        env = os.environ.copy()
        env["ARCHLUCID_GOLDEN_COHORT_BUDGET_PROBE_SIMULATE_MTD_USD"] = mtd
        proc = subprocess.run(
            [sys.executable, str(repo / "scripts" / "golden_cohort_budget_probe.py")],
            cwd=repo,
            capture_output=True,
            text=True,
            check=False,
            env=env,
        )
        return proc.returncode

    def test_under_kill_threshold_returns_zero(self) -> None:
        self.assertEqual(self._run("10"), 0)
        self.assertEqual(self._run("44.99"), 0)

    def test_at_kill_threshold_returns_one(self) -> None:
        self.assertEqual(self._run("45"), 1)
        self.assertEqual(self._run("49.99"), 1)

    def test_at_cap_returns_two(self) -> None:
        self.assertEqual(self._run("50"), 2)
        self.assertEqual(self._run("60"), 2)


if __name__ == "__main__":
    unittest.main()
