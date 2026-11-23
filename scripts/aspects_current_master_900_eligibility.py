#!/usr/bin/env python3
"""Rebuild eligible original-pin and follow-on source coverage in a NEW master 900 window.

The historical pin audit remains immutable and separately anchored to its
original November 22 window. This diagnostic reclassifies its *Git-verified*
source pins against a independently reconstructed current master-base
first-parent chain. PR synthetic merge refs and PR feature-head revisions
are deliberately not used as the master population.

Coverage is exact path/blob/line only. Different blobs, candidate-only recovered
workbook rows, distinct discoveries and a current defect density remain unresolved.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path

from aspects_density_snapshot import cohort_identity
from aspects_reconcile_historical_corpus import load_corpus
from aspects_reconcile_recovered_candidates import intervals
from aspects_review_evidence import SHA, read_records, verified_observation
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256, git


def reconstruct_cohort(repo: Path, head: str, window: int = 900) -> dict:
    if not isinstance(head, str) or not SHA.fullmatch(head):
        raise ValueError("current master-base cohort requires an exact full Git commit SHA")
    if type(window) is not int or window < 1:
        raise ValueError("current cohort window must be a positive integer")
    ok, raw = git(repo, "rev-list", "--first-parent", f"--max-count={window}", head)
    shas = raw.decode("ascii", "replace").splitlines() if ok else []
    if (not shas or shas[0] != head or len(set(shas)) != len(shas)):
        raise ValueError("current master-base first-parent Git history unavailable")
    cohort = cohort_identity(shas, head, window)
    if cohort["status"] != "complete":
        raise ValueError("current master-base 900-first-parent window incomplete")
    return cohort


def reconcile(repo: Path, original_events: list[dict], audits: list[dict],
              audit_report: dict, followon: list[dict], cohort: dict,
              expected_rows: int = 5741, first_excel_row: int = 7) -> dict:
    if (not isinstance(cohort, dict) or cohort.get("status") != "complete"
            or cohort.get("definition") != "first_parent_including_head_newest_to_oldest"
            or not isinstance(cohort.get("ordered_shas"), list)):
        raise ValueError("complete source-backed rolling master first-parent cohort required")
    if cohort_identity(
            cohort["ordered_shas"], cohort["head_sha"],
            cohort["requested_commits"]) != cohort:
        raise ValueError("current master first-parent SHA sequence/digest mismatch")
    if (len(audits) != expected_rows or len(original_events) != expected_rows
            or audit_report.get("review_events_present") != expected_rows
            or audited_rows_sha256(audits) != audit_report.get("audited_rows_sha256")
            or sorted(x.get("excel_row") for x in audits)
                != list(range(first_excel_row, first_excel_row + expected_rows))):
        raise ValueError("historical original pin audit missing, repeated or corrupted rows")
    source_rows = {r.get("excel_row"): r for r in original_events}
    if (len(source_rows) != expected_rows or
            set(source_rows) != set(range(first_excel_row, first_excel_row + expected_rows))):
        raise ValueError("immutable workbook events missing or duplicated")
    original_clean_total = 0
    for audit in audits:
        orig = source_rows[audit["excel_row"]]
        if (orig.get("reviewed_master_sha") != audit.get("reviewed_master_sha")
                or orig.get("review_id") != audit.get("review_id")
                or type(orig.get("defects_recorded")) is not int
                or orig["defects_recorded"] < 0):
            raise ValueError("historical workbook event identity/defect label drift")
        original_clean_total += orig["defects_recorded"] == 0
    if expected_rows == 5741 and original_clean_total != 4864:
        raise ValueError("historical original clean review checkpoint changed")

    members = set(cohort["ordered_shas"])
    original_coverage: dict[tuple[str, str], set[int]] = defaultdict(set)
    recent_coverage: dict[tuple[str, str], set[int]] = defaultdict(set)
    source_verified_rows = original_eligible_rows = original_clean_in_window = 0
    original_occurrences = recent_occurrences = 0
    for row in audits:
        if row.get("reviewed_master_sha") not in members:
            continue
        original_eligible_rows += 1
        if source_rows[row["excel_row"]]["defects_recorded"] == 0:
            original_clean_in_window += 1
        if row.get("pin_status") != VERIFIED:
            continue
        pins = row.get("pinned_sources")
        if pins is None:
            pins = [row]
        if not isinstance(pins, list) or not pins:
            raise ValueError("original verified pin has no source intervals")
        occurrences = 0
        for pin in pins:
            path, blob = pin.get("path"), pin.get("blob")
            if (not isinstance(path, str) or not path or
                    not isinstance(blob, str) or not SHA.fullmatch(blob)):
                raise ValueError("historical original pin missing exact path/blob")
            selected = intervals(pin, "spans")
            original_coverage[(path, blob)].update(selected)
            occurrences += len(selected)
        if occurrences != row.get("nonblank_reviewed_loc"):
            raise ValueError("original source audited intervals and LOC disagree")
        original_occurrences += occurrences
        source_verified_rows += 1

    recent_in_window = recent_outside = recent_clean = 0
    recent_candidate_defect_ids = set()
    for row in followon:
        if row.get("baseline") not in members:
            recent_outside += 1
            continue
        if row.get("verified") is not True:
            raise ValueError("unverified follow-on row in current master cohort")
        expected = verified_observation(
            repo, row["baseline"], row["path"], row["spans"], row.get("defect_id")
        )
        if row.get("blob") != expected["blob"]:
            raise ValueError("follow-on Git path/blob changed at reported reviewed commit")
        selected = intervals(row, "spans")
        recent_coverage[(row["path"], row["blob"])].update(selected)
        recent_occurrences += len(selected)
        recent_in_window += 1
        if row.get("defect_id"):
            recent_candidate_defect_ids.add(row["defect_id"])
        else:
            recent_clean += 1
    old_unique = sum(map(len, original_coverage.values()))
    recent_unique = sum(map(len, recent_coverage.values()))
    exact_overlap = sum(
        len(lines & original_coverage.get(key, set()))
        for key, lines in recent_coverage.items()
    )
    exact_union = old_unique + recent_unique - exact_overlap
    if (not 0 <= exact_overlap <= recent_unique or
            not max(old_unique, recent_unique) <= exact_union <= old_unique + recent_unique or
            original_occurrences < old_unique or recent_occurrences < recent_unique):
        raise ValueError("current cohort exact coverage arithmetic invalid")
    return {
        "status": "partial_current_master_base_900_exact_pin_and_followon_reconciliation",
        "captured_utc": datetime.now(timezone.utc).isoformat(),
        "head_provenance": "explicit_PR_master_base_SHA_or_master_push_SHA_not_synthetic_merge_ref",
        "cohort": cohort,
        "original_historical_events_total": len(audits),
        "original_clean_events_all_history": original_clean_total,
        "original_events_in_current_master_900": original_eligible_rows,
        "original_clean_events_in_current_master_900": original_clean_in_window,
        "original_git_pinned_rows_eligible_in_current_900": source_verified_rows,
        "original_git_pinned_line_occurrences_current_900": original_occurrences,
        "original_git_pinned_unique_exact_path_blob_lines_current_900": old_unique,
        "original_same_blob_repeat_occurrences_current_900": original_occurrences - old_unique,
        "followon_records_all_history": len(followon),
        "followon_records_in_current_master_900": recent_in_window,
        "followon_records_outside_current_master_900": recent_outside,
        "followon_clean_events_in_current_master_900": recent_clean,
        "followon_line_occurrences_current_900": recent_occurrences,
        "followon_unique_exact_path_blob_lines_current_900": recent_unique,
        "followon_same_blob_repeat_occurrences_current_900": recent_occurrences - recent_unique,
        "followon_exact_path_blob_line_overlap_with_original_pins": exact_overlap,
        "followon_exact_unmatched_path_blob_line_identities": recent_unique - exact_overlap,
        "combined_exact_path_blob_line_union_only": exact_union,
        "followon_candidate_defect_ids_in_window": sorted(recent_candidate_defect_ids),
        "historical_candidate_only_recoveries_counted": 0,
        "distinct_defect_discoveries_verified": None,
        "full_cross_revision_unique_reviewed_loc": None,
        "new_comparable_900_density": None,
        "new_independently_verified_reviewed_loc_from_this_reconciliation": 0,
        "confidence": "original_git_pin_source_only_plus_reverified_followon_exact_path_blob; full_cross_revision_and_discoveries_unresolved",
        "interpretation": (
            "New CURRENT master-base first-parent membership and exact blob identity "
            "counts are diagnostics, not the workbook 463/343492 or an all-review "
            "cross-revision deduplicated denominator. Do not splice prior historical "
            "head, candidate-only recovered spans, or off-master feature commits."
        ),
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("--master-base-head", required=True)
    p.add_argument("--window", type=int, default=900)
    p.add_argument("--historical-root", type=Path, default=Path("docs/engineering/aspects-historical"))
    p.add_argument("--audit-rows", type=Path, required=True)
    p.add_argument("--audit-report", type=Path, required=True)
    p.add_argument("--ledger", type=Path, default=Path("docs/engineering/aspects-review-ledger.jsonl"))
    p.add_argument("--json-out", type=Path, required=True)
    args = p.parse_args()
    cohort = reconstruct_cohort(args.repo, args.master_base_head, args.window)
    original = load_corpus(args.historical_root)
    pinned = read_records(args.audit_rows)
    audit = json.loads(args.audit_report.read_text(encoding="utf-8"))
    recent = read_records(args.ledger)
    result = reconcile(args.repo, original, pinned, audit, recent, cohort)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    print(json.dumps({k: v for k, v in result.items() if k != "cohort"}, sort_keys=True))


if __name__ == "__main__":
    main()
