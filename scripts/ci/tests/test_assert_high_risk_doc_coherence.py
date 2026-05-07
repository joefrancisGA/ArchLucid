"""Smoke tests for high-risk doc coherence guard."""
from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


class TestAssertHighRiskDocCoherence(unittest.TestCase):
    def test_coherence_repo_passes(self):
        script = _REPO / "scripts/ci/assert_high_risk_doc_coherence.py"
        result = subprocess.run([sys.executable, str(script)], cwd=_REPO, check=False, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
