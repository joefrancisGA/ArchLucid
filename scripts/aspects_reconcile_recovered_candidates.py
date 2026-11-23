#!/usr/bin/env python3
"""Reconcile Git-at-commit historical recovery candidates against ORIGINAL blob pins.

Two provenance populations remain separate. This comparison only reports
exact path/blob/line intersections in the anchored 900-first-parent cohort;
it neither proves historical reviews nor cross-revision equivalence nor
reconstructs the 463/343492 legacy density.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path

from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256


def intervals(source: dict, field: str) -> set[int]:
    spans = source.get(field)
    if not isinstance(spans, list) or not spans:
        raise ValueError("Missing source interval array")
    lines = set()
    for span in spans:
        if (not isinstance(span, list) or len(span) != 2 or
                type(span[0]) is not int or type(span[1]) is not int or
                span[0] < 1 or span[1] < span[0] or span[1] > 200000):
            raise ValueError("Malformed source interval")
        lines.update(range(span[0], span[1] + 1))
    return lines


def reconcile(pinned: list[dict], pin_report: dict,
              candidates: list[dict], candidate_report: dict,
              expected_records: int = 5741) -> dict:
    result = {
        "status": "blocked_on_mismatched_evidence",
        "confidence": "cross_population_exact_path_blob_intersection_only",
        "historical_900_density_recomputed": None,
        "distinct_defect_ids_reconciled": None,
        "candidate_lines_added_to_verified_denominator": False,
    }

    def block(message: str):
        result["blocking_reason"] = message
        return result

    if not (isinstance(pinned, list) and isinstance(candidates, list)
            and len(pinned) == expected_records
            and isinstance(pin_report, dict) and isinstance(candidate_report, dict)):
        return block("Missing complete historical pin-audit or candidate artifacts")
    if (audited_rows_sha256(pinned) != pin_report.get("audited_rows_sha256")
            or audited_rows_sha256(candidates) != candidate_report.get("candidate_rows_sha256")):
        return block("Source-pin or candidate row-level SHA-256 disagrees with aggregate")
    pinned_by_row = {r.get("excel_row"): r for r in pinned}
    candidate_by_row = {r.get("excel_row"): r for r in candidates}
    if (len(pinned_by_row) != len(pinned) or len(candidate_by_row) != len(candidates)
            or any(type(x) is not int for x in pinned_by_row)
            or any(type(x) is not int for x in candidate_by_row)
            or not set(candidate_by_row).issubset(pinned_by_row)
            or len(candidates) != candidate_report.get("unparsed_historical_rows_examined")):
        return block("Historical row IDs are duplicated, missing, or inconsistent")
    pin_anchor = pin_report.get("first_parent_checkpoint", {})
    candidate_anchor = candidate_report.get("first_parent_checkpoint", {})
    if (pin_anchor.get("status") != "verified_first_parent_sha_membership"
            or candidate_anchor.get("status") != "verified_first_parent_sha_membership"
            or pin_anchor.get("head_sha") != candidate_anchor.get("head_sha")
            or pin_anchor.get("oldest_sha") != candidate_anchor.get("oldest_sha")
            or pin_anchor.get("first_parent_commits") != candidate_anchor.get("first_parent_commits")):
        return block("First-parent Git windows differ or are not independently anchored")

    pinned_union: dict[tuple[str, str], set[int]] = defaultdict(set)
    candidate_union: dict[tuple[str, str], set[int]] = defaultdict(set)
    pin_rows = candidate_rows = candidate_occurrences = 0
    candidate_same_revision_repeats = 0
    all_candidate_rows = all_candidate_occurrences = 0
    reasons = Counter()
    try:
        for record in pinned:
            if record.get("pin_status") != VERIFIED or record.get("window_membership") != "in_window":
                continue
            sources = record.get("pinned_sources")
            if sources is None:
                sources = [record]
            if not isinstance(sources, list) or not sources:
                return block("Malformed verified pinned row source array")
            for source in sources:
                path, blob = source.get("path"), source.get("blob")
                if not isinstance(path, str) or not path or not isinstance(blob, str) or not blob:
                    return block("Missing original path/blob identity")
                pinned_union[(path, blob)].update(intervals(source, "spans"))
            pin_rows += 1
        for record in candidates:
            source_row = pinned_by_row[record["excel_row"]]
            if (source_row.get("reviewed_master_sha") != record.get("reviewed_master_sha")
                    or record.get("original_blob_pinned") is not False):
                return block("Candidate source SHA/provenance differs from original import audit")
            original_window = source_row.get("window_membership")
            derived_window = record.get("window_membership")
            expected_window = (
                "in_900_first_parent_window" if original_window == "in_window" else
                "outside_900_first_parent_window" if original_window == "not_on_first_parent_window"
                else "unverified_anchor")
            if expected_window != derived_window:
                return block("Candidate window membership disagrees with pinned audit")
            if record.get("status") != "git_source_at_review_commit_candidate_only":
                reasons[record.get("status") or "missing_status"] += 1
                continue
            if source_row.get("pin_status") == VERIFIED:
                return block("Already verified original pinned row re-entered as recovered candidate")
            sources = record.get("sources")
            if not isinstance(sources, list) or not sources:
                return block("Candidate source evidence unavailable")
            selected_sources = []
            loc = 0
            for source in sources:
                path, blob = source.get("path"), source.get("blob_derived_at_reviewed_commit")
                if (not isinstance(path, str) or not path or
                        not isinstance(blob, str) or len(blob) != 40 or
                        source.get("original_blob_pinned") is not False):
                    return block("Candidate source missing derived identity/provenance")
                selected = intervals(source, "nonblank_intervals_at_reviewed_commit")
                if len(selected) != source.get("nonblank_loc"):
                    return block("Derived candidate line count contradicts intervals")
                selected_sources.append(((path, blob), selected))
                loc += len(selected)
            if loc != record.get("candidate_nonblank_loc"):
                return block("Derived candidate total contradicts row-level audit")
            all_candidate_rows += 1
            all_candidate_occurrences += loc
            if derived_window != "in_900_first_parent_window":
                continue
            candidate_rows += 1
            candidate_occurrences += loc
            for key, selected in selected_sources:
                candidate_same_revision_repeats += len(candidate_union[key] & selected)
                candidate_union[key].update(selected)
    except (KeyError, TypeError, ValueError) as exc:
        return block("Malformed candidate or original source intervals: " + str(exc))

    if (all_candidate_rows != candidate_report.get("candidate_rows", 0)
            or all_candidate_occurrences != candidate_report.get("candidate_line_occurrences", 0)
            or candidate_rows != candidate_report.get("in_window_candidate_rows", 0)
            or candidate_occurrences !=
            candidate_report.get("in_window_candidate_line_occurrences", 0)):
        return block("Candidate summary totals disagree with recomputed row evidence")

    pinned_unique = sum(map(len, pinned_union.values()))
    candidate_unique = sum(map(len, candidate_union.values()))
    overlap = sum(len(lines & pinned_union.get(key, set()))
                  for key, lines in candidate_union.items())
    candidate_only = candidate_unique - overlap
    if candidate_only < 0 or candidate_unique + candidate_same_revision_repeats != candidate_occurrences:
        return block("Exact-identity intersection arithmetic invariant violated")
    result.update({
        "status": "provisional_exact_path_blob_candidate_overlap_reconciled",
        "window_definition": "same anchored 900-first-parent SHAs; original pinned source vs commit-derived candidates",
        "original_pinned_verified_rows_in_window": pin_rows,
        "original_pinned_unique_exact_path_blob_loc": pinned_unique,
        "candidate_review_rows_in_window": candidate_rows,
        "candidate_line_occurrences_in_window": candidate_occurrences,
        "candidate_unique_exact_path_blob_loc_in_window": candidate_unique,
        "candidate_repeated_exact_path_blob_loc_within_window": candidate_same_revision_repeats,
        "candidate_exact_line_overlap_with_original_pins": overlap,
        "candidate_exact_path_blob_line_identities_not_in_original_pins": candidate_only,
        "excluded_or_unrecovered_rows_by_reason": dict(sorted(reasons.items())),
        "combined_verified_and_candidate_denominator": None,
        "published_historical_density": None,
        "interpretation": (
            "Candidate-only identities are NOT independently verified review "
            "coverage; not additional 900-window eligible LOC. Identical "
            "path/blob/line overlaps are exact. Different blob revisions "
            "remain unresolved and must not be assumed distinct or equal."
        ),
    })
    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pin-rows", type=Path, required=True)
    ap.add_argument("--pin-report", type=Path, required=True)
    ap.add_argument("--candidate-rows", type=Path, required=True)
    ap.add_argument("--candidate-report", type=Path, required=True)
    ap.add_argument("--state", type=Path, default=Path(
        "docs/engineering/aspects-historical-restoration-state.json"))
    ap.add_argument("--json-out", type=Path, required=True)
    args = ap.parse_args()
    state = json.loads(args.state.read_text(encoding="utf-8"))
    def load(path: Path) -> list[dict]:
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()
                if line.strip()]
    report = reconcile(
        load(args.pin_rows),
        json.loads(args.pin_report.read_text(encoding="utf-8")),
        load(args.candidate_rows),
        json.loads(args.candidate_report.read_text(encoding="utf-8")),
        expected_records=state["corpus_import"]["expected_records"],
    )
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    print(json.dumps(report, sort_keys=True, indent=2))
    if report["status"] != "provisional_exact_path_blob_candidate_overlap_reconciled":
        raise SystemExit("::error::Cannot reconcile candidate/source-pin evidence: " +
                         str(report.get("blocking_reason")))


if __name__ == "__main__":
    main()
