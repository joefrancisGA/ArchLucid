"""Goldens for cautious, source-pinned historical cross-revision accounting."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import aspects_reconcile_historical_lineage as sut
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256


def run(repo: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()


class HistoricalLineageTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.repo = Path(temp.name)
        run(self.repo, "init", "-q")
        run(self.repo, "config", "user.email", "aspects@example.invalid")
        run(self.repo, "config", "user.name", "Aspects Tests")
        self.make_commit("alpha\n\nbeta\ngamma\n", "original")
        self.old_head = run(self.repo, "rev-parse", "HEAD")
        self.old_blob = run(self.repo, "rev-parse", "HEAD:a.cs")
        self.make_commit("alpha\n\nbeta\ngamma\ndelta\n", "append")
        self.new_head = run(self.repo, "rev-parse", "HEAD")
        self.new_blob = run(self.repo, "rev-parse", "HEAD:a.cs")

    def make_commit(self, source, message):
        (self.repo / "a.cs").write_text(source, encoding="utf-8")
        run(self.repo, "add", "a.cs")
        run(self.repo, "commit", "-qm", message)

    def event(self, row, head, blob, spans, membership="in_window"):
        return {
            "excel_row": row, "review_id": str(row), "reviewed_master_sha": head,
            "pin_status": VERIFIED, "window_membership": membership,
            "path": "a.cs", "blob": blob, "spans": spans,
            "nonblank_reviewed_loc": sum(end - start + 1 for start, end in spans),
        }

    def checkpoint(self, window=2):
        return {"head_sha": self.new_head,
                "oldest_included_sha": self.old_head if window == 2 else self.new_head,
                "window_first_parent_commits": window}

    def pin_report(self, rows):
        return {"first_parent_checkpoint": {
                    "status": "verified_first_parent_sha_membership",
                    "head_sha": self.new_head},
                "review_events_present": len(rows),
                "audited_rows_sha256": audited_rows_sha256(rows)}

    def reconcile(self, rows, window=2):
        return sut.reconcile(self.repo, rows, self.checkpoint(window),
                             self.pin_report(rows), expected_records=len(rows))

    def test_cross_revision_unique_unchanged_lines_are_provisional_only(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1], [3, 3]]),
                self.event(8, self.old_head, self.old_blob, [[1, 1]]),
                self.event(9, self.new_head, self.new_blob, [[1, 1], [3, 3], [5, 5]])]
        report = self.reconcile(rows)
        self.assertEqual(report["status"], "provisional_same_path_unique_unchanged_lineage")
        self.assertEqual(report["verified_pin_line_occurrences_in_window"], 6)
        self.assertEqual(report["verified_unique_exact_path_blob_lines_in_window"], 5)
        self.assertEqual(report["verified_repeated_exact_path_blob_lines_in_window"], 1)
        self.assertEqual(report["single_file_original_pin_unique_exact_loc_in_window"], 5)
        self.assertEqual(report["multi_file_original_pin_unique_exact_loc_in_window"], 0)
        self.assertEqual(report["multi_file_original_pin_exact_overlap_with_single_file_loc_in_window"], 0)
        self.assertEqual(report["multi_file_original_pin_new_exact_loc_vs_single_file_loc_in_window"], 0)
        self.assertEqual(report["provisionally_mapped_unique_loc"], 3)
        self.assertEqual(report["provisionally_mapped_additional_repeated_loc"], 2)
        self.assertIsNone(report["historical_900_density_recomputed"])
        self.assertIsNone(report["historical_distinct_defects_reconciled"])

    def test_atomic_multisource_review_counts_once_with_independent_source_pins(self):
        (self.repo / "b.cs").write_text("unique to b\n", encoding="utf-8")
        run(self.repo, "add", "b.cs")
        run(self.repo, "commit", "-qm", "second source")
        third_head = run(self.repo, "rev-parse", "HEAD")
        b_blob = run(self.repo, "rev-parse", "HEAD:b.cs")
        latest_a_blob = run(self.repo, "rev-parse", "HEAD:a.cs")
        old = self.event(7, self.old_head, self.old_blob, [[1, 1]])
        # A separate already-reviewed single-file row shares EXACTLY the
        # newer a.cs path/blob/line with the multi-source observation.
        same_blob_single = self.event(9, third_head, latest_a_blob, [[1, 1]])
        multi = {
            **self.event(8, third_head, latest_a_blob, [[1, 1]]),
            "pinned_sources": [
                {"path": "a.cs", "blob": latest_a_blob, "spans": [[1, 1]]},
                {"path": "b.cs", "blob": b_blob, "spans": [[1, 1]]},
            ],
            "nonblank_reviewed_loc": 2,
        }
        rows = [old, same_blob_single, multi]
        checkpoint = {"head_sha": third_head, "oldest_included_sha": self.old_head,
                      "window_first_parent_commits": 3}
        report = {"first_parent_checkpoint": {
            "status": "verified_first_parent_sha_membership", "head_sha": third_head},
            "review_events_present": 2, "audited_rows_sha256": audited_rows_sha256(rows)}
        outcome = sut.reconcile(self.repo, rows, checkpoint, report, expected_records=2)
        self.assertEqual(outcome["status"], "provisional_same_path_unique_unchanged_lineage")
        self.assertEqual(outcome["eligible_verified_review_rows"], 3)
        self.assertEqual(outcome["path_blob_identities"], 3)
        self.assertEqual(outcome["verified_pin_line_occurrences_in_window"], 4)
        self.assertEqual(outcome["verified_repeated_exact_path_blob_lines_in_window"], 1)
        self.assertEqual(outcome["single_file_original_pin_unique_exact_loc_in_window"], 2)
        self.assertEqual(outcome["multi_file_original_pin_unique_exact_loc_in_window"], 2)
        self.assertEqual(outcome["multi_file_original_pin_exact_overlap_with_single_file_loc_in_window"], 1)
        self.assertEqual(outcome["multi_file_original_pin_new_exact_loc_vs_single_file_loc_in_window"], 1)
        self.assertEqual(outcome["verified_unique_exact_path_blob_lines_in_window"], 3)
        self.assertEqual(outcome["provisionally_mapped_unique_loc"], 2)
        # The aggregate row size must exactly equal all of its pinned segments.
        multi["nonblank_reviewed_loc"] = 1
        report["audited_rows_sha256"] = audited_rows_sha256(rows)
        outcome = sut.reconcile(self.repo, rows, checkpoint, report, expected_records=2)
        self.assertIn("Audited LOC disagrees", outcome["blocking_reason"])

    def test_ambiguous_repeated_text_does_not_map(self):
        self.assertEqual(list(sut.unique_unchanged_pairs(
            ["repeat", "repeat", "unique"], ["repeat", "repeat", "unique", "extra"])),
            [(3, 3)])

    def test_expired_older_review_excluded_after_window_rotation(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]],
                           membership="not_on_first_parent_window"),
                self.event(8, self.new_head, self.new_blob, [[1, 1], [5, 5]])]
        report = self.reconcile(rows, window=1)
        self.assertEqual(report["eligible_verified_review_rows"], 1)
        self.assertEqual(report["verified_unique_exact_path_blob_lines_in_window"], 2)
        self.assertEqual(report["provisionally_mapped_unique_loc"], 2)
        self.assertEqual(report["excluded_or_unverified_review_rows"], 1)

    def test_unverified_and_no_source_never_contribute_coverage(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]]),
                {**self.event(8, self.new_head, self.new_blob, [[5, 5]]),
                 "pin_status": "blob_mismatch"},
                {**self.event(9, self.new_head, self.new_blob, [[1, 1]]),
                 "window_membership": "membership_unverified"}]
        report = self.reconcile(rows)
        self.assertEqual(report["eligible_verified_review_rows"], 1)
        self.assertEqual(report["verified_unique_exact_path_blob_lines_in_window"], 1)
        self.assertEqual(report["excluded_or_unverified_review_rows"], 2)

    def test_all_quarantined_rows_are_not_misreported_as_zero_loc(self):
        row = {**self.event(7, self.old_head, self.old_blob, [[1, 1]]),
               "pin_status": "path_or_commit_unavailable"}
        report = self.reconcile([row])
        self.assertEqual(report["status"],
                         "no_verified_review_pins_on_this_first_parent_window")
        self.assertNotIn("provisionally_mapped_unique_loc", report)
        self.assertEqual(report["excluded_or_unverified_review_rows"], 1)

    def test_wrong_checkpoint_anchor_fails_closed(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]])]
        checkpoint = self.checkpoint()
        checkpoint["oldest_included_sha"] = "f" * 40
        report = sut.reconcile(self.repo, rows, checkpoint, self.pin_report(rows),
                               expected_records=1)
        self.assertEqual(report["status"], "blocked_on_pin_window_validation")
        self.assertNotIn("provisionally_mapped_unique_loc", report)

    def test_missing_or_inconsistent_span_does_not_count(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]])]
        rows[0]["nonblank_reviewed_loc"] = 99
        report = self.reconcile(rows)
        self.assertEqual(report["status"], "blocked_on_pin_window_validation")
        self.assertIn("Audited LOC disagrees", report["blocking_reason"])

    def test_large_blob_comparison_is_skipped_not_assumed_equivalent(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]]),
                self.event(8, self.new_head, self.new_blob, [[1, 1]])]
        report = sut.reconcile(self.repo, rows, self.checkpoint(),
                               self.pin_report(rows), max_blob_lines=1,
                               expected_records=len(rows))
        self.assertEqual(report["adjacent_reviewed_revision_pairs_skipped"], 1)
        self.assertEqual(report["provisionally_mapped_unique_loc"], 2)


    def test_mismatched_aggregate_and_row_level_audit_fails_closed(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]])]
        pin_report = self.pin_report(rows)
        rows[0]["spans"] = [[3, 3]]  # Same LOC count: naive checks cannot catch this.
        result = sut.reconcile(self.repo, rows, self.checkpoint(), pin_report,
                               expected_records=len(rows))
        self.assertEqual(result["status"], "blocked_on_pin_window_validation")
        self.assertIn("SHA-256", result["blocking_reason"])

    def test_missing_audit_digest_does_not_promote_unverified_source(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]])]
        pin_report = self.pin_report(rows)
        del pin_report["audited_rows_sha256"]
        result = sut.reconcile(self.repo, rows, self.checkpoint(), pin_report,
                               expected_records=len(rows))
        self.assertEqual(result["status"], "blocked_on_pin_window_validation")
        self.assertNotIn("provisionally_mapped_unique_loc", result)

    def test_contiguous_excel_row_range_required_for_full_corpus(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]]),
                self.event(9, self.new_head, self.new_blob, [[5, 5]])]
        result = sut.reconcile(self.repo, rows, self.checkpoint(),
                               self.pin_report(rows), expected_records=2,
                               expected_first_excel_row=7)
        self.assertEqual(result["status"], "blocked_on_pin_window_validation")
        self.assertIn("Excel row range", result["blocking_reason"])


    def test_noninteger_excel_id_is_quarantined_without_exception(self):
        rows = [self.event(7, self.old_head, self.old_blob, [[1, 1]]),
                self.event(8, self.new_head, self.new_blob, [[5, 5]])]
        rows[1]["excel_row"] = None
        result = sut.reconcile(self.repo, rows, self.checkpoint(),
                               self.pin_report(rows), expected_records=2,
                               expected_first_excel_row=7)
        self.assertEqual(result["status"], "blocked_on_pin_window_validation")
        self.assertIn("Excel row range", result["blocking_reason"])


if __name__ == "__main__":
    unittest.main()
