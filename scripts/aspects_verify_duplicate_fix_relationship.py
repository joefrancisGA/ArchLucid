#!/usr/bin/env python3
"""Verify explicitly documented duplicate historical Aspects *review* relations.

A closed duplicate fixing PR must not masquerade as an independent defect or
vanish from historical review LOC. Evidence comes from a separately attested,
time-stamped GitHub PR description/state checkpoint and the immutable original
workbook rows. This establishes only named relationships, not a global 463
distinct-discovery recount or a new defect density.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from aspects_review_evidence import read_records
from aspects_validate_historical_corpus import verify as verify_corpus
from aspects_validate_historical_pins import audited_rows_sha256


def verify_duplicate_relationships(
    history: list[dict],
    audited: list[dict],
    pin_report: dict,
    evidence: dict,
    expected_records: int = 5741,
    first_excel_row: int = 7,
) -> dict:
    expected_excel_rows = list(range(first_excel_row, first_excel_row + expected_records))
    if (len(history) != expected_records
            or len(audited) != expected_records
            or any(type(r.get("excel_row")) is not int for r in history + audited)
            or sorted(r["excel_row"] for r in history) != expected_excel_rows
            or sorted(r["excel_row"] for r in audited) != expected_excel_rows):
        raise ValueError("Incomplete or noncanonical historical workbook/audit row population")
    if (audited_rows_sha256(audited) != pin_report.get("audited_rows_sha256")
            or pin_report.get("first_parent_checkpoint", {}).get("status")
            != "verified_first_parent_sha_membership"):
        raise ValueError("Unanchored or mismatched historical Git-pin audit SHA-256")

    if (evidence.get("repository") != "joefrancisGA/ArchLucid"
            or evidence.get("schema_version") != 1
            or not isinstance(evidence.get("checked_at_utc"), str)
            or not isinstance(evidence.get("duplicate_references"), list)
            or not evidence["duplicate_references"]):
        raise ValueError("Missing original duplicate-fix reference checkpoint provenance")
    by_excel = {r["excel_row"]: r for r in history}
    audited_by_excel = {r["excel_row"]: r for r in audited}
    consumed_prs: set[int] = set()
    consumed_rows: set[int] = set()
    links: list[dict] = []

    for item in evidence["duplicate_references"]:
        primary = item.get("primary_fix_pr")
        duplicate = item.get("duplicate_review_pr")
        primary_row = item.get("primary_review_excel_row")
        duplicate_row = item.get("duplicate_review_excel_row")
        review_id = item.get("original_review_id")
        commit = item.get("reviewed_master_sha")
        if (type(primary) is not int or type(duplicate) is not int
                or min(primary, duplicate) < 1 or primary == duplicate
                or type(primary_row) is not int or type(duplicate_row) is not int
                or primary_row == duplicate_row
                or {primary, duplicate} & consumed_prs
                or {primary_row, duplicate_row} & consumed_rows
                or primary_row not in by_excel or duplicate_row not in by_excel):
            raise ValueError("Duplicate/overlapping or invalid duplicate-fix relationship")
        consumed_prs.update([primary, duplicate])
        consumed_rows.update([primary_row, duplicate_row])

        left, right = by_excel[primary_row], by_excel[duplicate_row]
        expected_primary_url = f"https://github.com/joefrancisGA/ArchLucid/pull/{primary}"
        expected_duplicate_url = f"https://github.com/joefrancisGA/ArchLucid/pull/{duplicate}"
        if (item.get("primary_pr_url") != expected_primary_url
                or item.get("duplicate_pr_url") != expected_duplicate_url
                or left.get("source_reference") != expected_primary_url
                or right.get("source_reference") != expected_duplicate_url
                or left.get("review_id") != review_id
                or right.get("review_id") != review_id
                or left.get("defects_recorded") != 1
                or right.get("defects_recorded") != 1
                or not isinstance(commit, str) or len(commit) != 40
                or left.get("reviewed_master_sha") != commit
                or right.get("reviewed_master_sha") != commit):
            raise ValueError("Original workbook defect identity, PR link, or review SHA disagreement")

        for row in (left, right):
            observed = audited_by_excel[row["excel_row"]]
            if (observed.get("reviewed_master_sha") != commit
                    or observed.get("window_membership") != "in_window"):
                raise ValueError("Duplicate review not in the same verified 900-first-parent cohort")
        statement = item.get("original_duplicate_pr_description_excerpt")
        if (not isinstance(statement, str)
                or f"#{primary}" not in statement
                or "same defect" not in statement.lower()
                or "active fix" not in statement.lower()
                or item.get("primary_pr_state_at_check") != "merged"
                or item.get("duplicate_pr_state_at_check") != "closed_unmerged"
                or item.get("primary_pr_title") != item.get("duplicate_pr_title")):
            raise ValueError("Missing explicit duplicate PR testimony or checked fix statuses")

        links.append({
            "primary_excel_row": primary_row,
            "duplicate_excel_row": duplicate_row,
            "primary_fix_pr": primary,
            "duplicate_review_pr": duplicate,
            "reviewed_master_sha": commit,
            "review_events_retained": 2,
            "single_known_discovery_relationship": True,
            "source": "original_workbook_plus_checked_GitHub_duplicate_PR_description",
            "pin_review_statuses": [
                audited_by_excel[primary_row].get("pin_status"),
                audited_by_excel[duplicate_row].get("pin_status"),
            ],
        })

    return {
        "status": "explicit_historical_duplicate_review_relations_verified",
        "population": "all original workbook rows, anchored historical 900-first-parent cohort",
        "historical_workbook_rows_present": len(history),
        "checked_GitHub_PR_description_at_utc": evidence["checked_at_utc"],
        "explicit_duplicate_review_relationships": len(links),
        "review_events_preserved_without_recount": 2 * len(links),
        "links": links,
        "new_reviewed_LOC_added": 0,
        "new_distinct_defects_discovered": 0,
        "new_comparable_900_density": None,
        "historical_463_distinct_defects_recomputed": None,
        "window_anchor_head_sha": pin_report["first_parent_checkpoint"].get("head_sha"),
        "window_anchor_oldest_sha": pin_report["first_parent_checkpoint"].get("oldest_sha"),
        "audit_rows_sha256": pin_report["audited_rows_sha256"],
        "interpretation": (
            "The source PR explicitly called the other review the same defect. "
            "This resolves the named pair ONLY: duplicate fix PR does not prove "
            "all other PRs map one-to-one to defects. Preserve both clean and "
            "positive review source coverage without crediting new LOC or rate."
        ),
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--historical-root", type=Path,
                   default=Path("docs/engineering/aspects-historical"))
    p.add_argument("--audit-rows", type=Path, required=True)
    p.add_argument("--audit-report", type=Path, required=True)
    p.add_argument("--evidence", type=Path, required=True)
    p.add_argument("--json-out", type=Path, required=True)
    args = p.parse_args()

    verify_corpus(args.historical_root)
    rows = []
    for shard in sorted((args.historical_root / "review-events").glob("*.jsonl")):
        rows.extend(read_records(shard))
    result = verify_duplicate_relationships(
        rows,
        read_records(args.audit_rows),
        json.loads(args.audit_report.read_text(encoding="utf-8")),
        json.loads(args.evidence.read_text(encoding="utf-8")),
    )
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n",
                             encoding="utf-8")
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
