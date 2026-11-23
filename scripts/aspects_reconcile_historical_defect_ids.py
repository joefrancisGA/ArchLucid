#!/usr/bin/env python3
"""Reconcile historical Aspects discovery identities against fixing-PR state.

Historical workbook review IDs are *candidate* distinct discovery identifiers,
not automatically the 463 distinct-defect 900-commit numerator. A PR merge
changes fix state, never discovery count or reviewed LOC. Only independently
queried GitHub PR states in a timestamped snapshot may override workbook-era
'open' labels. Unknown PR statuses stay unknown.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re

from aspects_review_evidence import read_records
from aspects_validate_historical_corpus import verify
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256

PR_LINK = re.compile(
    r"^https://github\.com/joefrancisGA/ArchLucid/pull/([1-9][0-9]*)(?:/)?$"
)
PR_STATUS = re.compile(r"\bPR\s*#([1-9][0-9]*)\b", re.IGNORECASE)


def referenced_fix_pr(row: dict) -> tuple[int | None, str]:
    """Do not infer a PR from unrelated links or a textual number alone."""
    ref = row.get("source_reference")
    link = PR_LINK.fullmatch(ref.strip()) if isinstance(ref, str) else None
    status = row.get("historical_status")
    hint = PR_STATUS.search(status) if isinstance(status, str) else None
    linked = int(link.group(1)) if link else None
    hinted = int(hint.group(1)) if hint else None
    if linked is not None and hinted is not None and linked != hinted:
        return None, "conflicting_original_fix_pr_references"
    if linked is not None:
        return linked, "original_source_link"
    if hinted is not None:
        return hinted, "historical_status_text_only"
    return None, "no_explicit_fix_pr_reference"


def load_fix_state(checkpoint: dict) -> dict[int, dict]:
    """Validate a narrow, timestamped GitHub metadata snapshot."""
    if (checkpoint.get("repository") != "joefrancisGA/ArchLucid"
            or not isinstance(checkpoint.get("checked_at_utc"), str)
            or not isinstance(checkpoint.get("pr_states"), list)):
        raise ValueError("Missing complete GitHub fixing-PR checkpoint provenance")
    found = {}
    for item in checkpoint["pr_states"]:
        num, state, merged = item.get("number"), item.get("state"), item.get("merged")
        if (type(num) is not int or num < 1 or num in found
                or state not in ("open", "closed") or type(merged) is not bool
                or (state == "open" and merged)
                or (merged and not item.get("merged_at"))
                or item.get("fix_pr_url") !=
                f"https://github.com/joefrancisGA/ArchLucid/pull/{num}"
                or not isinstance(item.get("status_verified_at_utc"), str)):
            raise ValueError("Malformed, conflicting or duplicate GitHub PR metadata")
        found[num] = item
    return found


def reconcile(rows: list[dict], audit: list[dict], audit_report: dict,
              recent: list[dict], checkpoint: dict,
              expected_count: int = 5741, expected_first_excel_row: int = 7) -> tuple[dict, list[dict]]:
    if (len(rows) != expected_count or
            sorted(r.get("excel_row") for r in rows) !=
            list(range(expected_first_excel_row, expected_first_excel_row + expected_count))):
        raise ValueError("Incomplete or duplicate historical workbook event IDs")
    if (len(audit) != expected_count or
            audited_rows_sha256(audit) != audit_report.get("audited_rows_sha256")
            or sorted(r.get("excel_row") for r in audit) !=
            list(range(expected_first_excel_row, expected_first_excel_row + expected_count))):
        raise ValueError("Historical pin audit mismatch, missing rows or SHA-256 drift")
    anchor = audit_report.get("first_parent_checkpoint", {})
    if anchor.get("status") != "verified_first_parent_sha_membership":
        raise ValueError("Historical first-parent 900-commit anchor not verified")
    status_by_pr = load_fix_state(checkpoint)
    by_row = {r["excel_row"]: r for r in audit}
    recent_ids = {r["defect_id"] for r in recent
                  if isinstance(r.get("defect_id"), str) and r.get("defect_id")}
    positive = []
    candidate_ids = defaultdict(list)
    totals = Counter()
    unresolved = Counter()

    for row in rows:
        if row.get("defects_recorded", 0) == 0:
            continue
        excel = row["excel_row"]
        pin = by_row[excel]
        if row.get("reviewed_master_sha") != pin.get("reviewed_master_sha"):
            raise ValueError(f"Historical source SHA disagrees at Excel row {excel}")
        identifier = row.get("review_id")
        valid_id = isinstance(identifier, str) and identifier.strip().startswith("ASPECTS")
        if valid_id:
            identifier = identifier.strip()
        else:
            identifier = None
        number, evidence_type = referenced_fix_pr(row)
        recorded_status = row.get("historical_status")
        resolved = status_by_pr.get(number) if number is not None else None
        if resolved is not None:
            fix_state = ("merged" if resolved["merged"] else
                         "open" if resolved["state"] == "open" else "closed_unmerged")
            totals["fix_pr_state_from_github"] += 1
            if isinstance(recorded_status, str) and "open" in recorded_status.lower() and fix_state == "merged":
                totals["historical_open_labels_now_verified_merged"] += 1
        else:
            fix_state = "not_independently_checked"
            unresolved[evidence_type if number is None else "fix_pr_not_in_status_snapshot"] += 1
        record = {
            "excel_row": excel, "review_id": row.get("review_id"),
            "named_discovery_id_candidate": identifier,
            "defect_observations_workbook_reported": row["defects_recorded"],
            "source_path": (row.get("parsed_pin") or {}).get("path"),
            "reviewed_master_sha": row["reviewed_master_sha"],
            "window_membership": pin.get("window_membership"),
            "git_pin_status": pin.get("pin_status"),
            "in_narrow_recent_ledger_exact_defect_id": identifier in recent_ids if identifier else False,
            "fix_pr_number": number,
            "fix_pr_reference_confidence": evidence_type,
            "fix_state": fix_state,
            "fix_state_checked_at_utc": resolved.get("status_verified_at_utc") if resolved else None,
            "fix_pr_merged_at": resolved.get("merged_at") if resolved else None,
            "historical_fix_label": recorded_status,
            "provenance": "workbook_discovery_candidate_plus_separate_GitHub_fix_state",
        }
        positive.append(record)
        totals["positive_workbook_rows"] += 1
        totals["positive_observation_sum_not_distinct"] += row["defects_recorded"]
        if pin.get("window_membership") == "in_window":
            totals["positive_rows_on_900_first_parent"] += 1
            if pin.get("pin_status") == VERIFIED:
                totals["positive_rows_original_git_pin_verified"] += 1
        if identifier is not None:
            candidate_ids[identifier].append(excel)
            if identifier in recent_ids:
                totals["exact_candidate_id_also_in_narrow_ledger_rows"] += 1
        else:
            unresolved["missing_or_noncanonical_discovery_id"] += 1

    repeat_identifiers = {key: locations for key, locations in candidate_ids.items()
                          if len(locations) > 1}
    summary = {
        "schema_version": 1,
        "status": "historical_candidate_defect_ids_and_sampled_fix_states_reconciled",
        "source_population": "all_5741_historical_review_events_unchanged",
        "positive_rows": totals["positive_workbook_rows"],
        "positive_workbook_observation_sum_not_distinct": totals["positive_observation_sum_not_distinct"],
        "unique_named_discovery_id_candidates": len(candidate_ids),
        "repeated_named_discovery_id_candidates": len(repeat_identifiers),
        "repeated_named_ids_sample": dict(list(sorted(repeat_identifiers.items()))[:25]),
        "positive_rows_in_anchored_900_first_parent": totals["positive_rows_on_900_first_parent"],
        "original_git_pin_verified_positive_rows_in_900_window": totals["positive_rows_original_git_pin_verified"],
        "exact_candidate_id_also_in_narrow_ledger_rows": totals["exact_candidate_id_also_in_narrow_ledger_rows"],
        "github_fix_pr_state_verified_rows": totals["fix_pr_state_from_github"],
        "historical_open_labels_now_verified_merged": totals["historical_open_labels_now_verified_merged"],
        "github_fix_pr_checkpoint_checked_at_utc": checkpoint["checked_at_utc"],
        "github_fix_pr_checkpoint_entries": len(status_by_pr),
        "unresolved_discovery_or_fix_evidence": dict(sorted(unresolved.items())),
        "audited_rows_sha256": audit_report["audited_rows_sha256"],
        "head_900_first_parent": anchor.get("head_sha"),
        "oldest_900_first_parent": anchor.get("oldest_sha"),
        "historical_463_distinct_defects_recomputed": None,
        "fresh_comparable_900_density": None,
        "current_vs_previous_delta": None,
        "interpretation": (
            "Review ID is only a candidate distinct discovery identity, not a "
            "verified 463-count reconstruction. PR merge status is separate "
            "fix lifecycle data. Unknown GitHub statuses remain unknown; an "
            "original workbook 'open' label is not current state. No historical "
            "or recent defect counts or LOC are spliced together."
        ),
    }
    return summary, positive


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--historical-root", type=Path,
                   default=Path("docs/engineering/aspects-historical"))
    p.add_argument("--audited-rows", type=Path, required=True)
    p.add_argument("--pin-report", type=Path, required=True)
    p.add_argument("--new-ledger", type=Path,
                   default=Path("docs/engineering/aspects-review-ledger.jsonl"))
    p.add_argument("--pr-states", type=Path, required=True)
    p.add_argument("--json-out", type=Path, required=True)
    p.add_argument("--rows-out", type=Path, required=True)
    args = p.parse_args()
    verify(args.historical_root)
    events = []
    for shard in sorted((args.historical_root / "review-events").glob("*.jsonl")):
        events.extend(read_records(shard))
    audit = read_records(args.audited_rows)
    ledger = read_records(args.new_ledger)
    report, positive = reconcile(
        events, audit,
        json.loads(args.pin_report.read_text(encoding="utf-8")),
        ledger,
        json.loads(args.pr_states.read_text(encoding="utf-8")))
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.rows_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    args.rows_out.write_text(
        "".join(json.dumps(item, sort_keys=True) + "\n" for item in positive), encoding="utf-8")
    print(json.dumps(report, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
