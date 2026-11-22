"""Prove Aspects density is fresh only when verified evidence actually changes."""
import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location("aspects_density_snapshot", ROOT / "aspects_density_snapshot.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

HEAD = "a" * 40
PREV = "b" * 40
OLD = "c" * 40
BLOB = "d" * 40


def observation(defect, path="src/a.cs", spans=None, baseline=PREV, verified=True):
    return {
        "baseline": baseline,
        "blob": BLOB,
        "path": path,
        "spans": spans or [[1, 100]],
        "defect_id": defect,
        "verified": verified,
    }


class DensitySnapshotTests(unittest.TestCase):
    def test_first_snapshot_has_no_invented_prior_or_signed_delta(self):
        row = observation("D1")
        result = mod.build_snapshot([row], {HEAD, PREV}, HEAD, 900)
        self.assertEqual(result["status"], "source_verified_subset")
        self.assertEqual(result["freshness"], "no_prior_snapshot")
        self.assertEqual(result["density"]["defects_per_kloc"], 10.0)
        self.assertIsNone(result["density"]["previous_comparable"])
        self.assertIsNone(result["density"]["signed_delta"])

    def test_no_new_evidence_is_explicitly_stale_even_when_head_changes(self):
        row = observation("D1")
        before = mod.build_snapshot([row], {PREV}, PREV, 900)
        after = mod.build_snapshot([row], {HEAD, PREV}, HEAD, 900, before)
        self.assertEqual(after["freshness"], "stale_no_new_verified_evidence")
        self.assertEqual(after["review"]["new_observations_since_prior"], 0)
        self.assertEqual(after["density"]["signed_delta"], 0.0)
        self.assertEqual(after["density"]["previous_comparable"], 10.0)

    def test_new_defect_and_lines_generate_fresh_snapshot_and_signed_delta(self):
        first = observation("D1")
        baseline = mod.build_snapshot([first], {PREV}, PREV, 900)
        second = observation("D2", path="src/b.cs", spans=[[1, 50]])
        update = mod.build_snapshot([first, second], {HEAD, PREV}, HEAD, 900, baseline)
        self.assertEqual(update["freshness"], "new_verified_evidence")
        self.assertEqual(update["review"]["new_defects_since_prior"], 1)
        self.assertEqual(update["review"]["new_files_since_prior"], 1)
        self.assertEqual(update["review"]["new_observations_since_prior"], 1)
        self.assertEqual(update["density"]["unique_path_blob_reviewed_lines"], 150)
        self.assertEqual(update["density"]["defects_per_kloc"], 13.333333)
        self.assertEqual(update["density"]["signed_delta"], 3.333333)

    def test_overlapping_spans_same_blob_are_not_double_counted(self):
        rows = [observation("D1", spans=[[1, 10]]),
                observation("D2", spans=[[5, 15]]),
                observation("D2", spans=[[5, 15]])]
        result = mod.build_snapshot(rows, {HEAD, PREV}, HEAD, 900)
        self.assertEqual(result["density"]["distinct_confirmed_defects"], 2)
        self.assertEqual(result["review"]["distinct_verified_observations"], 2)
        self.assertEqual(result["density"]["unique_path_blob_reviewed_lines"], 15)

    def test_unverified_and_outside_first_parent_window_excluded(self):
        result = mod.build_snapshot([
            observation("D1", verified=False),
            observation("D2", baseline=OLD),
        ], {HEAD, PREV}, HEAD, 900)
        self.assertEqual(result["status"], "unavailable")
        self.assertIsNone(result["density"]["defects_per_kloc"])
        self.assertEqual(result["review"]["unverified_rows_excluded"], 1)

    def test_prior_window_or_method_mismatch_prohibits_comparison(self):
        first = mod.build_snapshot([observation("D1")], {PREV}, PREV, 800)
        after = mod.build_snapshot([observation("D1")], {HEAD, PREV}, HEAD, 900, first)
        self.assertEqual(after["freshness"], "prior_not_comparable")
        self.assertIsNone(after["density"]["signed_delta"])

    def test_changed_history_membership_does_not_masquerade_as_new_review(self):
        first = mod.build_snapshot([observation("D1", baseline=OLD)],
                                   {PREV, OLD}, PREV, 900)
        current = mod.build_snapshot([observation("D1", baseline=OLD)],
                                     {HEAD, PREV}, HEAD, 900, first)
        self.assertEqual(current["freshness"], "rolling_window_membership_changed")
        self.assertIsNone(current["density"]["signed_delta"])

    def test_revalidate_rejects_false_verified_flag_when_git_blob_differs(self):
        with patch.object(mod, "verified_observation", return_value={"blob": HEAD}):
            with self.assertRaisesRegex(ValueError, "Pinned source blob mismatch"):
                mod.revalidate_rows(Path("."), [observation("D1")], {PREV})

    def test_revalidate_does_not_promote_candidates(self):
        with patch.object(mod, "verified_observation") as validate:
            result = mod.revalidate_rows(Path("."), [observation("D1", verified=False)], {PREV})
        self.assertEqual(result, [])
        validate.assert_not_called()

    def test_duplicate_recorded_rows_do_not_change_fingerprint(self):
        item = observation("D1")
        one = mod.build_snapshot([item], {PREV}, PREV, 900)
        repeated = mod.build_snapshot([item, item], {HEAD, PREV}, HEAD, 900, one)
        self.assertEqual(repeated["freshness"], "stale_no_new_verified_evidence")

    def test_snapshot_is_explicitly_not_comparable_to_legacy_spreadsheet(self):
        report = mod.markdown(mod.build_snapshot([observation("D1")], {PREV}, PREV, 900))
        self.assertIn("Not comparable to the historical 1.3479", report)
        self.assertIn("no_prior_snapshot", report)


if __name__ == "__main__":
    unittest.main()
