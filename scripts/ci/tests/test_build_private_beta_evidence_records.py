"""Tests for beta-critical RC evidence record generation."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import build_private_beta_evidence_records as sut


class TestBuildPrivateBetaEvidenceRecords(unittest.TestCase):
    def test_builds_records_for_requested_run_ids(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "evidence"
            run = root / "run-1"
            run.mkdir(parents=True)
            (run / "ship-gate-evidence.json").write_text(
                json.dumps(
                    {
                        "baseUrl": "https://staging.example",
                        "runId": "run-1",
                        "generatedUtc": "2026-10-08T00:00:00Z",
                        "gates": [{"gateNumber": 1, "name": "first review", "verdict": "Pass", "evidence": ["x"]}],
                    }
                ),
                encoding="utf-8",
            )

            report = sut.build_records(root, ["run-1"])

            self.assertEqual(report["disposition"], "PASS")
            self.assertEqual(report["records"][0]["runId"], "run-1")

    def test_missing_requested_run_is_blocked(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            report = sut.build_records(Path(directory), ["missing"])

        self.assertEqual(report["disposition"], "HOLD")
        self.assertTrue(any("missing" in issue for issue in report["issues"]))


if __name__ == "__main__":
    unittest.main()
