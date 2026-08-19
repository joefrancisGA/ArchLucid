"""Tests for assert_pilot_ui_env_posture.py."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts" / "ci" / "assert_pilot_ui_env_posture.py"


class AssertPilotUiEnvPostureTests(unittest.TestCase):
    def test_script_passes_on_repo_pilot_example_files(self) -> None:
        completed = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(
            completed.returncode,
            0,
            msg=completed.stderr or completed.stdout,
        )


if __name__ == "__main__":
    unittest.main()
