"""Regression coverage for Git-staged Aspects historical review corpus."""
from __future__ import annotations

import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
import aspects_validate_historical_corpus as sut

CORPUS = ROOT / "docs" / "engineering" / "aspects-historical"


class HistoricalCorpusTests(unittest.TestCase):
    def test_all_review_events_and_partial_900_window_are_recovered(self):
        report = sut.verify(CORPUS)
        self.assertEqual(report["observations_imported"], 5741)
        self.assertEqual(report["zero_defect_observations"], 4864)
        self.assertEqual(report["defect_observations_not_distinct"], 877)
        self.assertEqual(report["all_history_known_incremental_loc_sum_not_unique_git_union"], 402314)
        self.assertEqual(report["known_repeated_loc"], 40019)
        self.assertEqual(report["missing_incremental_loc_observations"], 30)
        self.assertEqual(report["parsed_unverified_source_pins"], 4511)
        window = report["legacy_900_first_parent"]
        self.assertEqual((window["defects"], window["reviewed_loc"]), (463, 343492))
        self.assertAlmostEqual(window["rate_per_kloc"], 1.3479207667136353)
        self.assertLess(window["signed_change_per_kloc"], 0)
        self.assertNotIn("source_verified", window["status"])
        self.assertEqual(report["trends"]["700"]["status"], "provisional_not_git_window")

    def test_missing_shard_is_rejected_instead_of_underreporting_clean_reviews(self):
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "review-events"
            source.mkdir()
            # All 24 real files required, not just one defect-containing shard.
            with self.assertRaisesRegex(ValueError, "Expected 24 historical data chunks"):
                sut.verify(Path(temp))

    def test_replayed_or_missing_source_row_is_rejected_by_strict_ordering(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp)
            shutil.copytree(CORPUS, target / "import")
            first_shard = target / "import" / "review-events" / "0000-0239.jsonl"
            rows = first_shard.read_text(encoding="utf-8").splitlines()
            original = json.loads(rows[1])
            original["excel_row"] = 7   # duplicate first Excel row
            rows[1] = json.dumps(original, ensure_ascii=False, sort_keys=True)
            first_shard.write_text("\n".join(rows) + "\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Missing/replayed Excel row"):
                sut.verify(target / "import")

    def test_tampered_clean_review_is_rejected_even_without_defect_change(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp)
            shutil.copytree(CORPUS, target / "import")
            first_shard = target / "import" / "review-events" / "0000-0239.jsonl"
            rows = first_shard.read_text(encoding="utf-8").splitlines()
            index = next(i for i, s in enumerate(rows) if json.loads(s)["defects_recorded"] == 0)
            row = json.loads(rows[index])
            row["source_reference"] = "mutated-source"
            rows[index] = json.dumps(row, ensure_ascii=False, sort_keys=True)
            first_shard.write_text("\n".join(rows) + "\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Canonical historical corpus SHA256 mismatch"):
                sut.verify(target / "import")

    def test_nonexistent_corpus_is_not_silently_replaced_with_narrow_new_ledger(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ValueError, "Expected 24 historical data chunks"):
                sut.verify(Path(temp))


if __name__ == "__main__":
    unittest.main()
