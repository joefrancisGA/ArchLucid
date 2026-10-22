"""Unit tests for assert_mutation_microcases.py."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

REPO_ROOT = Path(__file__).resolve().parents[3]

import assert_mutation_microcases as sut  # noqa: E402


class AssertMutationMicrocasesTests(unittest.TestCase):
    def test_verify_manifest_accepts_canonical_document(self) -> None:
        manifest_path = REPO_ROOT / "tests" / "eval-corpus" / "mutation-microcases.json"
        failures = sut.verify_manifest(manifest_path)
        self.assertEqual(failures, [])

    def test_verify_manifest_rejects_missing_case(self) -> None:
        document = {
            "minimumCaseCount": 8,
            "cases": [
                {
                    "mutationId": "mutate-rto-30m",
                    "applyDelta": "recovery-objective:RTO=30m",
                    "expectChangedFindings": True,
                }
            ],
        }
        temp_path = Path(self._testMethodName) / "mutation-microcases.json"
        temp_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path.write_text(json.dumps(document), encoding="utf-8")

        failures = sut.verify_manifest(temp_path)

        self.assertTrue(any("missing canonical mutationId" in message for message in failures))


if __name__ == "__main__":
    unittest.main()
