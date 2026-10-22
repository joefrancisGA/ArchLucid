"""Regression guard for insight-density distribution No evidence / No anchor columns."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class AssertInsightDensityDistributionZeroGapsTests(unittest.TestCase):
    def test_distribution_has_zero_no_evidence_and_no_anchor(self) -> None:
        result = subprocess.run(
            [sys.executable, "scripts/ci/assert_insight_density_distribution_zero_gaps.py"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(
            result.returncode,
            0,
            msg=result.stderr or result.stdout,
        )


if __name__ == "__main__":
    unittest.main()
