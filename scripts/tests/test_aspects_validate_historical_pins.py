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


    def test_complete_multifile_blob_pins_are_verified_atomically(self):
        (self.repo / "src").mkdir()
        (self.repo / "src/a.cs").write_text("red\nblue\n", encoding="utf-8")
        (self.repo / "src/b.cs").write_text("green\nyellow\n", encoding="utf-8")
        run(self.repo, "add", "src")
        run(self.repo, "commit", "-qm", "two sources")
        commit = run(self.repo, "rev-parse", "HEAD")
        blob_a = run(self.repo, "rev-parse", "HEAD:src/a.cs")
        blob_b = run(self.repo, "rev-parse", "HEAD:src/b.cs")
        raw = (f"src/a.cs [blob {blob_a}; last ignored] 1–2; "
               f"src/b.cs [blob {blob_b}; last ignored] 1–2")
        row = {**self.event(head=commit), "parsed_pin": None,
               "reviewed_file_spans_raw": raw, "reviewed_loc_reported": 4}
        pins = sut.source_pins(row)
        self.assertEqual(len(pins), 2)
        audit = []
        report = sut.verify_pins(self.repo, [
            {**row, "excel_row": 7},
            {**row, "excel_row": 8}
        ], audit_rows=audit)
        self.assertEqual(report["candidate_pin_count"], 2)
        self.assertEqual(report["verified_pin_rows"], 2)
        self.assertEqual(report["verified_unique_exact_path_blob_lines"], 4)
        self.assertEqual(report["verified_repeated_exact_path_blob_lines"], 4)
        self.assertEqual(report["verified_nonblank_line_occurrences"], 8)
        self.assertEqual(len(audit[0]["pinned_sources"]), 2)
        self.assertEqual(audit[1]["repeated_exact_path_blob_loc"], 4)
        # No partial credit: an incorrect blob poisons the entire event.
        bad = row.copy()
        bad["reviewed_file_spans_raw"] = raw.replace(blob_b, "f" * 40)
        result = sut.verify_pins(self.repo, [bad])
        self.assertEqual(result["verified_pin_rows"], 0)
        self.assertEqual(result["quarantined_or_ambiguous_total"], 1)
        self.assertEqual(result["verified_unique_exact_path_blob_lines"], 0)
        # All individual Git pins are valid, but the workbook total can be
        # wrong or incomplete. In that case the whole review is quarantined.
        wrong_total = {**row, "reviewed_loc_reported": 3}
        mismatch = sut.verify_pins(self.repo, [wrong_total])
        self.assertEqual(mismatch["verified_pin_rows"], 0)
        self.assertEqual(mismatch["verified_nonblank_line_occurrences"], 0)
        self.assertEqual(mismatch["classifications"]["multisource_reported_loc_mismatch"], 1)
        missing_total = {**row}
        del missing_total["reviewed_loc_reported"]
        missing = sut.verify_pins(self.repo, [missing_total])
        self.assertEqual(missing["verified_pin_rows"], 0)
        self.assertEqual(missing["classifications"]["multisource_reported_loc_mismatch"], 1)

    def test_real_imported_multifile_rows_have_complete_parsed_source_goldens(self):
        # These rows come from the immutable, checksum-validated 5,741-row
        # historical import, not a synthetic or invented observation series.
        corpus = (Path(__file__).resolve().parents[2] /
                  "docs/engineering/aspects-historical/review-events/1200-1439.jsonl")
        import json
        rows = {row["excel_row"]: row for row in
                (json.loads(line) for line in corpus.read_text(encoding="utf-8").splitlines())}
        for excel_row, file_count, reported_loc in (
                (1250, 8, 822), (1252, 14, 528), (1255, 12, 2343)):
            with self.subTest(excel_row=excel_row):
                row = rows[excel_row]
                self.assertIsNone(row["parsed_pin"])
                self.assertEqual(row["reviewed_loc_reported"], reported_loc)
                sources = sut.source_pins(row)
                self.assertEqual(len(sources), file_count)
                self.assertEqual(
                    sum(sum(end - start + 1 for start, end in pin["spans"])
                        for pin in sources), reported_loc)
                self.assertEqual(len({pin["path"] for pin in sources}), file_count)

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
        (self.repo / "a.cs").write_text("one\n\ntwo\nthree\nfour\n", encoding="utf-8")
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


    def test_audit_digest_is_canonical_and_detects_changed_rows(self):
        first = [{"excel_row": 7, "path": "a.cs", "spans": [[1, 1]]}]
        reordered = [{"spans": [[1, 1]], "path": "a.cs", "excel_row": 7}]
        self.assertEqual(sut.audited_rows_sha256(first),
                         sut.audited_rows_sha256(reordered))
        modified = [{"excel_row": 7, "path": "a.cs", "spans": [[3, 3]]}]
        self.assertNotEqual(sut.audited_rows_sha256(first),
                            sut.audited_rows_sha256(modified))


if __name__ == "__main__":
    unittest.main()
