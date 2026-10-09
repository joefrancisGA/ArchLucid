"""Tests for private-beta evidence cut consistency."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import check_private_beta_evidence_consistency as sut


class TestPrivateBetaEvidenceConsistency(unittest.TestCase):
    def test_accepts_one_cut_with_complete_records(self) -> None:
        payload = {
            "gitCommitSha": "abc123",
            "requestedRunIds": ["run-1", "run-2"],
            "records": [{"runId": "run-1"}, {"runId": "run-2"}],
        }

        self.assertEqual(
            sut.collect_violations([payload], expected_commit_sha="abc123"),
            [],
        )

    def test_rejects_mixed_commit_shas(self) -> None:
        payload = {
            "gitCommitSha": "abc123",
            "records": [{"runId": "run-1", "headSha": "def456"}],
        }

        violations = sut.collect_violations([payload])

        self.assertTrue(any("multiple commit SHAs" in violation for violation in violations))

    def test_rejects_duplicate_and_missing_run_records(self) -> None:
        payload = {
            "requestedRunIds": ["run-1", "run-1", "run-2"],
            "records": [{"runId": "run-1"}, {"runId": "run-1"}],
        }

        violations = sut.collect_violations([payload])

        self.assertTrue(any("duplicate requested run IDs" in violation for violation in violations))
        self.assertTrue(any("duplicate evidence run IDs" in violation for violation in violations))
        self.assertTrue(any("run-2" in violation for violation in violations))

    def test_expected_sha_requires_evidence_sha(self) -> None:
        payload = {"requestedRunIds": ["run-1"], "records": [{"runId": "run-1"}]}

        violations = sut.collect_violations([payload], expected_commit_sha="abc123")

        self.assertEqual(
            violations,
            ["expected commit SHA was supplied but evidence has none"],
        )


if __name__ == "__main__":
    unittest.main()
