"""Unit tests for dispatch_full_ci_matrix.sh."""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "dispatch_full_ci_matrix.sh"


class TestDispatchFullCiMatrix(unittest.TestCase):
    def test_script_exists_and_is_executable(self) -> None:
        self.assertTrue(SCRIPT.is_file())
        self.assertTrue(SCRIPT.stat().st_mode & 0o111)

    def test_script_references_workflow_dispatch_target(self) -> None:
        text = SCRIPT.read_text(encoding="utf-8")
        self.assertIn("ci.yml", text)
        self.assertIn("gh workflow run", text)
        self.assertIn("run_extended_live_a11y_matrix", text)


if __name__ == "__main__":
    unittest.main()
