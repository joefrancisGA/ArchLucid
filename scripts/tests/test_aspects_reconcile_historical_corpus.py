"""Exact-blob comparison must never fabricate historical/new combined density."""
from __future__ import annotations

from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import aspects_reconcile_historical_corpus as sut


class ReconcileHistoricalCorpusTests(unittest.TestCase):
    def test_identical_path_blob_intervals_are_deduplicated(self):
        legacy = [
            {"parsed_pin": {"path": "src/a.cs", "blob": "a" * 40, "spans": [[1, 10]]}},
            {"parsed_pin": {"path": "src/a.cs", "blob": "a" * 40, "spans": [[6, 15]]}},
            {"parsed_pin": None},
        ]
        recent = [
            {"path": "src/a.cs", "blob": "a" * 40, "spans": [[5, 12]], "defect_id": "D1"},
            {"path": "src/a.cs", "blob": "a" * 40, "spans": [[10, 20]], "defect_id": "D1"},
        ]
        r = sut.compare_exact_source(legacy, recent)
        self.assertEqual(r["legacy_source_pins_parseable_not_git_verified"], 2)
        self.assertEqual(r["legacy_source_scopes_unparsed"], 1)
        self.assertEqual(r["new_git_verified_unique_path_blob_lines"], 16)
        self.assertEqual(r["identical_path_blob_line_overlap"], 11)
        self.assertEqual(r["new_verified_lines_outside_parseable_same_blob_history"], 5)
        self.assertEqual(r["new_git_verified_defect_ids"], 1)
        self.assertIsNone(r["legacy_plus_recent_combined_density_per_kloc"])

    def test_different_blob_same_path_is_unresolved_not_automatically_new(self):
        legacy = [{"parsed_pin": {"path": "src/a.cs", "blob": "a" * 40, "spans": [[1, 100]]}}]
        recent = [{"path": "src/a.cs", "blob": "b" * 40, "spans": [[1, 100]], "defect_id": None}]
        r = sut.compare_exact_source(legacy, recent)
        self.assertEqual(r["new_path_blob_keys_absent_from_parseable_history"], 1)
        self.assertEqual(r["identical_path_blob_line_overlap"], 0)
        self.assertTrue(r["new_verified_lines_outside_history_are_not_confirmed_lineage_unique"])

    def test_zero_defect_clean_review_remains_eligible_as_historical_coverage(self):
        legacy = [{"parsed_pin": {"path": "src/a.cs", "blob": "a" * 40, "spans": [[3, 8]]},
                   "defects_recorded": 0}]
        recent = [{"path": "src/a.cs", "blob": "a" * 40, "spans": [[4, 5]], "defect_id": "D1"}]
        r = sut.compare_exact_source(legacy, recent)
        self.assertEqual(r["identical_path_blob_line_overlap"], 2)
        self.assertEqual(r["new_verified_lines_outside_parseable_same_blob_history"], 0)

    @patch.object(sut, "verified_observation")
    def test_unverified_new_evidence_is_ignored(self, patched):
        rows = [{"verified": False, "path": "src/a.cs", "spans": [[1, 2]]}]
        self.assertEqual(sut.verify_recent(Path("."), rows), [])
        patched.assert_not_called()

    @patch.object(sut, "verified_observation")
    def test_mismatching_new_blob_is_rejected(self, patched):
        patched.return_value = {"blob": "b" * 40}
        row = {"verified": True, "baseline": "c" * 40, "blob": "a" * 40,
               "path": "src/a.cs", "spans": [[1, 5]], "defect_id": "D1"}
        with self.assertRaisesRegex(ValueError, "blob changed"):
            sut.verify_recent(Path("."), [row])


if __name__ == "__main__":
    unittest.main()
