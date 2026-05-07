"""Format-only check: data consistency readiness script emits output."""
from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


class TestDataConsistencyModeReadinessReport(unittest.TestCase):
    def test_script_writes_markdown(self):
        script = _REPO / "scripts/data_consistency_mode_readiness_report.py"
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "out.md"
            result = subprocess.run(
                [sys.executable, str(script), "--out", str(out)],
                cwd=_REPO,
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            text = out.read_text(encoding="utf-8")
            self.assertIn("Data consistency mode readiness", text)
            self.assertTrue("WITH NOCHECK" in text or "brownfield" in text.lower())
