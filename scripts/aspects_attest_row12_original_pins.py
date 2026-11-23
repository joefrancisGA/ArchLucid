#!/usr/bin/env python3
"""Attest row12 comparator goldens against a prior SUCCESSFUL original-pin audit.

A checked-in JSON golden can accidentally omit or alter a reviewed line span.
Recheck each exact Excel identity against all 5,741 independently audited rows
downloaded from the original successful GitHub Actions evidence artifact.
This proves provenance of the comparator INPUT only. The separate focused
verifier still must prove Git first-parent line ancestry; no rate is promoted.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from aspects_reconcile_recovered_candidates import intervals
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256


REVIEW_KEYS = (
    "excel_row", "review_id", "reviewed_master_sha", "path", "blob",
    "spans", "nonblank_reviewed_loc",
)


def attest(pinned: list[dict], report: dict, comparator: dict,
           expected_rows: int = 5741) -> dict:
    if (type(expected_rows) is not int or expected_rows < 3
            or len(pinned) != expected_rows
            or report.get("review_events_present") != expected_rows
            or report.get("status") !=
                "git_blob_and_nonblank_intervals_subset_only_cross_revision_unresolved"):
        raise ValueError("original source-pin audit incomplete or wrong schema")
    rows = {row.get("excel_row"): row for row in pinned}
    if (len(rows) != expected_rows
            or any(type(row_id) is not int for row_id in rows)
            or (expected_rows == 5741 and
                set(rows) != set(range(7, 5748)))):
        raise ValueError("original source-pin Excel row population incomplete or repeated")
    digest = audited_rows_sha256(pinned)
    if (report.get("audited_rows_sha256") != digest
            or comparator.get("source_pin_rows_sha256") != digest):
        raise ValueError("original Git-audited review rows SHA-256 differs from attested golden")
    anchor = report.get("first_parent_checkpoint")
    declared = comparator.get("cohort")
    if (not isinstance(anchor, dict) or not isinstance(declared, dict)
            or anchor.get("status") != "verified_first_parent_sha_membership"
            or any(anchor.get(key) != declared.get(key)
                   for key in ("head_sha", "oldest_sha", "first_parent_commits"))):
        raise ValueError("original reviewed commit cohort provenance drift")

    comparisons = comparator.get("original_pinned_review_rows")
    if (not isinstance(comparisons, list) or len(comparisons) != 3
            or len({r.get("excel_row") for r in comparisons}) != 3):
        raise ValueError("three original-pin Excel review identities required")
    canonical_path = "ArchLucid.Persistence/Connections/ReadOnlyDbConnectionFactory.cs"
    exact_lines = {}
    normalized = []
    for golden in comparisons:
        excel = golden.get("excel_row")
        row = rows.get(excel)
        if row is None:
            raise ValueError("original pinned Excel row missing from prior CI artifact")
        if (row.get("pin_status") != VERIFIED
                or row.get("window_membership") != "in_window"
                or golden.get("path") != canonical_path
                or any(row.get(key) != golden.get(key) for key in REVIEW_KEYS)):
            raise ValueError(f"original pin review {excel} source identity or spans differ from audit")
        selected = intervals(row, "spans")
        if not selected or len(selected) != row["nonblank_reviewed_loc"]:
            raise ValueError(f"original pin review {excel} selected source intervals inconsistent")
        exact_lines.setdefault((row["path"], row["blob"]), set()).update(selected)
        normalized.append({
            "excel_row":excel,
            "review_id":row["review_id"],
            "reviewed_master_sha":row["reviewed_master_sha"],
            "blob":row["blob"],
            "reviewed_source_lines":len(selected),
        })
    if sum(map(len, exact_lines.values())) != 74:
        raise ValueError("unexpected original-pinned three-review path/blob line union")
    if comparator.get("source_run_id") != 45160219395 or comparator.get("source_artifact_id") != 14812729056:
        raise ValueError("comparator original CI evidence source changed")
    return {
        "status":"row12_original_pin_comparator_evidence_attested",
        "prior_successful_source_run_id":comparator["source_run_id"],
        "prior_successful_source_artifact_id":comparator["source_artifact_id"],
        "original_git_audit_rows":len(pinned),
        "original_audit_rows_sha256":digest,
        "original_900_first_parent_cohort":declared,
        "original_pinned_review_rows_attested":len(normalized),
        "original_reviewed_source_line_occurrences":sum(r["reviewed_source_lines"] for r in normalized),
        "original_unique_exact_path_blob_reviewed_lines":sum(map(len, exact_lines.values())),
        "original_pinned_review_records":normalized,
        "candidate_row12_source_is_not_original_blob_pinned":True,
        "newly_verified_reviewed_LOC":0,
        "new_comparable_900_density":None,
    }


def main() -> None:
    p=argparse.ArgumentParser()
    p.add_argument("--original-pin-rows",type=Path,required=True)
    p.add_argument("--original-pin-report",type=Path,required=True)
    p.add_argument("--comparator-golden",type=Path,required=True)
    p.add_argument("--json-out",type=Path,required=True)
    a=p.parse_args()
    result=attest(
        [json.loads(line) for line in
         a.original_pin_rows.read_text(encoding="utf-8").splitlines()
         if line.strip()],
        json.loads(a.original_pin_report.read_text(encoding="utf-8")),
        json.loads(a.comparator_golden.read_text(encoding="utf-8")),
    )
    a.json_out.parent.mkdir(parents=True,exist_ok=True)
    a.json_out.write_text(json.dumps(result,sort_keys=True,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,sort_keys=True))


if __name__ == "__main__":
    main()
