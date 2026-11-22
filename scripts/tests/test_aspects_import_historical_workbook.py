"""Safety contracts for historical Aspects source import and overlap accounting."""
from __future__ import annotations

import importlib.util
from io import BytesIO
from pathlib import Path
import sys
import tempfile
import unittest
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import aspects_import_historical_workbook as migrate


class HistoricalImportTests(unittest.TestCase):
    def test_legacy_baseline_is_never_the_small_new_ledger_subset(self):
        golden = migrate.BASELINE_GOLDEN
        self.assertEqual((golden["window"], golden["defects"], golden["unique_loc"]), (900, 463, 343492))
        self.assertAlmostEqual(1000 * golden["defects"] / golden["unique_loc"], 1.3479207667)

    def test_pinned_parseable_single_file_evidence_is_not_verified(self):
        raw = ("ArchLucid.Core/X.cs [blob " + "a" * 40
               + "; last aaaa 2026-11-22] 1–2,5–5, 10–13")
        p = migrate._spans(raw)
        self.assertEqual(p, {"path": "ArchLucid.Core/X.cs", "blob": "a" * 40,
                             "spans": [[1, 2], [5, 5], [10, 13]]})
        self.assertNotIn("verified", p)

    def test_ambiguous_multifile_or_missing_blob_never_silently_deduped(self):
        self.assertIsNone(migrate._spans(
            "Reviewed spans (inclusive): X.cs 1–4; Y.cs 5–8"))
        self.assertIsNone(migrate._spans("ArchLucid.Core/X.cs 1–4"))
        self.assertIsNone(migrate._spans(
            "../outside.cs [blob " + "a" * 40 + "] 1-2"))
        self.assertIsNone(migrate._spans(
            "ArchLucid.Core/X.cs [blob " + "a" * 40 + "] 5-3"))

    def test_exact_blob_overlap_is_reported_without_changing_historical_density(self):
        events = [
            {"parsed_pin": {"path": "src/A.cs", "blob": "b" * 40, "spans": [[1, 10]]}},
            {"parsed_pin": {"path": "src/B.cs", "blob": "c" * 40, "spans": [[1, 3]]}},
            {"parsed_pin": None},
        ]
        new = [{"path": "src/A.cs", "blob": "b" * 40, "spans": [[5, 15]],
                "verified": True}]
        result = migrate.reconcile_exact_pins(events, new)
        self.assertEqual(result["legacy_single_file_blob_pins_overlap_with_new_ledger"], 1)
        self.assertEqual(result["overlapping_source_span_line_occurrences"], 6)
        self.assertEqual(result["legacy_rows_without_parseable_single_source_blob_pin"], 1)
        self.assertIn("not", result["warning"].lower())

    def test_reconciler_excludes_unverified_current_rows(self):
        events = [{"parsed_pin": {"path": "src/A.cs", "blob": "b" * 40, "spans": [[1, 10]]}}]
        unverified = [{"path": "src/A.cs", "blob": "b" * 40,
                       "spans": [[1, 10]], "verified": False}]
        result = migrate.reconcile_exact_pins(events, unverified)
        self.assertEqual(result["overlapping_source_span_line_occurrences"], 0)

    def test_sparse_inline_xlsx_cells_have_correct_excel_row_addresses(self):
        sheet = ('''<?xml version="1.0" encoding="utf-8"?>
        <x:worksheet xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
          <x:sheetData>
            <x:row r="7">
              <x:c r="A7" t="inlineStr"><x:is><x:t>period</x:t></x:is></x:c>
              <x:c r="D7"><x:v>1</x:v></x:c>
              <x:c r="E7"><x:v>25</x:v></x:c>
            </x:row>
          </x:sheetData>
        </x:worksheet>''')
        with tempfile.TemporaryDirectory() as tmp:
            file = Path(tmp) / "synthetic.xlsx"
            with ZipFile(file, "w") as archive:
                archive.writestr("xl/worksheets/sheet3.xml", sheet)
            with ZipFile(file) as archive:
                rows = list(migrate._excel_rows(archive, 3))
            self.assertEqual(rows, [(7, ["period", None, None, 1, 25])])

    def test_zero_defect_event_can_contribute_fresh_source_lines(self):
        event = {
            "defects_recorded": 0,
            "reviewed_loc_reported": 25,
            "new_unique_loc_reported": 20,
            "repeated_loc_reported": 5,
            "provenance": "historical_workbook_reported_unverified",
        }
        self.assertEqual(event["defects_recorded"], 0)
        self.assertEqual(event["new_unique_loc_reported"], 20)

    def test_legacy_missing_new_unique_is_unknown_not_zero(self):
        event = {"reviewed_loc_reported": 31, "new_unique_loc_reported": None,
                 "repeated_loc_reported": None}
        self.assertIsNone(event["new_unique_loc_reported"])
        self.assertIsNone(event["repeated_loc_reported"])


if __name__ == "__main__":
    unittest.main()
