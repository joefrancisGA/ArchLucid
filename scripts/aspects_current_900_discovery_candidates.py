#!/usr/bin/env python3
"""Census of *candidate* defect labels inside the current master 900-first-parent cohort.

Review observations and fixing-PR lifecycle are different evidence. A workbook
review label, exact shared string, or merged fixing PR is not proof of a
distinct confirmed discovery. This script never supplies a density numerator.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path

from aspects_density_snapshot import cohort_identity
from aspects_current_master_900_eligibility import reconstruct_cohort
from aspects_reconcile_historical_corpus import load_corpus
from aspects_reconcile_historical_defect_ids import (
    ASPECTS_NAMESPACE, candidate_identity, referenced_fix_pr, load_fix_state,
)
from aspects_review_evidence import read_records


def _utc(value: object) -> datetime:
    if not isinstance(value, str):
        raise ValueError("fixing-PR timestamp must be UTC")
    try:
        timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("fixing-PR timestamp invalid") from exc
    if timestamp.utcoffset() != timezone.utc.utcoffset(timestamp):
        raise ValueError("fixing-PR timestamp not UTC")
    return timestamp


def census(events: list[dict], recent: list[dict], cohort: dict,
           pr_checkpoint: dict, expected_rows: int = 5741,
           first_excel_row: int = 7) -> dict:
    if (not isinstance(cohort, dict)
            or cohort.get("status") != "complete"
            or cohort_identity(cohort.get("ordered_shas"),
                               cohort.get("head_sha"),
                               cohort.get("requested_commits")) != cohort):
        raise ValueError("complete SHA-digested master first-parent cohort required")
    if (len(events) != expected_rows
            or sorted(row.get("excel_row") for row in events)
               != list(range(first_excel_row, first_excel_row + expected_rows))):
        raise ValueError("immutable historical Excel observation range missing or duplicated")
    if any(type(row.get("defects_recorded")) is not int
           or row["defects_recorded"] < 0 for row in events):
        raise ValueError("malformed original workbook discovery observation")
    clean = sum(row["defects_recorded"] == 0 for row in events)
    if expected_rows == 5741 and clean != 4864:
        raise ValueError("historical clean review population differs from immutable source")
    states = load_fix_state(pr_checkpoint)
    as_of = _utc(pr_checkpoint.get("checked_at_utc"))
    for state in states.values():
        checked = _utc(state.get("status_verified_at_utc"))
        if checked > as_of:
            raise ValueError("fixing-PR evidence checked after reported snapshot")
    members = set(cohort["ordered_shas"])
    original_positive = original_clean = 0
    original_candidates: dict[tuple[str, str], list[int]] = defaultdict(list)
    historical_fix_prs: dict[int, list[int]] = defaultdict(list)
    missing_fix_pr_rows = []
    unresolved_fix_states = []
    conflicting_fix_refs = []
    fix_counts = Counter()
    original_positive_observation_sum = 0
    for row in events:
        if row.get("reviewed_master_sha") not in members:
            continue
        if row["defects_recorded"] == 0:
            original_clean += 1
            continue
        original_positive += 1
        original_positive_observation_sum += row["defects_recorded"]
        typed = candidate_identity(row.get("review_id"))
        if typed is not None:
            original_candidates[typed].append(row["excel_row"])
        pr, evidence = referenced_fix_pr(row)
        if evidence == "conflicting_original_fix_pr_references":
            conflicting_fix_refs.append(row["excel_row"])
        if pr is None:
            missing_fix_pr_rows.append(row["excel_row"])
            continue
        historical_fix_prs[pr].append(row["excel_row"])
        state = states.get(pr)
        if state is None:
            unresolved_fix_states.append(pr)
            continue
        if state["merged"]:
            fix_counts["merged"] += 1
        elif state["state"] == "closed":
            fix_counts["closed_unmerged"] += 1
        else:
            fix_counts["open"] += 1

    in_window_recent = outside_recent = clean_recent = 0
    recent_labels: dict[str, int] = Counter()
    for row in recent:
        if row.get("baseline") not in members:
            outside_recent += 1
            continue
        if row.get("verified") is not True:
            raise ValueError("current-cohort follow-on discovery row lacks Git review verification")
        in_window_recent += 1
        value = row.get("defect_id")
        if value is None:
            clean_recent += 1
            continue
        if not isinstance(value, str) or not value.strip():
            raise ValueError("follow-on defect ID is missing or malformed")
        recent_labels[value] += 1

    # Only exactly matching ASPECTS-namespace labels are considered candidate
    # cross-ledger matches. A workbook '#123' and 'ASPECTS-123' are NOT aliases.
    historical_aspects_labels = {
        label for namespace, label in original_candidates
        if namespace == ASPECTS_NAMESPACE
    }
    same_exact = sorted(set(recent_labels) & historical_aspects_labels)
    unmatched = sorted(set(recent_labels) - historical_aspects_labels)
    repeat_candidates = [
        {"namespace": ns, "value": value, "excel_rows": rows}
        for (ns, value), rows in sorted(original_candidates.items())
        if len(rows) > 1
    ]
    namespaces = Counter(ns for ns, _ in original_candidates)
    return {
        "status": "current_master_base_900_provisional_discovery_identity_census",
        "captured_utc": datetime.now(timezone.utc).isoformat(),
        "cohort": {
            "definition": cohort["definition"],
            "status": cohort["status"],
            "head_sha": cohort["head_sha"],
            "oldest_included_sha": cohort["oldest_included_sha"],
            "requested_commits": cohort["requested_commits"],
            "actual_commits": cohort["actual_commits"],
            "ordered_shas_sha256": cohort["ordered_shas_sha256"],
            "digest_method": cohort["digest_method"],
        },
        "historical_events_imported": len(events),
        "historical_clean_reviews_all_history": clean,
        "original_clean_reviews_in_current_900": original_clean,
        "original_positive_review_rows_in_current_900": original_positive,
        "original_positive_observation_sum_not_distinct_defects":
            original_positive_observation_sum,
        "original_unique_typed_candidate_labels_in_current_900": len(original_candidates),
        "original_candidate_labels_by_namespace": dict(sorted(namespaces.items())),
        "original_repeated_typed_candidate_labels": len(repeat_candidates),
        "original_repeated_typed_label_sample": repeat_candidates[:30],
        "original_positive_rows_without_fix_pr_reference": len(missing_fix_pr_rows),
        "original_positive_rows_conflicting_fix_pr_reference": len(conflicting_fix_refs),
        "original_positive_row_missing_fix_pr_sample": missing_fix_pr_rows[:30],
        "original_positive_row_conflicting_fix_pr_sample": conflicting_fix_refs[:30],
        "fix_pr_references_distinct_not_discoveries": len(historical_fix_prs),
        "fix_pr_state_checkpoint_as_of_utc": pr_checkpoint["checked_at_utc"],
        "fix_pr_state_checkpoint_is_current": False,
        "fix_pr_lifecycle_rows_as_of_checkpoint": dict(sorted(fix_counts.items())),
        "fix_pr_references_missing_status_count": len(set(unresolved_fix_states)),
        "fix_pr_references_missing_status_sample": sorted(set(unresolved_fix_states))[:30],
        "followon_records_in_current_900": in_window_recent,
        "followon_records_outside_current_900": outside_recent,
        "followon_clean_records_in_current_900": clean_recent,
        "followon_unique_named_candidate_labels_in_current_900": len(recent_labels),
        "followon_exact_verbatim_aspects_namespace_matches": same_exact,
        "followon_labels_without_proven_historical_alias": unmatched,
        "followon_repeated_named_label_observations":
            sum(count - 1 for count in recent_labels.values()),
        "not_proof_of_distinct_discoveries": True,
        "fix_pr_merge_is_not_new_discovery": True,
        "no_cross_namespace_suffix_aliases": True,
        "current_verified_distinct_defect_ids": None,
        "current_verified_full_reviewed_loc": None,
        "new_comparable_900_density": None,
        "confidence": "immutable_original_workbook_candidate_labels_plus_timestamped_fix_lifecycle_and_narrow_git_reviews_not_distinct_discovery_verification",
        "interpretation": (
            "Workbook IDs are typed candidates, PR lifecycle is a separate prior-as-of "
            "checkpoint, and exact matching ASPECTS strings are candidate overlaps only. "
            "Do not equate a PR merge, repeated review or numeric suffix with a new "
            "or verified distinct defect. No contemporaneous whole-population numerator."
        ),
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("--master-base-head", required=True)
    p.add_argument("--window", type=int, default=900)
    p.add_argument("--historical-root", type=Path, default=Path("docs/engineering/aspects-historical"))
    p.add_argument("--ledger", type=Path, default=Path("docs/engineering/aspects-review-ledger.jsonl"))
    p.add_argument("--fix-pr-checkpoint", type=Path,
                   default=Path("docs/engineering/aspects-historical/fix-pr-state-checkpoints/2026-11-23-all-referenced.json"))
    p.add_argument("--json-out", type=Path, required=True)
    args = p.parse_args()
    cohort = reconstruct_cohort(args.repo, args.master_base_head, args.window)
    output = census(
        load_corpus(args.historical_root), read_records(args.ledger),
        cohort, json.loads(args.fix_pr_checkpoint.read_text(encoding="utf-8")))
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(output, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    print(json.dumps({k: v for k, v in output.items() if k not in
                      ("original_repeated_typed_label_sample",
                       "followon_labels_without_proven_historical_alias")},
                     sort_keys=True))


if __name__ == "__main__":
    main()
