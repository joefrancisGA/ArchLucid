#!/usr/bin/env python3
"""Fail-closed candidate-only recovered source/overlap golden for legacy Excel rows.

The validation consumes source-at-original-reviewed-commit Git evidence. It does
not promote a derived blob to an original workbook pin or publish a historical
900-first-parent density.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from aspects_validate_historical_pins import audited_rows_sha256


def identities(sources: list[dict], *, derived: bool) -> set[tuple[str, str, int]]:
    result = set()
    for source in sources:
        blob = source["blob_derived_at_reviewed_commit"] if derived else source["blob"]
        spans = source["nonblank_intervals_at_reviewed_commit"] if derived else source["spans"]
        seen = set()
        for start, stop in spans:
            if type(start) is not int or type(stop) is not int or start < 1 or stop < start:
                raise ValueError("invalid source interval")
            seen.update(range(start, stop + 1))
        if derived and len(seen) != source["nonblank_loc"]:
            raise ValueError("source nonblank LOC does not match intervals")
        result.update((source["path"], blob, line) for line in seen)
    return result


def validate(golden: dict, pin_report: dict, pin_rows: list[dict],
             candidate_report: dict, candidates: list[dict]) -> dict:
    if golden.get("schema_version") != 1 or golden.get("confidence") != "candidate_only_derived_at_reported_commit":
        raise ValueError("unsupported or promoted golden provenance")
    cohort = golden["cohort"]
    for report in [pin_report, candidate_report]:
        anchor = report["first_parent_checkpoint"]
        for label, key in [("head_sha", "head_sha"), ("oldest_included_sha", "oldest_sha"),
                           ("first_parent_commits", "first_parent_commits")]:
            if anchor.get(key) != cohort[label]:
                raise ValueError("historical first-parent cohort drift")
    if len(pin_rows) != golden["population"]["review_rows"]:
        raise ValueError("missing historical pin audit rows")
    if (audited_rows_sha256(pin_rows) != pin_report.get("audited_rows_sha256") or
            pin_report["audited_rows_sha256"] != golden["population"]["pin_audit_rows_sha256"]):
        raise ValueError("original pinned audit SHA digest mismatch")
    if len(candidates) != golden["population"]["unparsed_rows"]:
        raise ValueError("missing unpinned review candidate rows")
    if audited_rows_sha256(candidates) != candidate_report.get("candidate_rows_sha256"):
        raise ValueError("derived candidate SHA digest mismatch")
    expected = {r["excel_row"]: r for r in golden["rows"]}
    if len(expected) != len(golden["rows"]) or len(expected) != golden["increments"]["recovered_review_rows"]:
        raise ValueError("duplicate golden row or count mismatch")
    found = {}
    pinned = set()
    existing = set()
    for row in pin_rows:
        if row.get("pin_status") == "git_blob_and_nonblank_intervals_verified" and row.get("window_membership") == "in_window":
            pinned.update(identities(row.get("pinned_sources", [row]), derived=False))
    for row in candidates:
        if row.get("window_membership") != "in_900_first_parent_window" or row.get("status") != "git_source_at_review_commit_candidate_only":
            continue
        if row["excel_row"] in expected:
            if row["excel_row"] in found:
                raise ValueError("duplicate candidate observation")
            found[row["excel_row"]] = row
        else:
            existing.update(identities(row["sources"], derived=True))
    if set(found) != set(expected):
        raise ValueError("missing or quarantined recovered observation")
    recovered = set()
    occurrences = 0
    components = 0
    for row_id, exp in sorted(expected.items()):
        row = found[row_id]
        if (row.get("original_blob_pinned") is not False or row.get("review_id") != exp["review_id"] or
            row.get("reviewed_master_sha") != exp["reviewed_master_sha"] or
            row.get("candidate_nonblank_loc") != exp["nonblank_loc"] or
            row.get("reviewed_loc_workbook_reported") != exp["nonblank_loc"] or
            len(row["sources"]) != exp["source_components"]):
            raise ValueError(f"Excel row {row_id}: original identity or atomic count mismatch")
        canonical = json.dumps(row["sources"], ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
        if hashlib.sha256(canonical).hexdigest() != exp["source_sha256"]:
            raise ValueError(f"Excel row {row_id}: derived Git blob/span golden drift")
        source_keys = identities(row["sources"], derived=True)
        if len(source_keys) != row["candidate_nonblank_loc"]:
            raise ValueError(f"Excel row {row_id}: overlapping source identities within one review")
        occurrences += row["candidate_nonblank_loc"]
        components += len(row["sources"])
        recovered.update(source_keys)
    new_candidates = recovered - (pinned | existing)
    overlaps = occurrences - len(new_candidates)
    expected_increments = golden["increments"]
    actual = {
        "recovered_review_rows": len(found),
        "source_components": components,
        "candidate_line_occurrences": occurrences,
        "candidate_new_exact_identities": len(new_candidates),
        "candidate_repeated_line_occurrences": overlaps,
        "candidate_exact_overlap_with_original_pins": len(recovered & pinned),
        "original_pin_denominator_increment": 0,
        "new_distinct_defects_promoted": 0,
    }
    if actual != expected_increments:
        raise ValueError(f"recovered candidate overlap changed: {actual} != {expected_increments}")
    return {
        "status": "derived_source_candidates_verified_not_full_density",
        "cohort": cohort,
        "increments": actual,
        "new_comparable_900_rate": None,
        "provenance": "Derived source at original review SHA; no original workbook blob pin or cross-revision identity",
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--golden", required=True, type=Path)
    p.add_argument("--pin-report", required=True, type=Path)
    p.add_argument("--pin-rows", required=True, type=Path)
    p.add_argument("--candidate-report", required=True, type=Path)
    p.add_argument("--candidate-rows", required=True, type=Path)
    p.add_argument("--json-out", required=True, type=Path)
    args = p.parse_args()
    read = lambda path: json.loads(path.read_text(encoding="utf-8"))
    rows = lambda path: [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    result = validate(read(args.golden), read(args.pin_report), rows(args.pin_rows),
                      read(args.candidate_report), rows(args.candidate_rows))
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
