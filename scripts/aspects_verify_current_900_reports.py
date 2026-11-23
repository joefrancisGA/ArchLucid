#!/usr/bin/env python3
"""Fail closed if current Aspects 900-window reports describe different populations.

These reports remain diagnostic subsets. Matching their identities and counts
is a prerequisite for a future density calculation, not proof that the full
historical denominator or distinct-defect numerator has been restored.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path

COHORT_KEYS = ("head_sha", "oldest_included_sha", "ordered_shas_sha256")
STATUS = {
    "source": "partial_current_master_base_900_exact_pin_and_followon_reconciliation",
    "discovery": "current_master_base_900_provisional_discovery_identity_census",
    "lineage": "partial_current_900_first_parent_reviewed_source_continuity",
    "candidate": "current_master_900_derived_review_source_candidate_provenance",
}


def verify_reports(source: dict, discovery: dict, lineage: dict,
                   candidate: dict) -> dict:
    reports = {
        "source": source,
        "discovery": discovery,
        "lineage": lineage,
        "candidate": candidate,
    }
    for name, item in reports.items():
        if not isinstance(item, dict) or item.get("status") != STATUS[name]:
            raise ValueError(f"{name} current-window report absent or wrong status")
    cohort = source.get("cohort")
    if (not isinstance(cohort, dict) or cohort.get("status") != "complete"
            or cohort.get("requested_commits") != 900
            or cohort.get("actual_commits") != 900):
        raise ValueError("source 900-first-parent cohort incomplete")
    for name, report in reports.items():
        current = report.get("cohort")
        if (not isinstance(current, dict)
                or any(not cohort.get(key) or current.get(key) != cohort[key]
                       for key in COHORT_KEYS)):
            raise ValueError(f"{name} cohort ancestry or digest disagrees with source")
    historical = source.get("original_historical_events_total")
    clean = source.get("original_clean_events_all_history")
    if (historical != 5741 or clean != 4864
            or discovery.get("historical_events_imported") != historical
            or discovery.get("historical_clean_reviews_all_history") != clean
            or lineage.get("historical_rows_audited") != historical
            or candidate.get("historical_observations_imported") != historical):
        raise ValueError("original clean and historical review population differs")
    original_current = source.get("original_events_in_current_master_900")
    original_clean = discovery.get("original_clean_reviews_in_current_900")
    original_positive = discovery.get("original_positive_review_rows_in_current_900")
    if (type(original_current) is not int or original_current < 0
            or type(original_clean) is not int or original_clean < 0
            or type(original_positive) is not int or original_positive < 0
            or original_clean + original_positive != original_current
            or original_clean != source.get("original_clean_events_in_current_master_900")):
        raise ValueError("current-window original clean/positive partition changed")
    followon = source.get("followon_records_in_current_master_900")
    if (type(followon) is not int or followon < 0
            or discovery.get("followon_records_in_current_900") != followon
            or lineage.get("followon_reviews_in_current_window") != followon
            or lineage.get("followon_reviews_outside_current_window")
               != source.get("followon_records_outside_current_master_900")
            or discovery.get("followon_records_outside_current_900")
               != source.get("followon_records_outside_current_master_900")):
        raise ValueError("follow-on reviewed-source population disagrees")
    if (lineage.get("original_pinned_review_rows_in_current_window")
            != source.get("original_git_pinned_rows_eligible_in_current_900")
            or lineage.get("original_pinned_line_occurrences")
               != source.get("original_git_pinned_line_occurrences_current_900")
            or lineage.get("exact_path_blob_line_union_only")
               != source.get("combined_exact_path_blob_line_union_only")):
        raise ValueError("source and proven-lineage subset counts disagree")
    candidate_current = candidate.get("candidate_rows_in_current_cohort")
    candidate_verified = candidate.get("candidate_source_rows_reverified_git_in_current_cohort")
    candidate_unresolved = candidate.get("candidate_rows_unresolved_in_current_cohort")
    candidate_clean = candidate.get("candidate_clean_review_rows_in_current_cohort")
    candidate_positive = candidate.get("candidate_positive_review_rows_in_current_cohort")
    if (any(type(v) is not int or v < 0 for v in
            (candidate_current, candidate_verified, candidate_unresolved,
             candidate_clean, candidate_positive))
            or candidate_verified + candidate_unresolved != candidate_current
            or candidate_clean + candidate_positive != candidate_verified
            or candidate_current + candidate.get("candidate_rows_outside_current_cohort", -1)
               != candidate.get("candidate_rows_total_all_history")
            or candidate_clean > original_clean
            or candidate_positive > original_positive
            # Some original-pin-verified multi-file workbook rows also appear
            # in the unparsed/deferred candidate audit. Their unresolved rows
            # overlap source pins by design; only *recovered derived* rows
            # must be disjoint from originally verified pins.
            or candidate_current > original_current
            or candidate_verified + source["original_git_pinned_rows_eligible_in_current_900"]
               > original_current):
        raise ValueError("derived candidate partition inconsistent with original reviews")
    candidate_exact = candidate.get("candidate_unique_exact_path_blob_line_identities")
    overlap = candidate.get("candidate_exact_overlap_with_original_pins")
    if (any(type(v) is not int or v < 0 for v in
            (candidate_exact, overlap))
            or overlap > candidate_exact
            or candidate.get("candidate_exact_identities_not_in_original_pins")
               != candidate_exact - overlap):
        raise ValueError("derived candidate overlap arithmetic disagrees")
    # The current output is an evidence-backed partial subset; no subsystem may
    # silently promote it to a complete, comparable historical rate.
    forbidden = {
        "source": ("distinct_defect_discoveries_verified",
                   "full_cross_revision_unique_reviewed_loc",
                   "new_comparable_900_density"),
        "discovery": ("current_verified_distinct_defect_ids",
                      "current_verified_full_reviewed_loc",
                      "new_comparable_900_density"),
        "lineage": ("newly_confirmed_distinct_defects",
                    "full_900_reviewed_loc_denominator",
                    "new_comparable_900_density"),
        "candidate": ("newly_verified_distinct_defect_discoveries",
                      "full_cross_revision_900_reviewed_loc",
                      "new_comparable_900_density"),
    }
    for name, fields in forbidden.items():
        if any(reports[name].get(field, "MISSING") is not None for field in fields):
            raise ValueError(f"{name} improperly promoted provisional density evidence")
    if (candidate.get("candidate_rows_promoted_to_independent_original_blob_pins") != 0
            or candidate.get("newly_independently_verified_reviewed_loc") != 0
            or lineage.get("new_independently_reviewed_loc") != 0):
        raise ValueError("derived/old source observations presented as newly reviewed")
    return {
        "status": "verified_same_cohort_partial_reports_no_comparable_density",
        "captured_utc": datetime.now(timezone.utc).isoformat(),
        "cohort": {key: cohort[key] for key in COHORT_KEYS},
        "first_parent_commits": 900,
        "historical_observations": historical,
        "historical_clean_reviews": clean,
        "original_reviews_in_window": original_current,
        "original_positive_reviews_in_window": original_positive,
        "followon_reviews_in_window": followon,
        "candidate_source_rows_in_window": candidate_current,
        "candidate_verified_source_rows_in_window_provisional_only": candidate_verified,
        "newly_verified_reviewed_loc": 0,
        "newly_verified_distinct_defects": 0,
        "new_comparable_density": None,
        "limitation": (
            "Matching report populations only: derived source candidates do not "
            "establish reviewed LOC; distinct discoveries and full cross-revision "
            "deduplication remain incomplete."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    for name in STATUS:
        parser.add_argument(f"--{name}", required=True, type=Path)
    parser.add_argument("--json-out", required=True, type=Path)
    args = parser.parse_args()
    reports = {
        name: json.loads(getattr(args, name).read_text(encoding="utf-8"))
        for name in STATUS
    }
    report = verify_reports(**reports)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
