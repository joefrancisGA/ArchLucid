"""Current-master 900 discovery candidate labels are not fixing-PR identities."""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from aspects_density_snapshot import cohort_identity
import aspects_current_900_discovery_candidates as sut

HEAD, MID, OLD = "a" * 40, "b" * 40, "c" * 40
CHECKED = "2026-11-23T00:51:07Z"


def pr(number, state, merged):
    return {
        "number": number, "state": state, "merged": merged,
        "merged_at": "2026-11-22T09:00:00Z" if merged else None,
        "fix_pr_url": f"https://github.com/joefrancisGA/ArchLucid/pull/{number}",
        "status_verified_at_utc": CHECKED,
    }


def fixtures():
    events = [
        {"excel_row": 7, "reviewed_master_sha": OLD,
         "review_id": "old-clean", "defects_recorded": 0},
        {"excel_row": 8, "reviewed_master_sha": MID,
         "review_id": "#701", "defects_recorded": 1,
         "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/701"},
        {"excel_row": 9, "reviewed_master_sha": HEAD,
         "review_id": "ASPECTS-12", "defects_recorded": 1,
         "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/702"},
        {"excel_row": 10, "reviewed_master_sha": HEAD,
         "review_id": "ASPECTS-12", "defects_recorded": 1,
         "source_reference": "https://github.com/joefrancisGA/ArchLucid/pull/703"},
        {"excel_row": 11, "reviewed_master_sha": HEAD,
         "review_id": "head-clean", "defects_recorded": 0},
    ]
    recent = [
        {"baseline": HEAD, "verified": True, "defect_id": "ASPECTS-12"},
        {"baseline": MID, "verified": True, "defect_id": "ASPECTS-701"},
        {"baseline": MID, "verified": True, "defect_id": None},
        {"baseline": OLD, "verified": True, "defect_id": "ASPECTS-12"},
    ]
    state = {
        "repository": "joefrancisGA/ArchLucid",
        "checked_at_utc": CHECKED,
        "pr_states": [pr(701, "closed", True), pr(702, "closed", False),
                      pr(703, "open", False)],
    }
    return events, recent, cohort_identity([HEAD, MID], HEAD, 2), state


class CurrentDefectCandidatesTests(unittest.TestCase):
    def calculate(self, change=None):
        args = fixtures()
        if change:
            change(*args)
        return sut.census(*args, expected_rows=5)

    def test_current_cohort_preserves_review_labels_and_fix_states_separately(self):
        r = self.calculate()
        self.assertEqual(r["status"], "current_master_base_900_provisional_discovery_identity_census")
        self.assertEqual(r["historical_events_imported"], 5)
        self.assertEqual(r["historical_clean_reviews_all_history"], 2)
        self.assertEqual(r["original_clean_reviews_in_current_900"], 1)
        self.assertEqual(r["original_positive_review_rows_in_current_900"], 3)
        self.assertEqual(r["original_unique_typed_candidate_labels_in_current_900"], 2)
        self.assertEqual(r["original_candidate_labels_by_namespace"],
                         {"workbook_aspects_id": 1, "workbook_pr_number": 1})
        self.assertEqual(r["original_repeated_typed_candidate_labels"], 1)
        self.assertEqual(r["fix_pr_lifecycle_rows_as_of_checkpoint"],
                         {"closed_unmerged": 1, "merged": 1, "open": 1})
        self.assertEqual(r["followon_records_in_current_900"], 3)
        self.assertEqual(r["followon_records_outside_current_900"], 1)
        self.assertEqual(r["followon_clean_records_in_current_900"], 1)
        self.assertEqual(r["followon_exact_verbatim_aspects_namespace_matches"],
                         ["ASPECTS-12"])
        self.assertEqual(r["followon_labels_without_proven_historical_alias"],
                         ["ASPECTS-701"])
        self.assertIsNone(r["current_verified_distinct_defect_ids"])
        self.assertIsNone(r["new_comparable_900_density"])

    def test_moving_window_excludes_old_discoveries_and_fix_states(self):
        def rotate(events, recent, cohort, state):
            cohort.clear()
            cohort.update(cohort_identity([HEAD], HEAD, 1))
        r = self.calculate(rotate)
        self.assertEqual(r["original_positive_review_rows_in_current_900"], 2)
        self.assertEqual(r["original_clean_reviews_in_current_900"], 1)
        self.assertEqual(r["original_unique_typed_candidate_labels_in_current_900"], 1)
        self.assertEqual(r["fix_pr_lifecycle_rows_as_of_checkpoint"],
                         {"closed_unmerged": 1, "open": 1})
        self.assertEqual(r["followon_records_in_current_900"], 1)
        self.assertEqual(r["followon_records_outside_current_900"], 3)

    def test_duplicate_clean_event_does_not_increase_discovery_candidates(self):
        def duplicate(events, recent, cohort, state):
            recent.append({"baseline": HEAD, "verified": True, "defect_id": None})
        r = self.calculate(duplicate)
        self.assertEqual(r["followon_clean_records_in_current_900"], 2)
        self.assertEqual(r["followon_unique_named_candidate_labels_in_current_900"], 2)

    def test_duplicate_named_discovery_review_does_not_increase_distinct_candidates(self):
        def repeat(events, recent, cohort, state):
            recent.append({"baseline": HEAD, "verified": True, "defect_id": "ASPECTS-12"})
        r = self.calculate(repeat)
        self.assertEqual(r["followon_unique_named_candidate_labels_in_current_900"], 2)
        self.assertEqual(r["followon_repeated_named_label_observations"], 1)

    def test_missing_fix_state_is_explicit_not_a_new_defect(self):
        def remove(events, recent, cohort, state):
            state["pr_states"] = [x for x in state["pr_states"] if x["number"] != 703]
        r = self.calculate(remove)
        self.assertEqual(r["fix_pr_references_missing_status_count"], 1)
        self.assertEqual(r["fix_pr_references_missing_status_sample"], [703])
        self.assertIsNone(r["current_verified_distinct_defect_ids"])

    def test_fix_metadata_is_historical_as_of_not_current(self):
        r = self.calculate()
        self.assertEqual(r["fix_pr_state_checkpoint_as_of_utc"], CHECKED)
        self.assertFalse(r["fix_pr_state_checkpoint_is_current"])

    def test_unauthenticated_source_suffix_alias_is_never_inferred(self):
        r = self.calculate()
        self.assertNotIn("ASPECTS-701",
                         r["followon_exact_verbatim_aspects_namespace_matches"])

    def test_unverified_recent_in_window_never_looks_clean(self):
        def bad(events, recent, cohort, state):
            recent[2]["verified"] = False
        with self.assertRaisesRegex(ValueError, "lacks Git review verification"):
            self.calculate(bad)

    def test_missing_original_clean_event_fails_closed(self):
        def remove(events, recent, cohort, state):
            events.pop()
        with self.assertRaisesRegex(ValueError, "Excel observation range"):
            self.calculate(remove)

    def test_prior_status_timestamp_after_snapshot_fails_closed(self):
        def future(events, recent, cohort, state):
            state["pr_states"][0]["status_verified_at_utc"] = "2026-11-24T00:00:00Z"
        with self.assertRaisesRegex(ValueError, "after reported snapshot"):
            self.calculate(future)

    def test_invalid_master_cohort_digest_rejected(self):
        def tamper(events, recent, cohort, state):
            cohort["ordered_shas_sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "digest"):
            self.calculate(tamper)


if __name__ == "__main__":
    unittest.main()
