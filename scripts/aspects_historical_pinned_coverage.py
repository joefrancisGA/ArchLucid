"""Frozen, independently audited historical source-pin LOC, NOT the tiny live ledger.

Original artifact: GitHub Actions run 45160219395, artifact 14812729056,
historical-git-pin-audit.json SHA256
6bd330eb81fa105ee2b48deb32be2b77885daa5d3a629fa54e1472ac975dd3c1.
A Git-matching source pin does not independently prove the review was performed.
"""
from __future__ import annotations

AUDIT_SHA256 = "6bd330eb81fa105ee2b48deb32be2b77885daa5d3a629fa54e1472ac975dd3c1"
ROWS_SHA256 = "d890f8beecab68473e25bdb6c765c2a6baf5628435a4c5e87687e513a06ef432"


def audited_historical_source_coverage(checkpoint: dict, last_snapshot: dict) -> dict:
    if not isinstance(checkpoint, dict) or checkpoint.get("schema_version") != 1:
        raise ValueError("historical source-pin checkpoint unavailable or malformed")
    source, cohort = checkpoint.get("source"), checkpoint.get("cohort")
    if (not isinstance(source, dict) or not isinstance(cohort, dict)
            or source.get("run_id") != 45160219395
            or source.get("artifact_id") != 14812729056
            or source.get("original_audit_json_sha256") != AUDIT_SHA256
            or source.get("original_audited_rows_sha256") != ROWS_SHA256
            or checkpoint.get("source_run_conclusion") != "success"
            or checkpoint.get("audit_status")
                != "git_blob_and_nonblank_intervals_subset_only_cross_revision_unresolved"
            or checkpoint.get("source_proof_confidence")
                != "source_pin_integrity_only_not_independent_reconstruction_of_review_history"
            or cohort.get("first_parent_commits") != 900
            or cohort.get("head_sha") != last_snapshot["head_sha"]
            or cohort.get("oldest_sha") != last_snapshot["oldest_sha"]):
        raise ValueError("historical source-pin artifact identity/cohort mismatch")
    counts = ("original_workbook_review_observations", "verified_pinned_review_rows",
              "verified_clean_review_rows",
              "verified_positive_review_rows_not_distinct_defect_ids",
              "quarantined_or_ambiguous_review_rows",
              "verified_exact_unique_path_blob_loc",
              "verified_exact_line_occurrences",
              "verified_exact_repeated_line_occurrences")
    if any(type(checkpoint.get(k)) is not int or checkpoint[k] < 0 for k in counts):
        raise ValueError("historical source-pin counts absent or negative")
    c = checkpoint
    if (c["original_workbook_review_observations"] != 5741
            or c["verified_pinned_review_rows"] + c["quarantined_or_ambiguous_review_rows"]
                != c["original_workbook_review_observations"]
            or c["verified_clean_review_rows"]
                + c["verified_positive_review_rows_not_distinct_defect_ids"]
                != c["verified_pinned_review_rows"]
            or c["verified_exact_unique_path_blob_loc"]
                + c["verified_exact_repeated_line_occurrences"]
                != c["verified_exact_line_occurrences"]
            or c["historical_source_lineage_cross_revision_complete"] is not False
            or c["independent_review_confirmation_complete"] is not False
            or c["distinct_defect_ids_verified_for_these_232219_lines"] is not None
            or c["defects_per_kloc_for_these_232219_lines"] is not None):
        raise ValueError("historical original source-pin census inconsistent")
    return {
        "status": "historical_900_source_pin_integrity_subset_not_live_ledger",
        "original_900_head_sha": cohort["head_sha"],
        "original_900_oldest_sha": cohort["oldest_sha"],
        "first_parent_commits": 900,
        "all_historical_review_rows": c["original_workbook_review_observations"],
        "git_verified_pinned_review_rows": c["verified_pinned_review_rows"],
        "original_review_rows_quarantined": c["quarantined_or_ambiguous_review_rows"],
        "unique_exact_path_blob_source_loc": c["verified_exact_unique_path_blob_loc"],
        "pinned_source_line_occurrences": c["verified_exact_line_occurrences"],
        "repeated_exact_path_blob_line_occurrences":
            c["verified_exact_repeated_line_occurrences"],
        "positive_review_rows_not_distinct_defect_ids":
            c["verified_positive_review_rows_not_distinct_defect_ids"],
        "distinct_defect_ids_for_this_population": None,
        "defects_per_kloc_for_this_population": None,
        "cross_revision_unique_reviewed_loc_proven": False,
        "independent_review_occurrence_proven": False,
        "artifact_url": source["source_url"],
        "audit_sha256": source["original_audit_json_sha256"],
        "not_additive_to_incremental_live_ledger": True,
        "newly_measured_loc_in_this_run": 0,
    }
