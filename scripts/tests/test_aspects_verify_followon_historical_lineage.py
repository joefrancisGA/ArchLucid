"""Fail-closed original-pin vs follow-on cross-blob identity proofs."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256
import aspects_verify_followon_historical_lineage as sut


def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(repo), *args],
                                   text=True).strip()


class FollowonCrossRevisionTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.repo = Path(temp.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.name", "Test")
        git(self.repo, "config", "user.email", "test@example.invalid")
        self.commit("stable\nrestore\n", "old")
        self.old = git(self.repo, "rev-parse", "HEAD")
        self.old_blob = git(self.repo, "rev-parse", "HEAD:src/a.cs")
        self.commit("stable\nchanged\n", "intermediate")
        self.commit("stable\nrestore\nadded\n", "new")
        self.head = git(self.repo, "rev-parse", "HEAD")
        self.new_blob = git(self.repo, "rev-parse", "HEAD:src/a.cs")

    def commit(self, source, label):
        (self.repo / "src").mkdir(exist_ok=True)
        (self.repo / "src/a.cs").write_text(source)
        git(self.repo, "add", "src/a.cs")
        git(self.repo, "commit", "-qm", label)

    def fixture(self):
        pins = [{
            "excel_row": 7, "reviewed_master_sha": self.old,
            "window_membership": "in_window", "pin_status": VERIFIED,
            "path": "src/a.cs", "blob": self.old_blob,
            "spans": [[1, 2]], "nonblank_reviewed_loc": 2,
        }]
        report = {
            "review_events_present": 1,
            "audited_rows_sha256": audited_rows_sha256(pins),
            "first_parent_checkpoint": {
                "status": "verified_first_parent_sha_membership",
                "head_sha": self.head, "oldest_sha": self.old,
                "first_parent_commits": 3,
            },
        }
        newer = {
            "baseline": self.head, "path": "src/a.cs",
            "blob": self.new_blob, "spans": [[1, 3]],
            "verified": True, "defect_id": None,
        }
        return pins, report, [newer]

    def test_intervening_edit_then_revert_proves_only_stable_line(self):
        pins, report, records = self.fixture()
        o = sut.reconcile(self.repo, pins, report, records, expected_rows=1)
        self.assertEqual(o["status"], "partial_historical_followon_cross_blob_first_parent_proof")
        self.assertEqual(o["followon_exact_overlap_line_identities"], 0)
        self.assertEqual(o["followon_exact_unmatched_line_identities"], 3)
        self.assertEqual(o["followon_cross_blob_proven_repeat_identities"], 1)
        self.assertEqual(o["followon_exact_unmatched_without_proven_lineage"], 2)
        self.assertEqual(o["cross_blob_revision_pairs_checked"], 1)
        self.assertEqual(o["new_independently_reviewed_loc"], 0)
        self.assertIsNone(o["new_comparable_900_density"])

    def test_repeat_clean_record_never_inflates_unique_source_identities(self):
        pins, report, records = self.fixture()
        records.append(dict(records[0]))
        o = sut.reconcile(self.repo, pins, report, records, expected_rows=1)
        self.assertEqual(o["followon_records_in_historical_cohort"], 2)
        self.assertEqual(o["followon_exact_unmatched_line_identities"], 3)
        self.assertEqual(o["followon_cross_blob_proven_repeat_identities"], 1)

    def test_exact_same_blob_lines_separate_from_cross_revision(self):
        pins, report, records = self.fixture()
        records.append({
            "baseline": self.old, "path": "src/a.cs",
            "blob": self.old_blob, "spans": [[1, 2]],
            "verified": True, "defect_id": None,
        })
        o = sut.reconcile(self.repo, pins, report, records, expected_rows=1)
        self.assertEqual(o["followon_exact_overlap_line_identities"], 2)
        self.assertEqual(o["followon_cross_blob_proven_repeat_identities"], 1)
        self.assertEqual(o["followon_exact_unmatched_line_identities"], 3)

    def test_outside_cohort_is_excluded_from_lineage(self):
        pins, report, records = self.fixture()
        records.append({
            "baseline": "f" * 40, "path": "src/a.cs",
            "blob": "f" * 40, "spans": [[1, 5]],
            "verified": True,
        })
        o = sut.reconcile(self.repo, pins, report, records, expected_rows=1)
        self.assertEqual(o["followon_records_outside_historical_cohort"], 1)
        self.assertEqual(o["followon_exact_unmatched_line_identities"], 3)

    def test_wrong_review_commit_blob_fails_closed(self):
        pins, report, records = self.fixture()
        records[0]["blob"] = self.old_blob
        with self.assertRaisesRegex(ValueError, "follow-on blob mismatch"):
            sut.reconcile(self.repo, pins, report, records, expected_rows=1)

    def test_missing_historical_audit_row_fails_closed(self):
        pins, report, records = self.fixture()
        with self.assertRaisesRegex(ValueError, "historical Git pin audit"):
            sut.reconcile(self.repo, [], report, records, expected_rows=1)

    def test_missing_historical_first_parent_sha_blocks(self):
        pins, report, records = self.fixture()
        report["first_parent_checkpoint"]["oldest_sha"] = "f" * 40
        with self.assertRaisesRegex(ValueError, "could not be reproduced"):
            sut.reconcile(self.repo, pins, report, records, expected_rows=1)


if __name__ == "__main__":
    unittest.main()
