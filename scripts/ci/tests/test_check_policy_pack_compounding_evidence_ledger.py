"""Unit tests for the TB-885 compounding-evidence ledger scripts."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestPolicyPackCompoundingEvidenceLedger(unittest.TestCase):
    def test_guard_passes_on_repo(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts/ci/check_policy_pack_compounding_evidence_ledger.py"),
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
                    str(REPO_ROOT / "scripts/ci/write_policy_pack_compounding_evidence_ledger.py"),
                    "--out",
                    tmp,
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )

            self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
            markdown = Path(tmp) / "policy-pack-compounding-evidence-ledger.md"
            json_path = Path(tmp) / "policy-pack-compounding-evidence-ledger.json"
            self.assertTrue(markdown.is_file())
            self.assertTrue(json_path.is_file())
            text = markdown.read_text(encoding="utf-8")
            self.assertIn("demo-finding-critical", text)
            self.assertIn("demo-ctrl-network-isolation", text)
            self.assertIn("not a buyer compounding rate", text)


if __name__ == "__main__":
    unittest.main()
