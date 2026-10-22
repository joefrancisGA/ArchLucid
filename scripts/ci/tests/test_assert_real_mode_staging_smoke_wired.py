"""Drift guard for real-mode staging smoke wiring."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


class AssertRealModeStagingSmokeWiredTests(unittest.TestCase):
    def test_script_passes_against_repo(self) -> None:
        root = Path(__file__).resolve().parents[3]
        script = root / "scripts" / "ci" / "assert_real_mode_staging_smoke_wired.py"
        proc = subprocess.run(
            [sys.executable, str(script)],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)


if __name__ == "__main__":
    unittest.main()
