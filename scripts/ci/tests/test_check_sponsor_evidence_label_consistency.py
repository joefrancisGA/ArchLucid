"""Tests for sponsor evidence label consistency guard."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class SponsorEvidenceLabelConsistencyTests(unittest.TestCase):
    def test_canonical_docs_pass(self) -> None:
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "ci" / "check_sponsor_evidence_label_consistency.py")],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)


if __name__ == "__main__":
    unittest.main()
