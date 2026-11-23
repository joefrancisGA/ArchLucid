"""Goldens for discovery-ID reconciliation independent of fixing-PR state."""
from __future__ import annotations

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import aspects_reconcile_historical_defect_ids as sut
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256


class HistoricalDefectIdTests(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {"excel_row": 7, "review_id": "ASPECTS-ONE",
             "defects_recorded": 1, "reviewed_master_sha": "a" * 40,
             "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/123",
             "historical_status": "Confirmed · PR #123 open",
             "parsed_pin": {"path": "src/a.cs"}},
            {"excel_row": 8, "review_id": "Aspects-clean",
             "defects_recorded": 0, "reviewed_master_sha": "a" * 40,
             "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/123",
             "historical_status": "no confirmed defect"},
            {"excel_row": 9, "review_id": "ASPECTS-ONE",
             "defects_recorded": 1, "reviewed_master_sha": "a" * 40,
             "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/124",
             "historical_status": "Confirmed · PR #124 open"},
        ]
        self.audit = [
            {"excel_row": n, "reviewed_master_sha": "a" * 40,
             "pin_status": VERIFIED,
             "window_membership": "in_window"} for n in (7, 8, 9)
        ]
        self.pin_report = {
            "audited_rows_sha256": audited_rows_sha256(self.audit),
            "first_parent_checkpoint": {
                "status": "verified_first_parent_sha_membership",
                "head_sha": "a" * 40,
                "oldest_sha": "b" * 40,
            },
        }
        self.pr_statuses = {
            "repository": "joefrancisGA/ArchLucid",
            "checked_at_utc": "2026-11-23T00:00:00Z",
            "pr_states": [
                {"number": 123, "state": "closed", "merged": True,
                 "merged_at": "2026-11-22T14:00:00Z",
                 "status_verified_at_utc": "2026-11-23T00:00:00Z",
                 "fix_pr_url": "https://github.com/joefrancisGA/ArchLucid/pull/123"},
            ],
        }

    def calculate(self):
        return sut.reconcile(
            self.rows, self.audit, self.pin_report,
            [{"defect_id": "ASPECTS-ONE", "verified": True}],
            self.pr_statuses, expected_count=3, expected_first_excel_row=7)

    def test_duplicate_discovery_id_is_one_candidate_not_two_defects(self):
        report, row_audits = self.calculate()
        self.assertEqual(report["positive_rows"], 2)
        self.assertEqual(report["unique_named_discovery_id_candidates"], 1)
        self.assertEqual(report["repeated_named_discovery_id_candidates"], 1)
        self.assertEqual(report["positive_rows_in_anchored_900_first_parent"], 2)
        self.assertEqual(report["exact_candidate_id_also_in_narrow_ledger_rows"], 2)
        self.assertEqual(len(row_audits), 2)
        self.assertIsNone(report["historical_463_distinct_defects_recomputed"])
        self.assertIsNone(report["fresh_comparable_900_density"])

    def test_merged_pr_overrides_stale_open_label_without_new_defect(self):
        report, rows = self.calculate()
        self.assertEqual(report["github_fix_pr_state_verified_rows"], 1)
        self.assertEqual(report["historical_open_labels_now_verified_merged"], 1)
        self.assertEqual(rows[0]["fix_state"], "merged")
        self.assertEqual(rows[1]["fix_state"], "not_independently_checked")
        self.assertIsNone(rows[1]["fix_state_checked_at_utc"])
        self.assertEqual(report["unique_named_discovery_id_candidates"], 1)

    def test_missing_pr_status_is_unknown_not_historically_open(self):
        _, rows = self.calculate()
        self.assertEqual(rows[1]["fix_pr_number"], 124)
        self.assertEqual(rows[1]["fix_state"], "not_independently_checked")

    def test_conflicting_original_pr_refs_are_not_guessed(self):
        self.rows[0]["historical_status"] = "Confirmed · PR #999 open"
        _, rows = self.calculate()
        self.assertEqual(rows[0]["fix_pr_reference_confidence"],
                         "conflicting_original_fix_pr_references")
        self.assertEqual(rows[0]["fix_state"], "not_independently_checked")
        self.assertIsNone(rows[0]["fix_pr_number"])

    def test_closed_unmerged_and_open_are_not_labeled_fixed(self):
        self.pr_statuses["pr_states"] = [
            {"number": n, "state": state, "merged": False,
             "status_verified_at_utc": "2026-11-23T00:00:00Z",
             "fix_pr_url": f"https://github.com/joefrancisGA/ArchLucid/pull/{n}"}
            for n, state in ((123, "closed"), (124, "open"))
        ]
        _, rows = self.calculate()
        self.assertEqual([r["fix_state"] for r in rows],
                         ["closed_unmerged", "open"])

    def test_digest_mismatch_blocks_reconciliation(self):
        self.audit[0]["window_membership"] = "not_on_first_parent_window"
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            self.calculate()

    def test_missing_historical_review_row_blocks_reconciliation(self):
        self.rows.pop()
        with self.assertRaisesRegex(ValueError, "Incomplete"):
            self.calculate()

    def test_bad_pr_metadata_blocks_reconciliation(self):
        self.pr_statuses["pr_states"][0]["state"] = "open"
        with self.assertRaisesRegex(ValueError, "Malformed"):
            self.calculate()

    def test_clean_review_never_creates_discovery_or_fix_observation(self):
        self.rows[0]["defects_recorded"] = 0
        self.rows[2]["defects_recorded"] = 0
        report, events = self.calculate()
        self.assertEqual(report["positive_rows"], 0)
        self.assertEqual(report["unique_named_discovery_id_candidates"], 0)
        self.assertEqual(events, [])


if __name__ == "__main__":
    unittest.main()
