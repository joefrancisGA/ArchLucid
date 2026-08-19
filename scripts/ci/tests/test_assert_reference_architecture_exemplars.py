"""Drift guard — assert_reference_architecture_exemplars.py wiring."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "assert_reference_architecture_exemplars.py"


class TestAssertReferenceArchitectureExemplars(unittest.TestCase):
    def test_script_passes_on_repo_corpus(self) -> None:
        completed = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(
            0,
            completed.returncode,
            msg=completed.stdout + completed.stderr,
        )

    def test_pre_corset_guard_invokes_script(self) -> None:
        guard_script = (REPO_ROOT / "scripts" / "ci" / "run_guards_pre_corset.sh").read_text(
            encoding="utf-8",
        )
        self.assertIn("assert_reference_architecture_exemplars.py", guard_script)


if __name__ == "__main__":
    unittest.main()
