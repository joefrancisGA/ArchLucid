"""Fail-closed tests for consistent Aspects current 900-commit reporting."""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_verify_current_900_reports import verify_reports


def fixtures():
    cohort = {
        "status": "complete",
        "requested_commits": 900,
        "actual_commits": 900,
        "head_sha": "a" * 40,
        "oldest_included_sha": "b" * 40,
        "ordered_shas_sha256": "c" * 64,
    }
    source = {
        "status": "partial_current_master_base_900_exact_pin_and_followon_reconciliation",
        "cohort": cohort,
        "original_historical_events_total": 5741,
        "original_clean_events_all_history": 4864,
        "original_events_in_current_master_900": 10,
        "original_clean_events_in_current_master_900": 8,
        "original_git_pinned_rows_eligible_in_current_900": 5,
        "original_git_pinned_line_occurrences_current_900": 20,
        "combined_exact_path_blob_line_union_only": 24,
        "followon_records_in_current_master_900": 2,
        "followon_records_outside_current_master_900": 1,
        "distinct_defect_discoveries_verified": None,
        "full_cross_revision_unique_reviewed_loc": None,
        "new_comparable_900_density": None,
    }
    discovery = {
        "status": "current_master_base_900_provisional_discovery_identity_census",
        "cohort": dict(cohort),
        "historical_events_imported": 5741,
        "historical_clean_reviews_all_history": 4864,
        "original_clean_reviews_in_current_900": 8,
        "original_positive_review_rows_in_current_900": 2,
        "followon_records_in_current_900": 2,
        "followon_records_outside_current_900": 1,
        "current_verified_distinct_defect_ids": None,
        "current_verified_full_reviewed_loc": None,
        "new_comparable_900_density": None,
    }
    lineage = {
        "status": "partial_current_900_first_parent_reviewed_source_continuity",
        "cohort": dict(cohort),
        "historical_rows_audited": 5741,
        "original_pinned_review_rows_in_current_window": 5,
        "original_pinned_line_occurrences": 20,
        "exact_path_blob_line_union_only": 24,
        "followon_reviews_in_current_window": 2,
        "followon_reviews_outside_current_window": 1,
        "new_independently_reviewed_loc": 0,
        "newly_confirmed_distinct_defects": None,
        "full_900_reviewed_loc_denominator": None,
        "new_comparable_900_density": None,
    }
    candidate = {
        "status": "current_master_900_derived_review_source_candidate_provenance",
        "cohort": dict(cohort),
        "historical_observations_imported": 5741,
        "candidate_rows_total_all_history": 4,
        "candidate_rows_in_current_cohort": 3,
        "candidate_rows_outside_current_cohort": 1,
        "candidate_source_rows_reverified_git_in_current_cohort": 2,
        "candidate_rows_unresolved_in_current_cohort": 1,
        "candidate_clean_review_rows_in_current_cohort": 1,
        "candidate_positive_review_rows_in_current_cohort": 1,
        "candidate_unique_exact_path_blob_line_identities": 10,
        "candidate_exact_overlap_with_original_pins": 4,
        "candidate_exact_identities_not_in_original_pins": 6,
        "candidate_rows_promoted_to_independent_original_blob_pins": 0,
        "newly_independently_verified_reviewed_loc": 0,
        "newly_verified_distinct_defect_discoveries": None,
        "full_cross_revision_900_reviewed_loc": None,
        "new_comparable_900_density": None,
    }
    return (source, discovery, lineage, candidate)


class SameCohortPartialReportsTests(unittest.TestCase):
    def audit(self, change=None):
        parts = list(deepcopy(fixtures()))
        if change:
            change(*parts)
        return verify_reports(*parts)

    def test_consistent_partial_evidence_does_not_fabricate_rate(self):
        r = self.audit()
        self.assertEqual(r["status"], "verified_same_cohort_partial_reports_no_comparable_density")
        self.assertEqual(r["historical_observations"], 5741)
        self.assertEqual(r["historical_clean_reviews"], 4864)
        self.assertEqual(r["original_positive_reviews_in_window"], 2)
        self.assertEqual(r["candidate_source_rows_in_window"], 3)
        self.assertEqual(r["newly_verified_reviewed_loc"], 0)
        self.assertIsNone(r["new_comparable_density"])

    def test_other_master_base_or_recomputed_digest_rejected(self):
        with self.assertRaisesRegex(ValueError, "cohort ancestry"):
            self.audit(lambda a, b, c, d:
                       d["cohort"].update(ordered_shas_sha256="f" * 64))

    def test_changed_oldest_commit_rejected(self):
        with self.assertRaisesRegex(ValueError, "cohort ancestry"):
            self.audit(lambda a, b, c, d:
                       b["cohort"].update(oldest_included_sha="d" * 40))

    def test_rotating_window_requires_full_900_first_parent(self):
        with self.assertRaisesRegex(ValueError, "900-first-parent"):
            self.audit(lambda a, b, c, d:
                       a["cohort"].update(actual_commits=899))

    def test_clean_and_positive_partitions_must_equal_original_window(self):
        with self.assertRaisesRegex(ValueError, "clean/positive partition"):
            self.audit(lambda a, b, c, d:
                       b.update(original_positive_review_rows_in_current_900=3))

    def test_followon_source_counts_must_match_discovery_and_lineage(self):
        with self.assertRaisesRegex(ValueError, "follow-on"):
            self.audit(lambda a, b, c, d:
                       c.update(followon_reviews_in_current_window=1))

    def test_derived_candidate_cannot_exceed_original_reviews(self):
        with self.assertRaisesRegex(ValueError, "candidate partition"):
            self.audit(lambda a, b, c, d:
                       d.update(candidate_positive_review_rows_in_current_cohort=4))

    def test_missing_candidate_source_row_cannot_silently_disappear(self):
        with self.assertRaisesRegex(ValueError, "candidate partition"):
            self.audit(lambda a, b, c, d:
                       d.update(candidate_rows_in_current_cohort=2))

    def test_candidate_overlap_must_not_inflate_unique_denominator(self):
        with self.assertRaisesRegex(ValueError, "overlap arithmetic"):
            self.audit(lambda a, b, c, d:
                       d.update(candidate_exact_overlap_with_original_pins=11))

    def test_unverified_source_lines_cannot_be_promoted(self):
        with self.assertRaisesRegex(ValueError, "newly reviewed"):
            self.audit(lambda a, b, c, d:
                       d.update(newly_independently_verified_reviewed_loc=100))

    def test_no_current_full_rate_can_be_published_from_partial_inputs(self):
        with self.assertRaisesRegex(ValueError, "improperly promoted"):
            self.audit(lambda a, b, c, d:
                       b.update(new_comparable_900_density=1.2))

    def test_missing_density_field_is_not_silent_success(self):
        with self.assertRaisesRegex(ValueError, "improperly promoted"):
            self.audit(lambda a, b, c, d:
                       a.pop("distinct_defect_discoveries_verified"))

    def test_missing_historical_clean_reviews_rejected(self):
        with self.assertRaisesRegex(ValueError, "clean and historical"):
            self.audit(lambda a, b, c, d:
                       a.update(original_clean_events_all_history=4863))


if __name__ == "__main__":
    unittest.main()
