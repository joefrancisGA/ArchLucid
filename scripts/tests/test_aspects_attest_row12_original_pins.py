"""Fail-closed provenance tests for three reviewed original-pin comparator rows."""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256
import aspects_attest_row12_original_pins as sut

PATH = "ArchLucid.Persistence/Connections/ReadOnlyDbConnectionFactory.cs"
BLOB = "c" * 40
SHA1, SHA2 = "a" * 40, "b" * 40
COHORT = {
    "head_sha": SHA2, "oldest_sha": SHA1, "first_parent_commits": 900,
}
STATUS = "git_blob_and_nonblank_intervals_subset_only_cross_revision_unresolved"


def evidence():
    pins = [
        {
            "excel_row":3821, "review_id":"review-3821",
            "reviewed_master_sha":SHA1, "path":PATH, "blob":BLOB,
            "spans":[[1,9]], "nonblank_reviewed_loc":9,
            "pin_status":VERIFIED, "window_membership":"in_window",
        },
        {
            "excel_row":4446, "review_id":"review-4446",
            "reviewed_master_sha":SHA2, "path":PATH, "blob":BLOB,
            "spans":[[10,73]], "nonblank_reviewed_loc":64,
            "pin_status":VERIFIED, "window_membership":"in_window",
        },
        {
            "excel_row":4471, "review_id":"review-4471",
            "reviewed_master_sha":SHA2, "path":PATH, "blob":BLOB,
            "spans":[[74,74]], "nonblank_reviewed_loc":1,
            "pin_status":VERIFIED, "window_membership":"in_window",
        },
    ]
    digest=audited_rows_sha256(pins)
    report={
        "status":STATUS, "review_events_present":3,
        "audited_rows_sha256":digest,
        "first_parent_checkpoint":{"status":"verified_first_parent_sha_membership",**COHORT},
    }
    comparator={
        "cohort":dict(COHORT),
        "source_pin_rows_sha256":digest,
        "source_run_id":45160219395,
        "source_artifact_id":14812729056,
        "original_pinned_review_rows":[
            {key:r[key] for key in (
                "excel_row","review_id","reviewed_master_sha",
                "path","blob","spans","nonblank_reviewed_loc"
            )}
            for r in pins
        ],
    }
    return pins,report,comparator


class OriginalPinProvenanceTests(unittest.TestCase):
    def test_three_exact_reviewed_spans_match_prior_audit(self):
        r=sut.attest(*evidence(),expected_rows=3)
        self.assertEqual(r["status"],"row12_original_pin_comparator_evidence_attested")
        self.assertEqual(r["original_pinned_review_rows_attested"],3)
        self.assertEqual(r["original_reviewed_source_line_occurrences"],74)
        self.assertEqual(r["original_unique_exact_path_blob_reviewed_lines"],74)
        self.assertEqual(r["prior_successful_source_run_id"],45160219395)
        self.assertTrue(r["candidate_row12_source_is_not_original_blob_pinned"])
        self.assertEqual(r["newly_verified_reviewed_LOC"],0)
        self.assertIsNone(r["new_comparable_900_density"])

    def test_tampered_comparator_spans_fail_even_if_original_audit_is_intact(self):
        rows,report,comp=evidence()
        comp["original_pinned_review_rows"][1]["spans"]=[[1,64]]
        with self.assertRaisesRegex(ValueError,"identity or spans differ"):
            sut.attest(rows,report,comp,expected_rows=3)

    def test_tampered_source_rows_with_unmodified_report_digest_fail(self):
        rows,report,comp=evidence()
        rows[1]["spans"]=[[11,74]]
        with self.assertRaisesRegex(ValueError,"SHA-256"):
            sut.attest(rows,report,comp,expected_rows=3)

    def test_mismatched_audit_cohort_is_rejected(self):
        rows,report,comp=evidence()
        comp["cohort"]["head_sha"]="f"*40
        with self.assertRaisesRegex(ValueError,"cohort provenance drift"):
            sut.attest(rows,report,comp,expected_rows=3)

    def test_duplicate_original_excel_row_fails_closed(self):
        rows,report,comp=evidence()
        rows[2]["excel_row"]=3821
        report["audited_rows_sha256"]=audited_rows_sha256(rows)
        with self.assertRaisesRegex(ValueError,"population incomplete or repeated"):
            sut.attest(rows,report,comp,expected_rows=3)

    def test_source_belongs_to_same_path_and_actual_pin_window(self):
        rows,report,comp=evidence()
        rows[1]["window_membership"]="not_on_first_parent_window"
        digest=audited_rows_sha256(rows)
        report["audited_rows_sha256"]=digest
        comp["source_pin_rows_sha256"]=digest
        with self.assertRaisesRegex(ValueError,"identity or spans differ"):
            sut.attest(rows,report,comp,expected_rows=3)

    def test_replacing_prior_artifact_id_fails_closed(self):
        rows,report,comp=evidence()
        comp["source_artifact_id"]=123
        with self.assertRaisesRegex(ValueError,"original CI evidence source changed"):
            sut.attest(rows,report,comp,expected_rows=3)

    def test_missing_prior_audit_original_pins_fail_closed(self):
        rows,report,comp=evidence()
        with self.assertRaisesRegex(ValueError,"original source-pin audit incomplete"):
            sut.attest(rows[:2],report,comp,expected_rows=3)


if __name__=="__main__":
    unittest.main()
