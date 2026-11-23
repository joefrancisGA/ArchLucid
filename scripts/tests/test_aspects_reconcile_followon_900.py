"""Historical 900-cohort follow-on overlap must never splice all-history ledgers."""
from __future__ import annotations

import copy
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256
import aspects_reconcile_followon_900 as sut

NEWEST, OLDEST, OUTSIDE = "a" * 40, "b" * 40, "c" * 40
BLOB = "d" * 40
CHANGED_BLOB = "e" * 40


def fixture():
    pins = [
        {"excel_row": 7, "reviewed_master_sha": OLDEST,
         "window_membership": "in_window", "pin_status": VERIFIED,
         "defects_recorded": 0, "path": "src/a.cs", "blob": BLOB,
         "spans": [[1, 5]]},
        {"excel_row": 8, "reviewed_master_sha": NEWEST,
         "window_membership": "in_window", "pin_status": VERIFIED,
         "defects_recorded": 1, "path": "src/a.cs", "blob": BLOB,
         "spans": [[4, 6]]},
        {"excel_row": 9, "reviewed_master_sha": OUTSIDE,
         "window_membership": "not_on_first_parent_window",
         "pin_status": "unparseable", "defects_recorded": 0},
    ]
    report = {
        "review_events_present": 3,
        "audited_rows_sha256": audited_rows_sha256(pins),
        "first_parent_checkpoint": {
            "status": "verified_first_parent_sha_membership",
            "head_sha": NEWEST, "oldest_sha": OLDEST,
            "first_parent_commits": 2},
    }
    recent = [
        {"baseline": NEWEST, "verified": True, "path": "src/a.cs",
         "blob": BLOB, "spans": [[4, 8]], "defect_id": None},
        {"baseline": OLDEST, "verified": True, "path": "src/a.cs",
         "blob": BLOB, "spans": [[7, 8]], "defect_id": "D1"},
        {"baseline": OUTSIDE, "verified": True, "path": "src/a.cs",
         "blob": BLOB, "spans": [[1, 100]], "defect_id": "D2"},
    ]
    return pins, report, recent


class FollowOn900Tests(unittest.TestCase):
    def test_reconcile_exact_same_blob_only_with_baseline_in_historical_cohort(self):
        pins, report, recent = fixture()
        r = sut.reconcile(pins, report, recent, [NEWEST, OLDEST],
                          expected_rows=3)
        self.assertEqual(r["historical_rows_imported"], 3)
        self.assertEqual(r["original_pinned_review_rows_in_historical_cohort"], 2)
        self.assertEqual(r["original_pinned_clean_review_rows_in_historical_cohort"], 1)
        self.assertEqual(r["original_pinned_unique_exact_path_blob_lines"], 6)
        self.assertEqual(r["followon_git_verified_records_all_history"], 3)
        self.assertEqual(r["followon_records_with_baseline_outside_historical_cohort"], 1)
        self.assertEqual(r["followon_records_with_baseline_inside_historical_cohort"], 2)
        self.assertEqual(r["followon_unique_exact_path_blob_lines_in_historical_cohort"], 5)
        self.assertEqual(r["followon_exact_repeat_with_original_pins"], 3)
        self.assertEqual(r["followon_exact_identities_not_in_original_pins"], 2)
        self.assertEqual(r["followon_candidate_defect_ids_in_historical_cohort"], ["D1"])
        self.assertEqual(r["newly_verified_reviewed_loc_from_this_reconciliation"], 0)
        self.assertIsNone(r["merged_historical_and_followon_denominator"])
        self.assertIsNone(r["new_comparable_900_density"])

    def test_change_of_blob_is_not_treated_as_exact_overlap(self):
        pins, report, recent = fixture()
        recent[0]["blob"] = CHANGED_BLOB
        r = sut.reconcile(pins, report, recent, [NEWEST, OLDEST],
                          expected_rows=3)
        self.assertEqual(r["followon_exact_repeat_with_original_pins"], 0)
        self.assertEqual(r["followon_exact_identities_not_in_original_pins"], 7)
        self.assertTrue(r["followon_outside_pinned_lines_not_proven_cross_revision_new"])

    def test_clean_followon_adds_only_exact_candidates_and_no_numerator(self):
        pins, report, recent = fixture()
        recent = [recent[0]]
        r = sut.reconcile(pins, report, recent, [NEWEST, OLDEST],
                          expected_rows=3)
        self.assertEqual(r["followon_clean_records_in_historical_cohort"], 1)
        self.assertEqual(r["followon_candidate_defect_ids_in_historical_cohort"], [])
        self.assertIsNone(r["new_verified_distinct_defects"])

    def test_missing_zero_defect_original_row_blocks(self):
        pins, report, recent = fixture()
        del pins[0]
        with self.assertRaisesRegex(ValueError, "historical pin audit"):
            sut.reconcile(pins, report, recent, [NEWEST, OLDEST], expected_rows=3)

    def test_tampered_pin_span_blocks(self):
        pins, report, recent = fixture()
        pins[0]["spans"] = [[1, 4]]
        with self.assertRaisesRegex(ValueError, "historical pin audit"):
            sut.reconcile(pins, report, recent, [NEWEST, OLDEST], expected_rows=3)

    def test_membership_drift_blocks(self):
        pins, report, recent = fixture()
        pins[0]["window_membership"] = "not_on_first_parent_window"
        report["audited_rows_sha256"] = audited_rows_sha256(pins)
        with self.assertRaisesRegex(ValueError, "membership drift"):
            sut.reconcile(pins, report, recent, [NEWEST, OLDEST], expected_rows=3)

    def test_changed_first_parent_chain_blocks(self):
        pins, report, recent = fixture()
        with self.assertRaisesRegex(ValueError, "anchors differ"):
            sut.reconcile(pins, report, recent, [OLDEST, NEWEST], expected_rows=3)

    def test_false_verified_followon_flag_is_rejected(self):
        pins, report, recent = fixture()
        recent[0]["verified"] = False
        with self.assertRaisesRegex(ValueError, "independently Git-verified"):
            sut.reconcile(pins, report, recent, [NEWEST, OLDEST], expected_rows=3)

    @patch.object(sut, "git")
    def test_git_anchor_revalidation_rejects_missing_parent(self, git):
        pins, report, _ = fixture()
        git.return_value = (True, (NEWEST + "\n").encode())
        with self.assertRaisesRegex(ValueError, "chain differs"):
            sut.checked_historical_chain(Path("."), report)

    @patch.object(sut, "git")
    def test_git_anchor_revalidation_accepts_exact_chain(self, git):
        _, report, _ = fixture()
        git.return_value = (True, (NEWEST + "\n" + OLDEST + "\n").encode())
        self.assertEqual(sut.checked_historical_chain(Path("."), report),
                         [NEWEST, OLDEST])


if __name__ == "__main__":
    unittest.main()
