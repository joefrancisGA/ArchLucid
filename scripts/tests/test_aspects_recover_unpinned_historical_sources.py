"""Goldens for provenance-safe recovery of historical unpinned review candidates."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import aspects_recover_unpinned_historical_sources as sut


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()


class UnpinnedRecoveryTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.repo = Path(tmp.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.email", "aspects@example.invalid")
        git(self.repo, "config", "user.name", "Aspects")
        (self.repo / "src").mkdir()
        (self.repo / "src/a.cs").write_text("one\n\ntwo\n", encoding="utf-8")
        (self.repo / "src/b.cs").write_text("bee\n", encoding="utf-8")
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "first")
        self.head = git(self.repo, "rev-parse", "HEAD")
        self.checkpoint = {"head_sha": self.head,
                           "oldest_included_sha": self.head,
                           "window_first_parent_commits": 1}

    def row(self, excel, raw, loc, sha=None):
        return {"excel_row": excel, "review_id": f"review-{excel}",
                "reviewed_master_sha": sha or self.head,
                "parsed_pin": None, "reviewed_file_spans_raw": raw,
                "reviewed_loc_reported": loc, "defects_recorded": 0}

    def test_commit_derived_single_source_preserves_original_provenance(self):
        report, rows = sut.recover(self.repo, [
            self.row(247, "src/a.cs 1–3.", 2)], self.checkpoint)
        self.assertEqual(report["candidate_rows"], 1)
        self.assertEqual(report["candidate_line_occurrences"], 2)
        self.assertEqual(report["in_window_candidate_rows"], 1)
        self.assertIsNone(report["historical_900_density_recomputed"])
        self.assertFalse(report["included_in_verified_pin_denominator"])
        self.assertEqual(rows[0]["status"], "git_source_at_review_commit_candidate_only")
        self.assertFalse(rows[0]["original_blob_pinned"])
        self.assertEqual(rows[0]["sources"][0]["nonblank_intervals_at_reviewed_commit"],
                         [[1, 1], [3, 3]])
        self.assertEqual(rows[0]["sources"][0]["blob_derived_at_reviewed_commit"],
                         git(self.repo, "rev-parse", "HEAD:src/a.cs"))

    def test_clean_replay_is_separate_and_deduplicated_within_candidate_scope(self):
        report, rows = sut.recover(self.repo, [
            self.row(247, "src/a.cs 1–3.", 2),
            self.row(248, "src/a.cs 1–3.", 2)], self.checkpoint)
        self.assertEqual(report["candidate_rows"], 2)
        self.assertEqual(report["candidate_line_occurrences"], 4)
        self.assertEqual(report["candidate_new_exact_path_blob_loc"], 2)
        self.assertEqual(report["candidate_repeated_exact_path_blob_loc"], 2)
        self.assertEqual(rows[1]["candidate_repeated_exact_path_blob_loc"], 2)

    def test_missing_blob_not_guessed_from_basename_or_narrative(self):
        report, rows = sut.recover(self.repo, [
            self.row(7, "a.cs 1–3.", 2),
            self.row(8, "Reviewed spans (inclusive): a.cs 1–3.", 2),
            self.row(9, "src/a.cs [blob " + "f" * 40 + "] 1–3", 2),
            self.row(10, "src/../src/a.cs 1–3", 2)], self.checkpoint)
        self.assertEqual(report.get("candidate_rows", 0), 0)
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[2]["status"], "original_multi_blob_pins_deferred_to_main_audit")

    def test_complete_multi_file_recovery_is_atomic_and_checks_nonblank_total(self):
        good = self.row(300, "src/a.cs 1–3; src/b.cs 1–1", 3)
        report, audited = sut.recover(self.repo, [
            good,
            self.row(301, "src/a.cs 1–3; src/missing.cs 1–1", 3),
            self.row(302, "src/a.cs 1–3; src/b.cs 1–1", 4),
        ], self.checkpoint)
        self.assertEqual(report["candidate_rows"], 1)
        self.assertEqual(report["candidate_line_occurrences"], 3)
        self.assertEqual(audited[1]["status"], "commit_path_unavailable")
        self.assertEqual(audited[2]["status"], "workbook_nonblank_loc_mismatch")
        self.assertEqual(audited[1]["candidate_nonblank_loc"], 0)
        self.assertEqual(audited[2]["candidate_nonblank_loc"], 0)

    def test_unavailable_checkpoint_never_implies_window_membership(self):
        bad_checkpoint = {**self.checkpoint,
                          "oldest_included_sha": "f" * 40}
        report, rows = sut.recover(self.repo, [
            self.row(247, "src/a.cs 1–3.", 2)], bad_checkpoint)
        self.assertEqual(rows[0]["window_membership"], "unverified_anchor")
        self.assertEqual(report.get("in_window_candidate_rows", 0), 0)

    def test_window_rotation_excludes_old_commit_candidate(self):
        (self.repo / "src/b.cs").write_text("bee\nupdated\n", encoding="utf-8")
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "second")
        new_head = git(self.repo, "rev-parse", "HEAD")
        checkpoint = {"head_sha": new_head, "oldest_included_sha": new_head,
                      "window_first_parent_commits": 1}
        _, rows = sut.recover(self.repo, [
            self.row(247, "src/a.cs 1–3.", 2),
            self.row(248, "src/b.cs 1–2", 2, sha=new_head)], checkpoint)
        self.assertEqual(rows[0]["window_membership"],
                         "outside_900_first_parent_window")
        self.assertEqual(rows[1]["window_membership"],
                         "in_900_first_parent_window")


if __name__ == "__main__":
    unittest.main()
