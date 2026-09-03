"""Tests for scripts/ci/assert_ship_gate_evidence_schema.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "assert_ship_gate_evidence_schema.py"
FIXTURE = REPO_ROOT / "scripts" / "ci" / "fixtures" / "ship-gate-evidence" / "pass.example.json"


class AssertShipGateEvidenceSchemaTests(unittest.TestCase):
    def test_pass_fixture_validates(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(FIXTURE)],
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("OK", result.stdout)

    def test_rejects_missing_gates(self) -> None:
        invalid = {
            "baseUrl": "https://example.com",
            "runId": "abc",
            "generatedUtc": "2026-09-03T00:00:00Z",
        }

        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            handle.write(json.dumps(invalid))
            temp_path = Path(handle.name)

        try:
            proc = subprocess.run(
                [sys.executable, str(SCRIPT), str(temp_path)],
                capture_output=True,
                text=True,
                check=False,
            )
        finally:
            temp_path.unlink(missing_ok=True)

        self.assertEqual(proc.returncode, 1)
        self.assertIn("gates", proc.stderr)


if __name__ == "__main__":
    unittest.main()
