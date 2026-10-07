"""Tests for the Gate 1 ship-gate-evidence index validator."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import sys

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import validate_ship_gate_evidence_index as sut


class TestShipGateEvidenceIndex(unittest.TestCase):
    def test_indexes_nested_valid_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            artifact_directory = root / "run-1"
            artifact_directory.mkdir()
            (artifact_directory / "ship-gate-evidence.json").write_text(
                json.dumps(
                    {
                        "baseUrl": "https://staging.example",
                        "runId": "run-1",
                        "generatedUtc": "2026-10-07T18:00:00Z",
                        "gates": [
                            {
                                "gateNumber": 1,
                                "name": "first review",
                                "verdict": "Pass",
                                "evidence": ["artifact"],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            records, issues = sut.build_index(root)

            self.assertEqual(issues, [])
            self.assertEqual(records[0]["runId"], "run-1")

    def test_requires_an_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            records, issues = sut.build_index(Path(temporary_directory))

            self.assertEqual(records, [])
            self.assertTrue(any("no ship-gate-evidence" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
