"""Goldens: historical Git pin verification never infers cross-revision lineage."""
from __future__ import annotations

import hashlib
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import aspects_validate_historical_pins as sut


def run(repo: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()


class HistoricalPinVerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        run(self.repo, "init", "-q")
        run(self.repo, "config", "user.email", "aspects-test@example.invalid")
        run(self.repo, "config", "user.name", "Aspects Tests")
        (self.repo / "a.cs").write_text("one\n\ntwo\nthree\n", encoding="utf-8")
        run(self.repo, "add", "a.cs")
        run(self.repo, "commit", "-qm", "source")
        self.first_commit = run(self.repo, "rev-parse", "HEAD")
        self.first_blob = run(self.repo, "rev-parse", "HEAD:a.cs")

    def event(self, *, spans=None, blob=None, head=None, defects=0, excel_row=7):
        return {
            "excel_row": excel_row,
            "reviewed_master_sha": head or self.first_commit,
            "defects_recorded": defects,
            "parsed_pin": {
                "path": "a.cs", "blob": blob or self.first_blob,
                "spans": spans if spans is not None else [[1, 1], [3, 4]],
            },
        }

    def test_clean_and_defect_reviews_both_count_but_exact_replays_dont(self):
        rows = [
            self.event(excel_row=7),
            self.event(excel_row=8, spans=[[3, 4]], defects=1),
        ]
        report = sut.verify_pins(self.repo, rows)
        self.assertEqual(report["verified_pin_rows"], 2)
        self.assertEqual(report["verified_clean_review_rows"], 1)
        self.assertEqual(report["verified_defect_positive_rows_not_distinct_defects"], 1)
        self.assertEqual(report["verified_nonblank_line_occurrences"], 5)
        self.assertEqual(report["verified_unique_exact_path_blob_lines"], 3)
        self.assertEqual(report["verified_repeated_exact_path_blob_lines"], 2)
        self.assertIsNone(report["historical_900_first_parent_density_recomputed"])

    def test_blank_and_out_of_bounds_ranges_not_promoted(self):
        rows = [
            self.event(spans=[[2, 2]], excel_row=8),
            self.event(spans=[[999, 999]], excel_row=9),
            self.event(spans=[[1, 1]], excel_row=10),
        ]
        report = sut.verify_pins(self.repo, rows)
        self.assertEqual(report["verified_pin_rows"], 1)
        self.assertEqual(report["classifications"]["blank_line_in_reported_span"], 1)
        self.assertEqual(report["classifications"]["span_out_of_bounds"], 1)
        self.assertEqual(report["verified_unique_exact_path_blob_lines"], 1)

    def test_changed_blob_same_path_is_not_misidentified_as_old_revision(self):
        (self.repo / "a.cs").write_text("one\nchanged\ntwo\nthree\n", encoding="utf-8")
        run(self.repo, "add", "a.cs")
        run(self.repo, "commit", "-qm", "new revision")
        second_commit = run(self.repo, "rev-parse", "HEAD")
        row = self.event(head=second_commit)
        result = sut.verify_pins(self.repo, [row])
        self.assertEqual(result["verified_pin_rows"], 0)
        self.assertEqual(result["classifications"]["blob_mismatch"], 1)
        self.assertEqual(result["cross_revision_lineage"], "unresolved")

    def test_missing_commit_is_eligible_for_diagnostic_not_false_verification(self):
        row = self.event(head="f" * 40)
        result = sut.verify_pins(self.repo, [row])
        self.assertEqual(result["verified_pin_rows"], 0)
        self.assertEqual(result["classifications"]["path_or_commit_unavailable"], 1)

    def test_unparseable_multifile_observation_still_tracked(self):
        row = self.event()
        row["parsed_pin"] = None
        result = sut.verify_pins(self.repo, [row])
        self.assertEqual(result["review_events_present"], 1)
        self.assertEqual(result["candidate_pin_count"], 0)
        self.assertEqual(result["classifications"]["not_parseable"], 1)
        self.assertEqual(result["unverified_total_excluding_unparseable"], 0)


    def test_full_quarantine_preserves_excel_rows_and_per_row_new_repeat_loc(self):
        audit = []
        rows = [self.event(excel_row=7),
                self.event(excel_row=8, spans=[[3, 4]], defects=1),
                self.event(excel_row=9, spans=[[2, 2]]),
                self.event(excel_row=10, spans=[[999, 999]])]
        rows.append({**self.event(excel_row=11), "parsed_pin": None})
        report = sut.verify_pins(self.repo, rows, audit_rows=audit)
        self.assertEqual([a["excel_row"] for a in audit], [7, 8, 9, 10, 11])
        self.assertEqual(report["quarantined_or_ambiguous_total"], 3)
        self.assertEqual(audit[0]["new_exact_path_blob_loc"], 3)
        self.assertEqual(audit[1]["repeated_exact_path_blob_loc"], 2)
        self.assertTrue(all(not a["nonblank_reviewed_loc"]
                            for a in audit[2:]))
        self.assertEqual(report["verified_nonblank_line_occurrences"], 5)

    def test_verified_checkpoint_membership_never_substitutes_legacy_density(self):
        (self.repo / "a.cs").write_text("one\\n\\ntwo\\nthree\\nfour\\n", encoding="utf-8")
        run(self.repo, "add", "a.cs")
        run(self.repo, "commit", "-qm", "new revision")
        newer = run(self.repo, "rev-parse", "HEAD")
        newer_blob = run(self.repo, "rev-parse", "HEAD:a.cs")
        checkpoint = {"head_sha": newer, "oldest_included_sha": newer,
                      "window_first_parent_commits": 1}
        audit = []
        report = sut.verify_pins(self.repo, [
            self.event(excel_row=7),
            self.event(excel_row=8, head=newer, blob=newer_blob, spans=[[5, 5]])
        ], checkpoint=checkpoint, audit_rows=audit)
        self.assertEqual(report["first_parent_checkpoint"]["status"],
                         "verified_first_parent_sha_membership")
        self.assertEqual([a["window_membership"] for a in audit],
                         ["not_on_first_parent_window", "in_window"])
        self.assertEqual(report["first_parent_checkpoint"]
                         ["verified_nonblank_exact_path_blob_unique_loc_subset"], 1)
        self.assertIsNone(report["historical_900_first_parent_density_recomputed"])

    def test_checkpoint_mismatch_leaves_membership_unknown_not_zero(self):
        checkpoint = {"head_sha": self.first_commit,
                      "oldest_included_sha": "0" * 40,
                      "window_first_parent_commits": 1}
        audit = []
        report = sut.verify_pins(self.repo, [self.event()],
                                 checkpoint=checkpoint, audit_rows=audit)
        self.assertEqual(report["first_parent_checkpoint"]["status"],
                         "checkpoint_anchor_mismatch")
        self.assertIsNone(report["first_parent_checkpoint"]
                          ["verified_nonblank_exact_path_blob_unique_loc_subset"])
        self.assertEqual(audit[0]["window_membership"], "membership_unverified")



if __name__ == "__main__":
    unittest.main()
