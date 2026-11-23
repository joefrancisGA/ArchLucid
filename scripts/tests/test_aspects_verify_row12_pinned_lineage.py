"""Real-Git row12 source candidate lineage against exact reviewed pin spans."""
from __future__ import annotations

import copy
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import aspects_verify_row12_pinned_lineage as sut


def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(repo), *args], text=True).strip()


class Row12PinnedLineageTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.repo = Path(temporary.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.name", "Original Pin Auditor")
        git(self.repo, "config", "user.email", "row12@example.invalid")
        self.root = self.repo / "ArchLucid.Persistence" / "Connections"
        self.root.mkdir(parents=True)
        self.eligible = "ArchLucid.Persistence/Connections/ReadOnlyDbConnectionFactory.cs"
        self.files = [
            ("SqlConnectionFactory.cs", "a\n", 1),
            ("ScopedRoutingSqlConnectionFactory.cs", "b\nc\n", 2),
            ("DedicatedSystemSqlConnectionFactory.cs", "d\n", 1),
            ("ReadReplicaRoutedConnectionFactory.cs", "e\n", 1),
            ("ReadOnlyDbConnectionFactory.cs", "alpha\nunstable\nomega\n", 3),
        ]
        for name, text, _ in self.files:
            (self.root / name).write_text(text)
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "original candidate")
        first = git(self.repo, "rev-parse", "HEAD")
        self.candidate_sha = first
        (self.root / "ReadOnlyDbConnectionFactory.cs").write_text(
            "alpha\nmutated\nomega\n")
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "edit a source line")
        (self.root / "ReadOnlyDbConnectionFactory.cs").write_text(
            "alpha\nunstable\nomega\nnew\n")
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "restore text and append")
        pin_first = git(self.repo, "rev-parse", "HEAD")
        blob = git(self.repo, "rev-parse", "HEAD:" + self.eligible)
        git(self.repo, "commit", "--allow-empty", "-qm", "second pinned review SHA")
        pin_later = git(self.repo, "rev-parse", "HEAD")
        self.candidate_golden = {
            "excel_row": 12,
            "review_id": "#6624",
            "reviewed_master_sha": first,
            "original_blob_pinned": False,
            "candidate_nonblank_loc_expected": 8,
            "workbook_reported_nonblank_loc": 8,
            "sources": [
                {
                    "path": "ArchLucid.Persistence/Connections/" + name,
                    "blob_derived_at_reviewed_commit": git(
                        self.repo, "rev-parse",
                        first + ":ArchLucid.Persistence/Connections/" + name),
                    "reported_full_file_nonblank_loc": count,
                }
                for name, _, count in self.files
            ],
        }
        self.comparators = {
            "source_run_id": 1,
            "cohort": {
                "head_sha": pin_later, "oldest_sha": first,
                "first_parent_commits": 4,
            },
            "candidate_excel_row": 12,
            "candidate_review_id": "#6624",
            "candidate_reviewed_master_sha": first,
            "candidate_expected_nonblank_loc_same_path": 3,
            "candidate_expected_nonblank_loc_other_paths": 5,
            "original_pinned_review_rows": [
                {
                    "excel_row": 3821, "review_id": "old-pinned",
                    "reviewed_master_sha": pin_first,
                    "path": self.eligible, "blob": blob,
                    "spans": [[1, 3]], "nonblank_reviewed_loc": 3,
                },
                {
                    "excel_row": 4446, "review_id": "later-pinned",
                    "reviewed_master_sha": pin_later,
                    "path": self.eligible, "blob": blob,
                    "spans": [[1, 1], [3, 4]], "nonblank_reviewed_loc": 3,
                },
                {
                    "excel_row": 4471, "review_id": "later-second",
                    "reviewed_master_sha": pin_later,
                    "path": self.eligible, "blob": blob,
                    "spans": [[2, 2]], "nonblank_reviewed_loc": 1,
                },
            ],
        }

    def run_proof(self, candidate=None, pins=None):
        return sut.proof(self.repo, candidate or self.candidate_golden,
                         pins or self.comparators)

    def test_proves_only_stable_lines_through_edit_and_revert(self):
        result = self.run_proof()
        self.assertEqual(result["status"],
                         "row12_candidate_to_original_pins_first_parent_path_proof")
        self.assertEqual(result["candidate_git_derived_total_nonblank_line_occurrences"], 8)
        self.assertEqual(result["candidate_lines_on_path_with_original_pin"], 3)
        self.assertEqual(result["candidate_lines_on_paths_without_original_pin"], 5)
        self.assertEqual(result["original_pinned_review_rows_reverified"], 3)
        self.assertEqual(result["unique_original_pinned_review_commits"], 2)
        self.assertEqual(result["exact_same_blob_candidate_line_identities"], 0)
        self.assertEqual(result["all_first_parent_proven_repeat_candidate_lines"], 2)
        self.assertEqual(result["candidate_line_numbers_with_proven_continuity"], [1, 3])
        self.assertEqual(result["candidate_lines_on_shared_path_without_full_proof"], 1)
        self.assertEqual(result["candidate_lines_without_original_pinned_path"], 5)
        self.assertIsNone(result["new_comparable_900_density"])
        self.assertEqual(result["new_independently_verified_reviewed_loc"], 0)

    def test_each_original_review_pin_retains_own_actual_spans(self):
        result = self.run_proof()
        detail = {r["excel_row"]: r for r in result["original_pinned_review_details"]}
        self.assertEqual(detail[3821]["proven_candidate_line_numbers"], [1, 3])
        self.assertEqual(detail[4446]["proven_candidate_line_numbers"], [1, 3])
        self.assertEqual(detail[4471]["proven_candidate_line_numbers"], [])
        self.assertEqual(detail[4446]["original_reviewed_line_count"], 3)

    def test_modified_then_restored_line_not_proven_by_equal_endpoint_text(self):
        result = self.run_proof()
        self.assertNotIn(2, result["candidate_line_numbers_with_proven_continuity"])
        self.assertEqual(result["unresolved_path_comparison_rows"], 0)

    def test_candidate_blob_tampering_fails_closed(self):
        fake = copy.deepcopy(self.candidate_golden)
        fake["sources"][-1]["blob_derived_at_reviewed_commit"] = "f" * 40
        with self.assertRaisesRegex(ValueError, "candidate factory blob"):
            self.run_proof(candidate=fake)

    def test_original_pin_spans_must_be_nonblank_at_own_reviewed_commit(self):
        pins = copy.deepcopy(self.comparators)
        pins["original_pinned_review_rows"][0]["spans"] = [[50, 51]]
        with self.assertRaisesRegex(ValueError, "original pinned review spans"):
            self.run_proof(pins=pins)

    def test_duplicate_original_pin_row_is_rejected(self):
        pins = copy.deepcopy(self.comparators)
        pins["original_pinned_review_rows"][1]["excel_row"] = 3821
        with self.assertRaisesRegex(ValueError, "original pin review identity"):
            self.run_proof(pins=pins)

    def test_wrong_900_first_parent_oldest_anchor_is_rejected(self):
        pins = copy.deepcopy(self.comparators)
        pins["cohort"]["oldest_sha"] = "f" * 40
        with self.assertRaisesRegex(ValueError, "chain cannot be reproduced"):
            self.run_proof(pins=pins)

    def test_no_unverified_review_loc_promoted(self):
        result = self.run_proof()
        self.assertEqual(result["new_independently_verified_reviewed_loc"], 0)
        self.assertTrue(result["candidate_only_not_new_independently_reviewed_LOC"])
        self.assertEqual(result["new_distinct_defects"], 0)
        self.assertIsNone(result["new_comparable_900_density"])


if __name__ == "__main__":
    unittest.main()
