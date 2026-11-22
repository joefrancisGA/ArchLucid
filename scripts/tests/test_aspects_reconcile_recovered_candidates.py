"""Source-pin vs commit-derived historical candidate overlap goldens."""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_reconcile_recovered_candidates import reconcile
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256


SHA = "a" * 40
OLD_BLOB = "1" * 40
OTHER_BLOB = "2" * 40
ANCHOR = {
    "status": "verified_first_parent_sha_membership",
    "head_sha": SHA,
    "oldest_sha": SHA,
    "first_parent_commits": 900,
}


class CandidateOverlapTests(unittest.TestCase):
    def fixture(self):
        pinned = [
            {"excel_row": 7, "reviewed_master_sha": SHA,
             "pin_status": VERIFIED, "window_membership": "in_window",
             "path": "src/a.cs", "blob": OLD_BLOB, "spans": [[1, 2]]},
            {"excel_row": 8, "reviewed_master_sha": SHA,
             "pin_status": "not_parseable", "window_membership": "in_window"},
            {"excel_row": 9, "reviewed_master_sha": SHA,
             "pin_status": "not_parseable", "window_membership": "in_window"},
        ]
        def candidate(row, lo, hi, blob=OLD_BLOB):
            return {
                "excel_row": row, "reviewed_master_sha": SHA,
                "window_membership": "in_900_first_parent_window",
                "status": "git_source_at_review_commit_candidate_only",
                "original_blob_pinned": False, "candidate_nonblank_loc": hi-lo+1,
                "sources": [{
                    "path": "src/a.cs", "blob_derived_at_reviewed_commit": blob,
                    "original_blob_pinned": False,
                    "nonblank_intervals_at_reviewed_commit": [[lo, hi]],
                    "nonblank_loc": hi-lo+1,
                }],
            }
        candidates = [candidate(8, 2, 3), candidate(9, 3, 4)]
        return pinned, candidates

    def report(self, pinned, candidates, summary=None):
        pin_report = {"first_parent_checkpoint": ANCHOR,
                      "audited_rows_sha256": audited_rows_sha256(pinned)}
        valid = [r for r in candidates
                 if r["status"] == "git_source_at_review_commit_candidate_only"]
        candidate_report = {
            "first_parent_checkpoint": ANCHOR,
            "candidate_rows_sha256": audited_rows_sha256(candidates),
            "unparsed_historical_rows_examined": len(candidates),
            "candidate_rows": len(valid),
            "candidate_line_occurrences": sum(r["candidate_nonblank_loc"] for r in valid),
            "in_window_candidate_rows": len(valid),
            "in_window_candidate_line_occurrences":
                sum(r["candidate_nonblank_loc"] for r in valid),
        }
        return pin_report, candidate_report

    def run_case(self, pinned, candidates, reports=None):
        pin_report, candidate_report = reports or self.report(pinned, candidates)
        return reconcile(pinned, pin_report, candidates, candidate_report,
                         expected_records=len(pinned))

    def test_exact_overlaps_count_once_and_remain_outside_verified_density(self):
        pinned, candidates = self.fixture()
        report = self.run_case(pinned, candidates)
        self.assertEqual(report["status"],
                         "provisional_exact_path_blob_candidate_overlap_reconciled")
        self.assertEqual(report["original_pinned_unique_exact_path_blob_loc"], 2)
        self.assertEqual(report["candidate_review_rows_in_window"], 2)
        self.assertEqual(report["candidate_line_occurrences_in_window"], 4)
        self.assertEqual(report["candidate_unique_exact_path_blob_loc_in_window"], 3)
        self.assertEqual(report["candidate_repeated_exact_path_blob_loc_within_window"], 1)
        self.assertEqual(report["candidate_exact_line_overlap_with_original_pins"], 1)
        self.assertEqual(
            report["candidate_exact_path_blob_line_identities_not_in_original_pins"], 2)
        self.assertFalse(report["candidate_lines_added_to_verified_denominator"])
        self.assertIsNone(report["historical_900_density_recomputed"])
        self.assertIsNone(report["combined_verified_and_candidate_denominator"])

    def test_cross_revision_blob_is_not_silently_deduplicated(self):
        pinned, candidates = self.fixture()
        for row in candidates:
            row["sources"][0]["blob_derived_at_reviewed_commit"] = OTHER_BLOB
        report = self.run_case(pinned, candidates)
        self.assertEqual(report["candidate_exact_line_overlap_with_original_pins"], 0)
        self.assertEqual(
            report["candidate_exact_path_blob_line_identities_not_in_original_pins"], 3)

    def test_bad_row_level_digest_prevents_promotion(self):
        pinned, candidates = self.fixture()
        reports = self.report(pinned, candidates)
        candidates[0]["sources"][0]["nonblank_intervals_at_reviewed_commit"] = [[1, 2]]
        outcome = self.run_case(pinned, candidates, reports)
        self.assertEqual(outcome["status"], "blocked_on_mismatched_evidence")
        self.assertIn("SHA-256", outcome["blocking_reason"])

    def test_mismatched_window_membership_is_blocking(self):
        pinned, candidates = self.fixture()
        candidates[0]["window_membership"] = "outside_900_first_parent_window"
        result = self.run_case(pinned, candidates)
        self.assertIn("window membership", result["blocking_reason"])

    def test_derived_row_must_be_unpinned_in_original_audit(self):
        pinned, candidates = self.fixture()
        pinned[1]["pin_status"] = VERIFIED
        result = self.run_case(pinned, candidates)
        self.assertIn("Already verified", result["blocking_reason"])

    def test_missing_interval_and_contradictory_count_are_blocking(self):
        pinned, candidates = self.fixture()
        del candidates[0]["sources"][0]["nonblank_intervals_at_reviewed_commit"]
        result = self.run_case(pinned, candidates)
        self.assertIn("source intervals", result["blocking_reason"])
        pinned, candidates = self.fixture()
        candidates[0]["candidate_nonblank_loc"] = 100
        result = self.run_case(pinned, candidates)
        self.assertIn("contradicts", result["blocking_reason"])

    def test_candidate_quarantine_not_construed_as_zero_review(self):
        pinned, candidates = self.fixture()
        candidates[1].update({
            "status": "commit_path_unavailable", "candidate_nonblank_loc": 0,
            "sources": [],
        })
        report = self.run_case(pinned, candidates)
        # Summary was re-derived by fixture; a quarantined row stays present.
        self.assertEqual(report["candidate_review_rows_in_window"], 1)
        self.assertEqual(report["excluded_or_unrecovered_rows_by_reason"],
                         {"commit_path_unavailable": 1})

    def test_first_parent_anchor_mismatch_fails_closed(self):
        pinned, candidates = self.fixture()
        reports = self.report(pinned, candidates)
        reports[1]["first_parent_checkpoint"] = {
            **ANCHOR, "oldest_sha": "f" * 40}
        result = self.run_case(pinned, candidates, reports)
        self.assertIn("First-parent", result["blocking_reason"])


if __name__ == "__main__":
    unittest.main()
