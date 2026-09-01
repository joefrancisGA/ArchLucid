"""Unit tests for the WK-12 offline finding-delta packet."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestPolicyPackFindingDeltaOfflinePacket(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / "ci" / "check_policy_pack_finding_delta_offline_packet.py"),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)

    def test_writer_emits_markdown_and_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = subprocess.run(
                [
                    sys.executable,
                    str(REPO_ROOT / "scripts" / "ci" / "write_policy_pack_finding_delta_offline_packet.py"),
                    "--out",
                    tmp,
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
            markdown = Path(tmp) / "finding-delta-offline.md"
            json_path = Path(tmp) / "finding-delta-offline.json"
            self.assertTrue(markdown.is_file())
            self.assertTrue(json_path.is_file())
            text = markdown.read_text(encoding="utf-8")
            self.assertIn("SOC 2", text)
            self.assertIn("CIS Azure", text)
            self.assertIn("requireBudgetCap", text)
            self.assertIn("identity", text)
            self.assertNotIn("{'", text)


if __name__ == "__main__":
    unittest.main()
