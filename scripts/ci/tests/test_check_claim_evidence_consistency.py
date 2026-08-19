"""T2-8 claim/evidence consistency gate tests."""

from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CHECKER = REPO_ROOT / "scripts" / "ci" / "check_claim_evidence_consistency.py"


class ClaimEvidenceConsistencyTests(unittest.TestCase):
    def test_valid_fixture_passes(self) -> None:
        completed = subprocess.run(
            ["python", str(CHECKER), "--fixture", "valid"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("PASS", completed.stdout)

    def test_invalid_fixture_fails(self) -> None:
        completed = subprocess.run(
            ["python", str(CHECKER), "--fixture", "invalid"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(completed.returncode, 1, completed.stdout)
        self.assertIn("FAIL", completed.stdout)

    def test_full_repo_emits_json_report(self) -> None:
        out = REPO_ROOT / "artifacts" / "ci-tmp" / "claim-evidence-consistency.json"
        completed = subprocess.run(
            [
                "python",
                str(CHECKER),
                "--json-out",
                str(out),
            ],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertTrue(out.is_file())

        report = json.loads(out.read_text(encoding="utf-8"))
        self.assertEqual(report["schema"], "archlucid.claim-evidence-consistency.v1")
        self.assertIn(report["disposition"], {"PASS", "FAIL"})
        self.assertIn("checks", report)


if __name__ == "__main__":
    unittest.main()
