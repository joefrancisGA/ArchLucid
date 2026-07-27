"""Tests for weekly proof cadence builder and validator."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CI = REPO_ROOT / "scripts" / "ci"


class WeeklyProofCadenceTests(unittest.TestCase):
    def test_validate_rejects_missing_gates(self) -> None:
        sys.path.insert(0, str(CI))
        from validate_weekly_proof_cadence import validate_payload

        errors = validate_payload({"schema": "archlucid.weekly-proof-cadence.v1"})
        self.assertTrue(any("gates" in error for error in errors))

    def test_build_and_validate_sample_packet(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            release_dir = root / "release"
            release_dir.mkdir()
            (release_dir / "release-evidence-bundle-manifest.json").write_text(
                json.dumps(
                    {
                        "generatedUtc": "2026-06-15T12:00:00+00:00",
                        "realModeAiEvidence": {"status": "MISSING"},
                    }
                )
                + "\n",
                encoding="utf-8",
            )

            cadence_json = root / "weekly-proof-cadence.json"
            completed = subprocess.run(
                [
                    sys.executable,
                    str(CI / "build_weekly_proof_cadence.py"),
                    "--cadence-id",
                    "test-weekly",
                    "--release-bundle-dir",
                    str(release_dir),
                    "--claim-status",
                    str(REPO_ROOT / "docs" / "go-to-market" / "CLAIM_READINESS_STATUS.md"),
                    "--proof-log",
                    str(REPO_ROOT / "docs" / "go-to-market" / "CLAIM_READINESS_STATUS.md"),
                    "--json-out",
                    str(cadence_json),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)

            payload = json.loads(cadence_json.read_text(encoding="utf-8"))
            self.assertEqual("archlucid.weekly-proof-cadence.v1", payload["schema"])
            self.assertIn("G4", payload["gates"])
            self.assertTrue(payload["missingRealModeEvidence"])
            self.assertEqual("NOT_READY", payload["stage1Readiness"])


if __name__ == "__main__":
    unittest.main()
