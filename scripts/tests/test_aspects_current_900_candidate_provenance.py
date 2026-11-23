"""Current-window derived workbook source is a separate, provisional population."""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_density_snapshot import cohort_identity
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256
import aspects_current_900_candidate_provenance as sut


def git(repo, *args):
    return subprocess.check_output(
        ["git", "-C", str(repo), *args], text=True).strip()


class CandidateProvenanceTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.repo = Path(temp.name)
        git(self.repo, "init", "-q")
        git(self.repo, "config", "user.email", "candidate@example.invalid")
        git(self.repo, "config", "user.name", "Candidate")
        (self.repo / "src").mkdir()
        (self.repo / "src/a.cs").write_text("one\ntwo\nthree\n", encoding="utf-8")
        git(self.repo, "add", ".")
        git(self.repo, "commit", "-qm", "old")
        self.old = git(self.repo, "rev-parse", "HEAD")
        git(self.repo, "commit", "--allow-empty", "-qm", "current")
        self.head = git(self.repo, "rev-parse", "HEAD")
        self.blob = git(self.repo, "rev-parse", "HEAD:src/a.cs")

    def data(self):
        events = [
            {"excel_row": 7, "reviewed_master_sha": self.head,
             "review_id": "clean", "reviewed_loc_reported": 2,
             "defects_recorded": 0},
            {"excel_row": 8, "reviewed_master_sha": self.head,
             "review_id": "fix", "reviewed_loc_reported": 2,
             "defects_recorded": 1,
             "reviewed_file_spans_raw": "Reviewed spans (inclusive): src/a.cs 2-3",
             "parsed_pin": None},
        ]
        pins = [
            dict(events[0], pin_status=VERIFIED, window_membership="in_window",
                 path="src/a.cs", blob=self.blob, spans=[[1, 2]],
                 nonblank_reviewed_loc=2),
            dict(events[1], pin_status="not_parseable", window_membership="in_window"),
        ]
        audit = {"review_events_present": 2,
                 "audited_rows_sha256": audited_rows_sha256(pins)}
        candidates = [{
            "excel_row": 8, "review_id": "fix",
            "reviewed_master_sha": self.head,
            "window_membership": "in_900_first_parent_window",
            "original_blob_pinned": False,
            "reviewed_loc_workbook_reported": 2,
            "status": "git_source_at_review_commit_candidate_only",
            "candidate_nonblank_loc": 2,
            "sources": [{
                "path": "src/a.cs", "blob_derived_at_reviewed_commit": self.blob,
                "reported_inclusive_intervals": [[2, 3]],
                "nonblank_intervals_at_reviewed_commit": [[2, 3]],
                "nonblank_loc": 2,
            }],
        }]
        candidate_report = {
            "candidate_rows_sha256": audited_rows_sha256(candidates),
            "unparsed_historical_rows_examined": 1,
        }
        return (events, pins, audit, candidates, candidate_report,
                cohort_identity([self.head, self.old], self.head, 2))

    def run_audit(self, args=None):
        return sut.audit_current(self.repo, *(args or self.data()),
                                 expected_rows=2)

    def test_current_cohort_candidate_overlap_is_not_review_denominator(self):
        r = self.run_audit()
        self.assertEqual(r["status"], "current_master_900_derived_review_source_candidate_provenance")
        self.assertEqual(r["candidate_source_rows_reverified_git_in_current_cohort"], 1)
        self.assertEqual(r["candidate_positive_review_rows_in_current_cohort"], 1)
        self.assertEqual(r["candidate_line_occurrences_at_reported_review_shas"], 2)
        self.assertEqual(r["candidate_unique_exact_path_blob_line_identities"], 2)
        self.assertEqual(r["candidate_exact_overlap_with_original_pins"], 1)
        self.assertEqual(r["candidate_exact_identities_not_in_original_pins"], 1)
        self.assertEqual(r["candidate_rows_promoted_to_independent_original_blob_pins"], 0)
        self.assertEqual(r["newly_independently_verified_reviewed_loc"], 0)
        self.assertIsNone(r["new_comparable_900_density"])

    def test_clean_candidate_preserves_clean_review_without_defect_increment(self):
        args = self.data()
        args[0][1]["defects_recorded"] = 0
        r = self.run_audit(args)
        self.assertEqual(r["candidate_clean_review_rows_in_current_cohort"], 1)
        self.assertEqual(r["candidate_positive_review_rows_in_current_cohort"], 0)
        self.assertIsNone(r["newly_verified_distinct_defect_discoveries"])

    def test_window_rotation_excludes_candidate_outside_current_master(self):
        args = self.data()
        args[5] = cohort_identity([self.old], self.old, 1)
        r = self.run_audit(args)
        self.assertEqual(r["candidate_rows_outside_current_cohort"], 1)
        self.assertEqual(r["candidate_source_rows_reverified_git_in_current_cohort"], 0)
        self.assertEqual(r["candidate_unique_exact_path_blob_line_identities"], 0)

    def test_unparseable_current_candidate_is_not_eligible(self):
        args = self.data()
        args[3][0]["status"] = "unparseable_unpinned_source_reference"
        args[4]["candidate_rows_sha256"] = audited_rows_sha256(args[3])
        r = self.run_audit(args)
        self.assertEqual(r["candidate_rows_unresolved_in_current_cohort"], 1)
        self.assertEqual(r["candidate_source_rows_reverified_git_in_current_cohort"], 0)

    def test_edited_candidate_interval_digest_fails_closed(self):
        args = self.data()
        args[3][0]["sources"][0]["nonblank_intervals_at_review_commit"] = [[1, 2]]
        with self.assertRaisesRegex(ValueError, "SHA-bound Git recovery"):
            self.run_audit(args)

    def test_candidate_blob_at_review_commit_mismatch_is_rejected(self):
        args = self.data()
        args[3][0]["sources"][0]["blob_derived_at_reviewed_commit"] = "f" * 40
        args[4]["candidate_rows_sha256"] = audited_rows_sha256(args[3])
        with self.assertRaisesRegex(ValueError, "source blob disagrees"):
            self.run_audit(args)

    def test_incomplete_multisource_candidate_never_partially_counts(self):
        args = self.data()
        args[3][0]["sources"].append({
            "path": "src/missing.cs",
            "blob_derived_at_reviewed_commit": "a" * 40,
            "reported_inclusive_intervals": [[1, 1]],
            "nonblank_intervals_at_reviewed_commit": [[1, 1]],
            "nonblank_loc": 1,
        })
        args[4]["candidate_rows_sha256"] = audited_rows_sha256(args[3])
        with self.assertRaisesRegex(ValueError, "source paths/intervals differ"):
            self.run_audit(args)

    def test_duplicate_candidate_excel_id_quarantined(self):
        args = self.data()
        args[3].append(deepcopy(args[3][0]))
        args[4]["unparsed_historical_rows_examined"] = 2
        args[4]["candidate_rows_sha256"] = audited_rows_sha256(args[3])
        with self.assertRaisesRegex(ValueError, "duplicated"):
            self.run_audit(args)

    def test_workbook_observation_identity_cannot_change(self):
        args = self.data()
        args[3][0]["review_id"] = "pretend-new-discovery"
        args[4]["candidate_rows_sha256"] = audited_rows_sha256(args[3])
        with self.assertRaisesRegex(ValueError, "provenance identity mismatch"):
            self.run_audit(args)

    def test_candidate_scope_forgery_rejected_even_with_same_loc_and_rehashed_report(self):
        args = self.data()
        # Both line ranges exist in Git and each has two nonblank LOC, but
        # only 2-3 was reported in the original workbook observation.
        args[3][0]["sources"][0]["reported_inclusive_intervals"] = [[1, 2]]
        args[3][0]["sources"][0]["nonblank_intervals_at_reviewed_commit"] = [[1, 2]]
        args[4]["candidate_rows_sha256"] = audited_rows_sha256(args[3])
        with self.assertRaisesRegex(ValueError, "source paths/intervals differ"):
            self.run_audit(args)

    def test_substituted_nonblank_span_with_same_count_rejected(self):
        args = self.data()
        # A rehashed candidate may not substitute other nonblank source
        # lines while leaving the workbook's reported scope untouched.
        args[3][0]["sources"][0]["nonblank_intervals_at_reviewed_commit"] = [[1, 2]]
        args[4]["candidate_rows_sha256"] = audited_rows_sha256(args[3])
        with self.assertRaisesRegex(ValueError, "differ from original workbook/Git"):
            self.run_audit(args)

    def test_candidate_review_cannot_also_have_original_blob_pin(self):
        args = self.data()
        args[0][1]["parsed_pin"] = {
            "path": "src/a.cs", "blob": self.blob, "spans": [[2, 3]]}
        with self.assertRaisesRegex(ValueError, "conflicts with an original"):
            self.run_audit(args)

    def test_modified_workbook_raw_span_never_reinterprets_existing_candidate(self):
        args = self.data()
        args[0][1]["reviewed_file_spans_raw"] = (
            "Reviewed spans (inclusive): src/a.cs 1-2")
        with self.assertRaisesRegex(ValueError, "source paths/intervals differ"):
            self.run_audit(args)

    def test_current_cohort_digest_tamper_fails(self):
        args = self.data()
        args[5]["ordered_shas_sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "cohort/digest"):
            self.run_audit(args)


if __name__ == "__main__":
    unittest.main()
