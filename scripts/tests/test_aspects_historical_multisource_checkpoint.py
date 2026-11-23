"""Regression golden for three independently Git-checked workbook multi-file reviews.

This is a source-identity/interval audit, not a distinct defect or density audit.
Each referenced blob must still exist at the workbook's reviewed commit and all
reported nonblank spans must agree with the immutable workbook import.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_validate_historical_pins import VERIFIED, inspect_pin, source_pins

ROOT = Path(__file__).resolve().parents[2]
SHARD = ROOT / "docs/engineering/aspects-historical/review-events/1200-1439.jsonl"
CHECKPOINT = ROOT / ("docs/engineering/aspects-historical/audit-checkpoints/"
                     "2026-11-22-github-multisource-34.json")


class HistoricalMultisourceCheckpointTests(unittest.TestCase):
    def test_every_checked_source_blob_and_nonblank_interval_remains_valid(self):
        manifest = json.loads(CHECKPOINT.read_text(encoding="utf-8"))
        imported = {
            row["excel_row"]: row
            for row in (json.loads(x) for x in SHARD.read_text(
                encoding="utf-8").splitlines() if x.strip())
        }
        self.assertEqual(manifest["schema_version"], 1)
        self.assertEqual(len(manifest["rows"]), 3)
        self.assertEqual([r["excel_row"] for r in manifest["rows"]],
                         [1250, 1252, 1255])
        self.assertFalse(manifest["comparable_density_updated"])
        source_cache = {}
        line_cache = {}
        source_count = occurrence_count = 0
        identities = set()
        for historical in manifest["rows"]:
            row = imported[historical["excel_row"]]
            self.assertEqual(row["reviewed_master_sha"],
                             historical["reviewed_master_sha"])
            self.assertEqual(row["reviewed_loc_reported"],
                             historical["reviewed_loc_reported"])
            pins = source_pins(row)
            self.assertEqual(len(pins), len(historical["sources"]))
            row_total = 0
            for pin, checked in zip(pins, historical["sources"]):
                self.assertEqual((pin["path"], pin["blob"]),
                                 (checked["path"], checked["blob_sha"]))
                status, nonblank = inspect_pin(
                    ROOT, {**row, "parsed_pin": pin}, source_cache, line_cache)
                self.assertEqual(status, VERIFIED, pin["path"])
                self.assertEqual(len(nonblank), checked["nonblank_loc_checked"])
                row_total += len(nonblank)
                source_count += 1
                # Ensure any repeats between the checkpoint's three reviews
                # are counted only once at the exact same path and blob.
                for line in nonblank:
                    identities.add((pin["path"], pin["blob"], line))
            self.assertEqual(row_total,
                             historical["independently_git_verified_nonblank_occurrences"])
            self.assertEqual(row_total, row["reviewed_loc_reported"])
            occurrence_count += row_total
        self.assertEqual(source_count, manifest["checked_source_count"])
        self.assertEqual(occurrence_count,
                         manifest["checked_source_line_occurrences"])
        self.assertEqual(occurrence_count - len(identities),
                         manifest["exact_path_blob_line_repeats_within_these_3_rows"])
        self.assertEqual(source_count, 34)
        self.assertEqual(occurrence_count, 3693)


if __name__ == "__main__":
    unittest.main()
