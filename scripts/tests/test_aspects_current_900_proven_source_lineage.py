"""Goldens for current master-base source lineage, not whole-codebase density."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_density_snapshot import cohort_identity
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256
import aspects_current_900_proven_source_lineage as sut


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args],
                                   text=True).strip()


class Current900LineageTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.repo = Path(tmp.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.email", "aspects@example.invalid")
        git(self.repo, "config", "user.name", "Aspects")
        self.commit("stable\nreplaced\n", "old")
        self.old = git(self.repo, "rev-parse", "HEAD")
        self.old_blob = git(self.repo, "rev-parse", "HEAD:a.cs")
        self.commit("stable\nmutated\n", "changed-middle")
        self.mid = git(self.repo, "rev-parse", "HEAD")
        self.commit("stable\nreplaced\nnew\n", "restored-and-appended")
        self.new = git(self.repo, "rev-parse", "HEAD")
        self.new_blob = git(self.repo, "rev-parse", "HEAD:a.cs")

    def commit(self, source, message):
        (self.repo / "a.cs").write_text(source, encoding="utf-8")
        git(self.repo, "add", "a.cs")
        git(self.repo, "commit", "-qm", message)

    def inputs(self, current=None, recent=None):
        pin = {
            "excel_row": 7, "reviewed_master_sha": self.old,
            "pin_status": VERIFIED, "window_membership": "in_window",
            "path": "a.cs", "blob": self.old_blob,
            "spans": [[1, 2]], "nonblank_reviewed_loc": 2,
        }
        pins = [pin]
        audit = {"review_events_present": 1,
                 "audited_rows_sha256": audited_rows_sha256(pins)}
        latest = {"baseline": self.new, "path": "a.cs",
                  "blob": self.new_blob, "spans": [[1, 3]],
                  "verified": True, "defect_id": None}
        recent = recent if recent is not None else [latest]
        cohort = cohort_identity(current or [self.new, self.mid, self.old],
                                 (current or [self.new, self.mid, self.old])[0],
                                 len(current or [self.new, self.mid, self.old]))
        observed = set()
        old_count = 0
        new_count = 0
        eligible_old = self.old in cohort["ordered_shas"]
        for row in pins:
            if row["reviewed_master_sha"] in cohort["ordered_shas"]:
                old_count += 2
                observed.update((row["path"], row["blob"], i) for i in (1, 2))
        in_recent = 0
        excluded = 0
        for row in recent:
            if row["baseline"] not in cohort["ordered_shas"]:
                excluded += 1
                continue
            in_recent += 1
            new_count += sum(b - a + 1 for a, b in row["spans"])
            observed.update((row["path"], row["blob"], i)
                            for a, b in row["spans"] for i in range(a, b + 1))
        exact = {
            "status": "partial_current_master_base_900_exact_pin_and_followon_reconciliation",
            "cohort": cohort,
            "original_historical_events_total": 1,
            "original_git_pinned_rows_eligible_in_current_900": int(eligible_old),
            "original_git_pinned_line_occurrences_current_900": old_count,
            "followon_records_in_current_master_900": in_recent,
            "followon_records_outside_current_master_900": excluded,
            "followon_line_occurrences_current_900": new_count,
            "combined_exact_path_blob_line_union_only": len(observed),
        }
        return pins, audit, recent, cohort, exact

    def prove(self, params=None):
        return sut.prove(self.repo, *(params or self.inputs()), expected_records=1)

    def test_intervening_change_and_revert_only_preserves_stable_line(self):
        o = self.prove()
        self.assertEqual(o["status"],
                         "partial_current_900_first_parent_reviewed_source_continuity")
        self.assertEqual(o["exact_path_blob_line_union_only"], 5)
        self.assertEqual(o["unique_commit_path_line_nodes"], 5)
        self.assertEqual(o["git_proven_continuous_cross_revision_repeat_links"], 1)
        self.assertEqual(o["git_proven_continuous_source_line_components_subset_only"], 4)
        self.assertEqual(o["reviewed_adjacent_source_commit_pairs_checked"], 1)
        self.assertEqual(o["first_parent_edges_between_checked_source_revisions"], 2)
        self.assertEqual(o["new_independently_reviewed_loc"], 0)
        self.assertIsNone(o["new_comparable_900_density"])

    def test_duplicate_clean_review_only_increases_occurrences(self):
        params = self.inputs(recent=[
            {"baseline": self.new, "path": "a.cs", "blob": self.new_blob,
             "spans": [[1, 3]], "verified": True, "defect_id": None},
            {"baseline": self.new, "path": "a.cs", "blob": self.new_blob,
             "spans": [[1, 3]], "verified": True, "defect_id": None},
        ])
        o = self.prove(params)
        self.assertEqual(o["followon_line_occurrences"], 6)
        self.assertEqual(o["exact_path_blob_line_union_only"], 5)
        self.assertEqual(o["git_proven_continuous_cross_revision_repeat_links"], 1)
        self.assertEqual(o["repeated_line_occurrences_within_reviewed_commit"], 3)

    def test_identical_endpoint_blob_after_reversion_is_not_automatic_lineage(self):
        self.commit("stable\nreplaced\n", "full revert to old blob")
        latest = git(self.repo, "rev-parse", "HEAD")
        blob = git(self.repo, "rev-parse", "HEAD:a.cs")
        self.assertEqual(blob, self.old_blob)
        recent = [{
            "baseline": latest, "path": "a.cs", "blob": blob,
            "spans": [[1, 2]], "verified": True, "defect_id": None,
        }]
        params = self.inputs(current=[latest, self.new, self.mid, self.old],
                             recent=recent)
        o = self.prove(params)
        self.assertEqual(o["exact_path_blob_line_union_only"], 2)
        self.assertEqual(o["unique_commit_path_line_nodes"], 4)
        self.assertEqual(o["git_proven_continuous_cross_revision_repeat_links"], 1)
        self.assertIsNone(o["full_900_reviewed_loc_denominator"])

    def test_current_window_rotation_excludes_expired_old_review(self):
        p = self.inputs(current=[self.new, self.mid])
        o = self.prove(p)
        self.assertEqual(o["original_pinned_review_rows_in_current_window"], 0)
        self.assertEqual(o["followon_reviews_in_current_window"], 1)
        self.assertEqual(o["exact_path_blob_line_union_only"], 3)
        self.assertEqual(o["git_proven_continuous_cross_revision_repeat_links"], 0)

    def test_tampered_source_pin_digest_fails(self):
        p = self.inputs()
        p[0][0]["spans"] = [[1, 1]]
        with self.assertRaisesRegex(ValueError, "audit"):
            self.prove(p)

    def test_recent_blob_must_match_real_git_commit_tree(self):
        p = self.inputs()
        p[2][0]["blob"] = self.old_blob
        with self.assertRaisesRegex(ValueError, "follow-on source blob"):
            self.prove(p)

    def test_exact_cohort_digest_mismatch_never_counts_coverage(self):
        p = self.inputs()
        p[4]["cohort"] = dict(p[3], ordered_shas_sha256="0" * 64)
        with self.assertRaisesRegex(ValueError, "different cohort"):
            self.prove(p)

    def test_exact_population_total_mismatch_fails_closed(self):
        p = self.inputs()
        p[4]["combined_exact_path_blob_line_union_only"] = 999
        with self.assertRaisesRegex(ValueError, "not identical"):
            self.prove(p)


if __name__ == "__main__":
    unittest.main()
