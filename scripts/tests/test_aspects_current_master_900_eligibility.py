"""Current master-base rolling-window source-pin accounting must fail closed."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_density_snapshot import cohort_identity
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256
import aspects_current_master_900_eligibility as sut

HEAD, MID, OLD = "a" * 40, "b" * 40, "c" * 40
OLD_BLOB, SHARED_BLOB, NEW_BLOB = "d" * 40, "e" * 40, "f" * 40


def fixture():
    original = [
        {"excel_row": 7, "reviewed_master_sha": OLD, "review_id": "old-clean", "defects_recorded": 0},
        {"excel_row": 8, "reviewed_master_sha": MID, "review_id": "#123", "defects_recorded": 1},
        {"excel_row": 9, "reviewed_master_sha": HEAD, "review_id": "new-clean", "defects_recorded": 0},
    ]
    pins = [
        dict(original[0], window_membership="in_window", pin_status=VERIFIED,
             path="src/a.cs", blob=OLD_BLOB, spans=[[1, 4]], nonblank_reviewed_loc=4),
        dict(original[1], window_membership="in_window", pin_status=VERIFIED,
             path="src/a.cs", blob=SHARED_BLOB, spans=[[1, 3]], nonblank_reviewed_loc=3),
        dict(original[2], window_membership="not_on_first_parent_window", pin_status=VERIFIED,
             path="src/a.cs", blob=SHARED_BLOB, spans=[[3, 4]], nonblank_reviewed_loc=2),
    ]
    report = {"review_events_present": 3, "audited_rows_sha256": audited_rows_sha256(pins)}
    ledger = [
        {"baseline": HEAD, "path": "src/b.cs", "blob": NEW_BLOB, "spans": [[1, 4]],
         "verified": True, "defect_id": "D1"},
        {"baseline": MID, "path": "src/a.cs", "blob": SHARED_BLOB, "spans": [[2, 4]],
         "verified": True, "defect_id": None},
        {"baseline": MID, "path": "src/a.cs", "blob": SHARED_BLOB, "spans": [[2, 2]],
         "verified": True, "defect_id": None},
        {"baseline": OLD, "path": "src/a.cs", "blob": OLD_BLOB, "spans": [[1, 4]],
         "verified": True, "defect_id": "OLD"},
    ]
    return original, pins, report, ledger, cohort_identity([HEAD, MID], HEAD, 2)


class MasterBaseWindowTests(unittest.TestCase):
    def calculate(self, mutate=None):
        args = fixture()
        if mutate:
            mutate(*args)
        with patch.object(sut, "verified_observation",
                          side_effect=lambda repo, baseline, path, spans, defect_id: {
                              "blob": NEW_BLOB if path == "src/b.cs" else SHARED_BLOB
                          }) as verified:
            output = sut.reconcile(Path("."), *args, expected_rows=3)
            self.assertEqual(verified.call_count,
                             len([r for r in args[3] if r["baseline"] in {HEAD, MID}]))
        return output

    def test_rotated_out_history_not_included_and_new_clean_review_eligible(self):
        o = self.calculate()
        self.assertEqual(o["original_events_in_current_master_900"], 2)
        self.assertEqual(o["original_clean_events_in_current_master_900"], 1)
        self.assertEqual(o["original_git_pinned_unique_exact_path_blob_lines_current_900"], 4)
        self.assertEqual(o["original_same_blob_repeat_occurrences_current_900"], 1)
        self.assertEqual(o["followon_records_in_current_master_900"], 3)
        self.assertEqual(o["followon_records_outside_current_master_900"], 1)
        self.assertEqual(o["followon_line_occurrences_current_900"], 8)
        self.assertEqual(o["followon_unique_exact_path_blob_lines_current_900"], 7)
        self.assertEqual(o["followon_same_blob_repeat_occurrences_current_900"], 1)
        self.assertEqual(o["followon_exact_path_blob_line_overlap_with_original_pins"], 3)
        self.assertEqual(o["followon_exact_unmatched_path_blob_line_identities"], 4)
        self.assertEqual(o["combined_exact_path_blob_line_union_only"], 8)
        self.assertEqual(o["followon_candidate_defect_ids_in_window"], ["D1"])
        self.assertIsNone(o["distinct_defect_discoveries_verified"])
        self.assertIsNone(o["full_cross_revision_unique_reviewed_loc"])
        self.assertIsNone(o["new_comparable_900_density"])

    def test_duplicate_clean_review_increases_occurrences_not_unique_loc(self):
        def duplicate(*items):
            items[3].append(dict(items[3][1]))
        o = self.calculate(duplicate)
        self.assertEqual(o["followon_line_occurrences_current_900"], 11)
        self.assertEqual(o["followon_unique_exact_path_blob_lines_current_900"], 7)
        self.assertEqual(o["followon_same_blob_repeat_occurrences_current_900"], 4)

    def test_original_audit_tampering_blocks_import_replay(self):
        args = fixture()
        args[1][0]["spans"] = [[1, 1]]
        with self.assertRaisesRegex(ValueError, "corrupted rows"):
            sut.reconcile(Path("."), *args, expected_rows=3)

    def test_cohort_digest_tampering_blocks_publication(self):
        args = fixture()
        args[4]["ordered_shas_sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "sequence/digest mismatch"):
            sut.reconcile(Path("."), *args, expected_rows=3)

    def test_forged_original_event_identity_rejected(self):
        args = fixture()
        args[0][2]["review_id"] = "forged"
        with self.assertRaisesRegex(ValueError, "event identity"):
            sut.reconcile(Path("."), *args, expected_rows=3)

    def test_current_git_blob_mismatch_rejected(self):
        args = fixture()
        with patch.object(sut, "verified_observation", return_value={"blob": OLD_BLOB}):
            with self.assertRaisesRegex(ValueError, "path/blob changed"):
                sut.reconcile(Path("."), *args, expected_rows=3)

    def test_unverified_in_window_followon_must_fail_closed(self):
        args = fixture()
        args[3][0]["verified"] = False
        with self.assertRaisesRegex(ValueError, "unverified follow-on"):
            sut.reconcile(Path("."), *args, expected_rows=3)

    def test_git_rebuild_requires_full_first_parent_chain(self):
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)
            def git(*args):
                return subprocess.check_output(
                    ["git", "-C", str(repo), *args], text=True).strip()
            git("init", "-q")
            git("config", "user.name", "Test")
            git("config", "user.email", "test@example.invalid")
            commits = []
            for n in range(3):
                (repo / "x.txt").write_text(str(n))
                git("add", "x.txt")
                git("commit", "-qm", f"event-{n}")
                commits.append(git("rev-parse", "HEAD"))
            result = sut.reconstruct_cohort(repo, commits[-1], 3)
            self.assertEqual(result["head_sha"], commits[-1])
            self.assertEqual(result["oldest_included_sha"], commits[0])
            with self.assertRaisesRegex(ValueError, "incomplete"):
                sut.reconstruct_cohort(repo, commits[-1], 4)


if __name__ == "__main__":
    unittest.main()
