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
            "gitCommitSha": "a" * 40,
            "requestedRunIds": ["run-1", "run-2"],
            "records": [{"runId": "run-1"}, {"runId": "run-2"}],
        }

        self.assertEqual(
            sut.collect_violations([payload], expected_commit_sha="a" * 40),
            [],
        )

    def test_rejects_mixed_commit_shas(self) -> None:
        payload = {
            "gitCommitSha": "abc123",
            "records": [{"runId": "run-1", "headSha": "b" * 40}],
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

    def test_no_commit_identity_or_missing_run_ids_fail(self) -> None:
        self.assertTrue(sut.collect_violations([]))
        self.assertTrue(sut.collect_violations([{"requestedRunIds": [], "records": []}]))

    def test_unexpected_evidence_run_is_not_accepted(self) -> None:
        payload = {
            "gitCommitSha": "a" * 40,
            "requestedRunIds": ["run-1"],
            "records": [{"runId": "run-1"}, {"runId": "run-injected"}],
        }
        self.assertTrue(any("unrequested run IDs" in issue for issue in sut.collect_violations([payload])))

    def test_invalid_commit_sha_cannot_certify_release(self) -> None:
        for sha in ("abc123", "0" * 40, "z" * 40, "a" * 39):
            with self.subTest(sha=sha):
                payload = {
                    "gitCommitSha": sha,
                    "requestedRunIds": ["run-1"],
                    "records": [{"runId": "run-1"}],
                }
                self.assertTrue(any("invalid commit SHA" in v for v in sut.collect_violations([payload])))

    def test_invalid_run_collections_fail_with_actionable_error(self) -> None:
        for key, value in (("records", {}), ("records", None),
                           ("requestedRunIds", "run-1"), ("requestedRunIds", None)):
            with self.subTest(key=key, value=value):
                payload = {"gitCommitSha": "a" * 40, "requestedRunIds": ["run-1"],
                           "records": [{"runId": "run-1"}]}
                payload[key] = value
                with self.assertRaisesRegex(ValueError, "must be arrays"):
                    sut.collect_violations([payload])

    def test_expected_sha_requires_evidence_sha(self) -> None:
        payload = {"requestedRunIds": ["run-1"], "records": [{"runId": "run-1"}]}

        violations = sut.collect_violations([payload], expected_commit_sha="abc123")

        self.assertIn("expected commit SHA was supplied but evidence has none", violations)


if __name__ == "__main__":
    unittest.main()
