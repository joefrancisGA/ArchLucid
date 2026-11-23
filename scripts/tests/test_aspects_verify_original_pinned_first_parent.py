"""Original workbook-pinned source-line lineage proof, never a density estimate."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256
import aspects_verify_original_pinned_first_parent as sut


def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(repo), *args],
                                   text=True).strip()


class OriginalPinnedFirstParentTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.repo = Path(temp.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.name", "Fixture")
        git(self.repo, "config", "user.email", "test@example.invalid")
        self.add("alpha\nbeta\n", "old")
        self.old, self.old_blob = git(self.repo, "rev-parse", "HEAD"), git(self.repo, "rev-parse", "HEAD:a.cs")
        self.add("alpha\nbeta\ngamma\n", "new")
        self.new, self.new_blob = git(self.repo, "rev-parse", "HEAD"), git(self.repo, "rev-parse", "HEAD:a.cs")

    def add(self, source: str, label: str):
        (self.repo / "a.cs").write_text(source, encoding="utf-8")
        git(self.repo, "add", "a.cs")
        git(self.repo, "commit", "-qm", label)

    def fixture(self, old_span=None, new_span=None, old_blob=None, newer=None):
        new_sha, new_blob = newer or (self.new, self.new_blob)
        rows = [
            {"excel_row": 7, "reviewed_master_sha": self.old,
             "pin_status": VERIFIED, "window_membership": "in_window",
             "path": "a.cs", "blob": old_blob or self.old_blob,
             "spans": old_span or [[1, 2]], "nonblank_reviewed_loc": 2},
            {"excel_row": 8, "reviewed_master_sha": new_sha,
             "pin_status": VERIFIED, "window_membership": "in_window",
             "path": "a.cs", "blob": new_blob,
             "spans": new_span or [[1, 1], [3, 3]], "nonblank_reviewed_loc": 2},
        ]
        history = git(self.repo, "rev-list", "--first-parent", new_sha).splitlines()
        report = {
            "review_events_present": 2,
            "audited_rows_sha256": audited_rows_sha256(rows),
            "first_parent_checkpoint": {
                "status": "verified_first_parent_sha_membership",
                "head_sha": new_sha,
                "oldest_sha": self.old,
                "first_parent_commits": len(history),
                "verified_nonblank_exact_path_blob_unique_loc_subset": 4,
            },
        }
        return rows, report

    def test_proves_unchanged_line_without_treating_it_as_new_review(self):
        rows, report = self.fixture()
        result = sut.reconcile(self.repo, rows, report, expected_records=2)
        self.assertEqual(result["status"], "partial_original_pinned_first_parent_lineage_proved")
        self.assertEqual(result["original_pinned_unique_exact_path_blob_lines_in_window"], 4)
        self.assertEqual(result["original_pinned_line_occurrences_in_window"], 4)
        self.assertEqual(result["proven_first_parent_mapped_repeated_exact_source_identities"], 1)
        self.assertEqual(result["proven_first_parent_connected_source_components"], 3)
        self.assertEqual(result["revision_pairs_checked_full_first_parent"], 1)
        self.assertEqual(result["revision_pairs_unresolved"], 0)
        self.assertEqual(result["new_independently_reviewed_loc"], 0)
        self.assertIsNone(result["new_comparable_900_density"])

    def test_middle_edit_and_revert_does_not_prove_restored_line(self):
        # Original beta was modified in an intervening first-parent commit,
        # then text was restored alongside new source. Endpoint text equality
        # is not a valid identity proof for beta.
        self.add("alpha\nchanged\ngamma\n", "intermediate-modification")
        self.add("alpha\nbeta\ngamma\ndelta\n", "restored-with-extra")
        current, blob = git(self.repo, "rev-parse", "HEAD"), git(self.repo, "rev-parse", "HEAD:a.cs")
        rows, report = self.fixture(old_span=[[1, 2]], new_span=[[1, 2]],
                                    newer=(current, blob))
        output = sut.reconcile(self.repo, rows, report, expected_records=2)
        self.assertEqual(output["proven_first_parent_mapped_repeated_exact_source_identities"], 1)
        self.assertEqual(output["first_parent_edges_between_checked_original_revisions"], 3)

    def test_two_identical_review_events_only_add_occurrences(self):
        rows, report = self.fixture()
        rows.append(dict(rows[0], excel_row=9))
        report["review_events_present"] = 3
        report["audited_rows_sha256"] = audited_rows_sha256(rows)
        output = sut.reconcile(self.repo, rows, report, expected_records=3)
        self.assertEqual(output["original_pinned_line_occurrences_in_window"], 6)
        self.assertEqual(output["original_pinned_unique_exact_path_blob_lines_in_window"], 4)
        self.assertEqual(output["same_blob_repeated_occurrences_in_window"], 2)
        self.assertEqual(output["proven_first_parent_mapped_repeated_exact_source_identities"], 1)

    def test_changed_audit_span_fails_before_inventing_lineage(self):
        rows, report = self.fixture()
        rows[0]["spans"] = [[1, 1]]
        with self.assertRaisesRegex(ValueError, "missing, repeated, or altered"):
            sut.reconcile(self.repo, rows, report, expected_records=2)

    def test_pinned_unique_checkpoint_is_enforced(self):
        rows, report = self.fixture()
        report["first_parent_checkpoint"]["verified_nonblank_exact_path_blob_unique_loc_subset"] = 5
        with self.assertRaisesRegex(ValueError, "differ from audited"):
            sut.reconcile(self.repo, rows, report, expected_records=2)

    def test_chain_anchor_mismatch_fails_closed(self):
        rows, report = self.fixture()
        report["first_parent_checkpoint"]["oldest_sha"] = "f" * 40
        with self.assertRaisesRegex(ValueError, "chain is missing or mismatched"):
            sut.reconcile(self.repo, rows, report, expected_records=2)

    def test_quadratic_large_file_cap_preserves_unique_prefix(self):
        rows, report = self.fixture()
        output = sut.reconcile(self.repo, rows, report, expected_records=2,
                               max_blob_lines=1)
        self.assertEqual(output["revision_pairs_unresolved"], 0)
        self.assertEqual(output["proven_first_parent_mapped_repeated_exact_source_identities"], 1)


if __name__ == "__main__":
    unittest.main()
