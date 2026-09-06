"""Unit tests for retrigger_private_beta_access_on_push.sh."""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "retrigger_private_beta_access_on_push.sh"


class TestRetriggerPrivateBetaAccessOnPush(unittest.TestCase):
    def test_script_exists_and_is_executable(self) -> None:
        self.assertTrue(SCRIPT.is_file())
        self.assertTrue(SCRIPT.stat().st_mode & 0o111)

    def test_script_references_workflow_dispatch_target(self) -> None:
        text = SCRIPT.read_text(encoding="utf-8")
        self.assertIn("private-beta-access-on-push.yml", text)
        self.assertIn("gh workflow run", text)


if __name__ == "__main__":
    unittest.main()
