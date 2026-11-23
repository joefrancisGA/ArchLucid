import copy
import hashlib
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_validate_historical_pins import audited_rows_sha256
from aspects_verify_source_recovery_checkpoint import validate


class CandidateGoldenTests(unittest.TestCase):
    def setUp(self):
        self.cohort = {"head_sha": "a" * 40, "oldest_included_sha": "b" * 40,
                       "first_parent_commits": 900}
        self.pin_rows = [{"pin_status": "git_blob_and_nonblank_intervals_verified",
                          "window_membership": "in_window", "path": "src/review.py",
                          "blob": "1" * 40, "spans": [[1, 2]]}]
        self.candidates = [{"excel_row": 33, "review_id": "#33", "reviewed_master_sha": "c" * 40,
                            "window_membership": "in_900_first_parent_window",
                            "status": "git_source_at_review_commit_candidate_only", "original_blob_pinned": False,
                            "reviewed_loc_workbook_reported": 2, "candidate_nonblank_loc": 2,
                            "sources": [{"path": "src/review.py", "blob_derived_at_reviewed_commit": "1" * 40,
                                         "reported_inclusive_intervals": [[2, 3]],
                                         "nonblank_intervals_at_reviewed_commit": [[2, 3]],
                                         "nonblank_loc": 2, "original_blob_pinned": False}]}]
        self.pin_report = {"first_parent_checkpoint": {"head_sha": self.cohort["head_sha"],
                            "oldest_sha": self.cohort["oldest_included_sha"],
                            "first_parent_commits": 900}}
        self.candidate_report = {"first_parent_checkpoint": dict(self.pin_report["first_parent_checkpoint"])}
        self.golden = {"schema_version": 1, "confidence": "candidate_only_derived_at_reported_commit",
                       "cohort": self.cohort, "population": {"review_rows": 1, "unparsed_rows": 1},
                       "increments": {"recovered_review_rows": 1, "source_components": 1,
                           "candidate_line_occurrences": 2, "candidate_new_exact_identities": 1,
                           "candidate_repeated_line_occurrences": 1,
                           "candidate_exact_overlap_with_original_pins": 1,
                           "original_pin_denominator_increment": 0,
                           "new_distinct_defects_promoted": 0}}
        self.golden["rows"] = [{"excel_row": 33, "review_id": "#33", "reviewed_master_sha": "c" * 40,
                                "nonblank_loc": 2, "source_components": 1}]
        self.refresh_digests()

    def refresh_digests(self):
        self.pin_report["audited_rows_sha256"] = audited_rows_sha256(self.pin_rows)
        self.golden["population"]["pin_audit_rows_sha256"] = self.pin_report["audited_rows_sha256"]
        self.candidate_report["candidate_rows_sha256"] = audited_rows_sha256(self.candidates)
        self.golden["rows"][0]["source_sha256"] = hashlib.sha256(json.dumps(
            self.candidates[0]["sources"], ensure_ascii=False, sort_keys=True,
            separators=(",", ":")).encode("utf-8")).hexdigest()

    def verify(self):
        return validate(self.golden, self.pin_report, self.pin_rows,
                        self.candidate_report, self.candidates)

    def test_original_derived_candidate_overlap_preserves_provenance(self):
        self.assertEqual(self.verify()["increments"]["candidate_new_exact_identities"], 1)

    def test_tampered_derived_blob_is_rejected_even_with_updated_artifact_digest(self):
        self.candidates[0]["sources"][0]["blob_derived_at_reviewed_commit"] = "9" * 40
        self.candidate_report["candidate_rows_sha256"] = audited_rows_sha256(self.candidates)
        with self.assertRaisesRegex(ValueError, "golden drift"):
            self.verify()

    def test_wrong_cohort_rejected(self):
        self.candidate_report["first_parent_checkpoint"]["head_sha"] = "9" * 40
        with self.assertRaisesRegex(ValueError, "cohort drift"):
            self.verify()

    def test_missing_row_does_not_look_like_zero_defects(self):
        self.candidates.clear()
        with self.assertRaisesRegex(ValueError, "missing unpinned"):
            self.verify()

    def test_derived_cannot_claim_original_blob_pin(self):
        self.candidates[0]["original_blob_pinned"] = True
        self.candidate_report["candidate_rows_sha256"] = audited_rows_sha256(self.candidates)
        with self.assertRaisesRegex(ValueError, "identity or atomic count"):
            self.verify()

    def test_duplicate_golden_row_rejected(self):
        self.golden["rows"].append(copy.deepcopy(self.golden["rows"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate golden row"):
            self.verify()


if __name__ == "__main__":
    unittest.main()
