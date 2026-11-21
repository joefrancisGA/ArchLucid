import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / "aspects_review_evidence.py"
spec = importlib.util.spec_from_file_location("aspects_review_evidence", MODULE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

SHA1 = "a" * 40
SHA2 = "b" * 40


class EvidenceTests(unittest.TestCase):
    def test_rejects_reversed_and_invalid_spans(self):
        for bad in ("4-2", "0", "-1", "1-x", "1-3,5"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                mod.parse_spans([bad])

    def test_idempotent_record_and_interval_union(self):
        with tempfile.TemporaryDirectory() as tmp:
            ledger = Path(tmp) / "review.jsonl"
            row = {"baseline": SHA1, "blob": SHA2, "path": "src/a.cs",
                   "spans": ["1-4", "3-6"], "defect_id": "DEF-1"}
            self.assertTrue(mod.record(ledger, dict(row)))
            self.assertFalse(mod.record(ledger, dict(row)))
            second = dict(row, spans=["5-8"])
            self.assertTrue(mod.record(ledger, second))
            result = mod.coverage(mod.read_records(ledger), {SHA1})
            self.assertEqual(result["included_records"], 2)
            self.assertEqual(result["unique_path_blob_lines"], 8)
            self.assertEqual(result["confirmed_distinct_defects"], 1)
            self.assertEqual(result["provisional_density_per_kloc"], 125.0)

    def test_filters_by_first_parent_membership(self):
        rows = [{"baseline": SHA1, "blob": SHA2, "path": "src/a.cs",
                 "spans": [[1, 10]], "defect_id": "D1"},
                {"baseline": SHA2, "blob": SHA2, "path": "src/a.cs",
                 "spans": [[11, 20]], "defect_id": "D2"}]
        result = mod.coverage(rows, {SHA1})
        self.assertEqual(result["unique_path_blob_lines"], 10)
        self.assertEqual(result["confirmed_distinct_defects"], 1)


    def test_verified_observation_rejects_blank_and_out_of_range(self):
        with patch.object(mod, "git", side_effect=[SHA2, "first\\n\\nthird"]):
            with self.assertRaisesRegex(ValueError, "blank"):
                mod.verified_observation(".", SHA1, "src/a.cs", ["1-3"])
        with patch.object(mod, "git", side_effect=[SHA2, "first\\nsecond"]):
            with self.assertRaisesRegex(ValueError, "exceeds"):
                mod.verified_observation(".", SHA1, "src/a.cs", ["1-3"])

    def test_verified_observation_uses_actual_blob(self):
        with patch.object(mod, "git", side_effect=[SHA2, "first\\nsecond"]):
            row = mod.verified_observation(".", SHA1, "src/a.cs", ["1-2"], "D1")
        self.assertEqual(row["blob"], SHA2)
        self.assertEqual(row["spans"], ["1-2"])

    def test_first_parent_history_from_git(self):
        with patch.object(mod, "git", return_value=SHA1 + "\\n" + SHA2) as invoke:
            self.assertEqual(mod.verified_first_parent(".", SHA1, 2), {SHA1, SHA2})
            self.assertIn("--first-parent", invoke.call_args.args)

    def test_rejects_path_traversal(self):
        with self.assertRaises(ValueError):
            mod.normalize_path("../secret")


if __name__ == "__main__":
    unittest.main()
