#!/usr/bin/env python3
"""Audit strict original-pinned historical 900-window vs follow-on Git reviews.

This is a SAME path/blob/line comparison within one attested historical first-
parent SHA cohort. It cannot verify cross-revision uniqueness, include newer
review baselines, or calculate a historical+recent density.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import json
from pathlib import Path

from aspects_reconcile_historical_corpus import verify_recent, load_corpus
from aspects_reconcile_recovered_candidates import intervals
from aspects_review_evidence import read_records
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256, git


def checked_historical_chain(repo: Path, checkpoint: dict) -> list[str]:
    """Reproduce the anchor from Git; do not trust a status label alone."""
    anchor = checkpoint.get("first_parent_checkpoint")
    if not isinstance(anchor, dict) or anchor.get("status") != "verified_first_parent_sha_membership":
        raise ValueError("historical first-parent checkpoint not verified")
    head, oldest, size = (anchor.get("head_sha"), anchor.get("oldest_sha"),
                          anchor.get("first_parent_commits"))
    if (not isinstance(head, str) or len(head) != 40
            or not isinstance(oldest, str) or len(oldest) != 40
            or type(size) is not int or size < 1):
        raise ValueError("historical anchor is incomplete")
    ok, raw = git(repo, "rev-list", "--first-parent", f"--max-count={size}", head)
    history = raw.decode("ascii", "replace").splitlines() if ok else []
    if (len(history) != size or history[0] != head or history[-1] != oldest
            or len(set(history)) != size):
        raise ValueError("historical first-parent Git chain differs from audited checkpoint")
    return history


def reconcile(pins: list[dict], report: dict, recent: list[dict],
              historical_commits: list[str], original_rows: list[dict],
              expected_rows: int = 5741, first_excel_row: int = 7) -> dict:
    """Exact identity intersection; out-of-window follow-ons never enter it."""
    anchor = report.get("first_parent_checkpoint", {})
    if (len(pins) != expected_rows
            or report.get("review_events_present") != expected_rows
            or audited_rows_sha256(pins) != report.get("audited_rows_sha256")
            or sorted(row.get("excel_row") for row in pins)
                != list(range(first_excel_row, first_excel_row + expected_rows))):
        raise ValueError("missing, repeated or changed historical pin audit rows")
    if (not historical_commits or len(set(historical_commits)) != len(historical_commits)
            or len(historical_commits) != anchor.get("first_parent_commits")
            or historical_commits[0] != anchor.get("head_sha")
            or historical_commits[-1] != anchor.get("oldest_sha")
            or anchor.get("status") != "verified_first_parent_sha_membership"):
        raise ValueError("historical source-pin and cohort anchors differ")
    # Audit output intentionally excludes workbook defect labels. Join to
    # the immutable, corpus-verified original events by Excel row; never
    # interpret a missing field as a clean review with zero defects.
    if (not isinstance(original_rows, list) or len(original_rows) != expected_rows
            or any(type(row.get("excel_row")) is not int for row in original_rows)):
        raise ValueError("missing or malformed immutable historical review rows")
    original_by_excel = {row["excel_row"]: row for row in original_rows}
    if (len(original_by_excel) != expected_rows
            or set(original_by_excel) !=
            set(range(first_excel_row, first_excel_row + expected_rows))):
        raise ValueError("immutable historical review Excel IDs missing or duplicated")
    original_clean = 0
    for audit_row in pins:
        original = original_by_excel[audit_row["excel_row"]]
        if (original.get("reviewed_master_sha") != audit_row.get("reviewed_master_sha")
                or original.get("review_id") != audit_row.get("review_id")
                or type(original.get("defects_recorded")) is not int
                or original["defects_recorded"] < 0):
            raise ValueError("immutable historical review identity/defect count disagrees with audit")
        original_clean += original["defects_recorded"] == 0
    if expected_rows == 5741 and original_clean != 4864:
        raise ValueError("immutable 5741-row corpus missing expected 4864 clean reviews")
    members = set(historical_commits)
    # Raw discovery labels are candidate identifiers only. A same-spelling
    # label is useful corroboration; a fixing PR number, matching suffix, or
    # merged fix is never treated as an independent defect discovery.
    historical_positive_labels: dict[str, list[int]] = defaultdict(list)
    for original in original_rows:
        if (original["reviewed_master_sha"] in members
                and original["defects_recorded"] > 0):
            label = original.get("review_id")
            if isinstance(label, str) and label.strip():
                historical_positive_labels[label].append(original["excel_row"])
    historical: dict[tuple[str, str], set[int]] = defaultdict(set)
    original_review_rows = original_clean_rows = 0
    for row in pins:
        in_window = row.get("reviewed_master_sha") in members
        if (row.get("window_membership") == "in_window") != in_window:
            raise ValueError(f"historical membership drift at Excel row {row['excel_row']}")
        if not in_window or row.get("pin_status") != VERIFIED:
            continue
        sources = row.get("pinned_sources")
        if sources is None:
            sources = [row]
        if not isinstance(sources, list) or not sources:
            raise ValueError("invalid original-pinned source array")
        for source in sources:
            path, blob = source.get("path"), source.get("blob")
            if not isinstance(path, str) or not path or not isinstance(blob, str) or len(blob) != 40:
                raise ValueError("original-pinned source identity unavailable")
            historical[(path, blob)].update(intervals(source, "spans"))
        original_review_rows += 1
        if original_by_excel[row["excel_row"]]["defects_recorded"] == 0:
            original_clean_rows += 1

    narrowed = defaultdict(set)
    excluded = 0
    in_window_records = 0
    in_window_clean_records = 0
    in_window_defect_ids = set()
    for row in recent:
        if row.get("verified") is not True:
            raise ValueError("follow-on rows must be independently Git-verified first")
        if row.get("baseline") not in members:
            excluded += 1
            continue
        path, blob = row.get("path"), row.get("blob")
        if not isinstance(path, str) or not path or not isinstance(blob, str) or len(blob) != 40:
            raise ValueError("invalid follow-on Git source identity")
        narrowed[(path, blob)].update(intervals(row, "spans"))
        in_window_records += 1
        if row.get("defect_id"):
            in_window_defect_ids.add(row["defect_id"])
        else:
            in_window_clean_records += 1
    recent_unique = sum(map(len, narrowed.values()))
    exact_overlap = sum(len(lines & historical.get(key, set()))
                        for key, lines in narrowed.items())
    original_unique = sum(map(len, historical.values()))
    shared_labels = sorted(in_window_defect_ids & set(historical_positive_labels))
    followon_labels_without_verbatim_match = sorted(
        in_window_defect_ids - set(historical_positive_labels))
    if exact_overlap > recent_unique:
        raise ValueError("exact source-line overlap exceeds follow-on coverage")
    return {
        "status": "source_audited_original_pins_vs_git_verified_followon_exact_only",
        "confidence": "source_audited_but_cross_revision_lineage_unresolved",
        "historical_cohort": {
            "definition": "original_historical_900_first_parent_including_head",
            "head_sha": historical_commits[0],
            "oldest_included_sha": historical_commits[-1],
            "first_parent_commits": len(historical_commits),
        },
        "historical_rows_imported": len(pins),
        "historical_clean_reviews_all_history": original_clean,
        "historical_positive_reviews_all_history_not_distinct_defects":
            len(original_rows) - original_clean,
        "original_pinned_review_rows_in_historical_cohort": original_review_rows,
        "original_pinned_clean_review_rows_in_historical_cohort": original_clean_rows,
        "original_pinned_unique_exact_path_blob_lines": original_unique,
        "followon_git_verified_records_all_history": len(recent),
        "followon_records_with_baseline_outside_historical_cohort": excluded,
        "followon_records_with_baseline_inside_historical_cohort": in_window_records,
        "followon_clean_records_in_historical_cohort": in_window_clean_records,
        "followon_candidate_defect_ids_in_historical_cohort": sorted(in_window_defect_ids),
        "historical_positive_candidate_labels_in_historical_cohort": len(historical_positive_labels),
        "followon_verbatim_candidate_labels_also_in_historical_window": shared_labels,
        "followon_verbatim_label_source_excel_rows": {
            label: historical_positive_labels[label] for label in shared_labels
        },
        "followon_candidate_labels_without_verbatim_historical_match":
            followon_labels_without_verbatim_match,
        "discovery_label_provenance": (
            "Case-sensitive exact original review_id string only; match means "
            "candidate label repeat, NOT independently verified same defect. "
            "No mapping through fixing PRs, numeric suffixes or fuzzy names."
        ),
        "followon_unique_exact_path_blob_lines_in_historical_cohort": recent_unique,
        "followon_exact_repeat_with_original_pins": exact_overlap,
        "followon_exact_identities_not_in_original_pins": recent_unique - exact_overlap,
        "followon_outside_pinned_lines_not_proven_cross_revision_new": True,
        "newly_verified_reviewed_loc_from_this_reconciliation": 0,
        "new_comparable_900_density": None,
        "new_verified_distinct_defects": None,
        "merged_historical_and_followon_denominator": None,
        "warning": (
            "Same path/blob/line overlap is proven only for original Git-audited pins "
            "and follow-on records whose baseline belongs to the SAME historical "
            "first-parent window. Newer baselines and changed blobs require a separately "
            "attested contemporary cohort and complete source lineage before a density."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--historical-root", type=Path,
                        default=Path("docs/engineering/aspects-historical"))
    parser.add_argument("--pin-rows", type=Path, required=True)
    parser.add_argument("--pin-report", type=Path, required=True)
    parser.add_argument("--ledger", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()
    pins = read_records(args.pin_rows)
    report = json.loads(args.pin_report.read_text(encoding="utf-8"))
    original_rows = load_corpus(args.historical_root)
    history = checked_historical_chain(args.repo, report)
    recent = verify_recent(args.repo, read_records(args.ledger))
    outcome = reconcile(pins, report, recent, history, original_rows)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(outcome, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    print(json.dumps(outcome, sort_keys=True))


if __name__ == "__main__":
    main()
