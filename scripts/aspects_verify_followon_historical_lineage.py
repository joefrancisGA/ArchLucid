#!/usr/bin/env python3
"""Bounded, Git-attested different-blob follow-on to original-pin line matches.

This diagnostic is restricted to one immutable historical 900-first-parent
cohort. It does not validate a review happened, reconcile defect discoveries,
or publish any additive LOC or new density.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path

from aspects_reconcile_historical_lineage import blob_lines
from aspects_reconcile_recovered_candidates import intervals
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256, git
from aspects_verify_first_parent_lineage import (
    git_verified_changed_first_parent_orders, trace_unique_first_parent_lines,
)
from aspects_review_evidence import read_records


def reconcile(repo: Path, pinned: list[dict], audit: dict,
              recent: list[dict], expected_rows: int = 5741,
              neighbor_limit: int = 2) -> dict:
    """Only prove identities with complete path history; no implied coverage."""
    if (len(pinned) != expected_rows
            or audit.get("review_events_present") != expected_rows
            or audited_rows_sha256(pinned) != audit.get("audited_rows_sha256")
            or len({r.get("excel_row") for r in pinned}) != expected_rows):
        raise ValueError("missing or modified original historical Git pin audit")
    anchor = audit.get("first_parent_checkpoint", {})
    head, oldest, count = (anchor.get("head_sha"),
                           anchor.get("oldest_sha"), anchor.get("first_parent_commits"))
    if (anchor.get("status") != "verified_first_parent_sha_membership"
            or not isinstance(head, str) or len(head) != 40
            or not isinstance(oldest, str) or len(oldest) != 40
            or type(count) is not int or count < 2 or neighbor_limit < 1):
        raise ValueError("historical first-parent anchor invalid")
    ok, payload = git(repo, "rev-list", "--first-parent", f"--max-count={count}", head)
    shas = payload.decode("ascii", "replace").splitlines() if ok else []
    if (len(shas) != count or shas[0] != head or shas[-1] != oldest
            or len(set(shas)) != count):
        raise ValueError("historical 900 first-parent chain could not be reproduced")
    ordered = list(reversed(shas))
    order = {sha: i for i, sha in enumerate(ordered)}
    original: dict[tuple[str, str, int], set[int]] = defaultdict(set)
    original_exact: dict[tuple[str, str], set[int]] = defaultdict(set)
    for row in pinned:
        sha = row.get("reviewed_master_sha")
        in_window = sha in order
        if (row.get("window_membership") == "in_window") != in_window:
            raise ValueError("historical source audit window membership drift")
        if not in_window or row.get("pin_status") != VERIFIED:
            continue
        sources = row.get("pinned_sources")
        if sources is None:
            sources = [row]
        if not isinstance(sources, list) or not sources:
            raise ValueError("malformed historical pinned source")
        for source in sources:
            path, blob = source.get("path"), source.get("blob")
            if not isinstance(path, str) or not path or not isinstance(blob, str):
                raise ValueError("malformed original path/blob")
            selected = intervals(source, "spans")
            original[(path, blob, order[sha])].update(selected)
            original_exact[(path, blob)].update(selected)
    by_path: dict[str, list[tuple[int, str, set[int]]]] = defaultdict(list)
    for (path, blob, i), selected in original.items():
        by_path[path].append((i, blob, selected))

    tree_cache: dict[tuple[str, str], str | None] = {}
    source_cache: dict[str, list[str] | None] = {}
    history_cache = {}
    def tree_blob(sha: str, path: str) -> str | None:
        key = (sha, path)
        if key not in tree_cache:
            valid, raw = git(repo, "rev-parse", "--verify", f"{sha}:{path}")
            tree_cache[key] = raw.decode("ascii", "replace").strip() if valid else None
        return tree_cache[key]
    def source_lines(blob: str) -> list[str] | None:
        return blob_lines(repo, blob, source_cache)

    verified_same_path_mappings = set()
    candidate_lines = set()
    exact_overlaps = set()
    in_window_records = outside_records = checked_pairs = skipped_pairs = 0
    changed_edges = 0
    skipped_reasons = Counter()
    for row in recent:
        if row.get("verified") is not True:
            raise ValueError("follow-on source record is not independently verified")
        sha = row.get("baseline")
        if sha not in order:
            outside_records += 1
            continue
        in_window_records += 1
        path, blob = row.get("path"), row.get("blob")
        if not isinstance(path, str) or not path or not isinstance(blob, str):
            raise ValueError("missing follow-on path/blob")
        if tree_blob(sha, path) != blob:
            raise ValueError("follow-on blob mismatch at reviewed commit")
        selected = intervals(row, "spans")
        lines = source_lines(blob)
        if (lines is None or max(selected) > len(lines)
                or any(not lines[n - 1].strip() for n in selected)):
            raise ValueError("follow-on reviewed intervals not nonblank Git source")
        exact = selected & original_exact.get((path, blob), set())
        exact_overlaps.update((path, blob, line) for line in exact)
        unexplained = selected - exact
        candidate_lines.update((path, blob, line) for line in unexplained)
        neighbors = sorted(
            (v for v in by_path.get(path, []) if v[1] != blob),
            key=lambda v: (abs(v[0] - order[sha]), v[0], v[1])
        )[:neighbor_limit]
        for orig_order, orig_blob, orig_lines in neighbors:
            if not unexplained:
                break
            if order[sha] == orig_order:
                raise ValueError("different blobs at same reviewed commit and path")
            key = (path, min(order[sha], orig_order),
                   max(order[sha], orig_order))
            if key not in history_cache:
                history_cache[key] = git_verified_changed_first_parent_orders(
                    repo, ordered, path, order[sha], orig_order)
            changed, error = history_cache[key]
            if error:
                skipped_pairs += 1
                skipped_reasons[error] += 1
                continue
            mapped, error, _ = trace_unique_first_parent_lines(
                ordered, path, blob, order[sha], orig_blob, orig_order,
                unexplained, tree_blob, source_lines, changed_orders=changed)
            if error:
                skipped_pairs += 1
                skipped_reasons[error] += 1
                continue
            checked_pairs += 1
            changed_edges += len(changed)
            for source_line, destination_line in mapped.items():
                if destination_line in orig_lines:
                    verified_same_path_mappings.add((path, blob, source_line))
    if not verified_same_path_mappings.issubset(candidate_lines):
        raise ValueError("proven lineage identities outside exact-only candidate population")
    return {
        "status": "partial_historical_followon_cross_blob_first_parent_proof",
        "confidence": "review_commit_Git_blob_plus_each_changed_first_parent_path_edge; same_path_only",
        "cohort": {"head_sha": head, "oldest_included_sha": oldest,
                   "first_parent_commits": count},
        "original_rows_audited": len(pinned),
        "followon_records_in_historical_cohort": in_window_records,
        "followon_records_outside_historical_cohort": outside_records,
        "followon_exact_overlap_line_identities": len(exact_overlaps),
        "followon_exact_unmatched_line_identities": len(candidate_lines),
        "followon_cross_blob_proven_repeat_identities": len(verified_same_path_mappings),
        "followon_exact_unmatched_without_proven_lineage":
            len(candidate_lines - verified_same_path_mappings),
        "cross_blob_revision_pairs_checked": checked_pairs,
        "cross_blob_revision_pairs_skipped": skipped_pairs,
        "cross_blob_revision_skip_reasons": dict(sorted(skipped_reasons.items())),
        "changed_first_parent_edges_reverified": changed_edges,
        "comparisons_per_followon_path_blob_bounded_to_nearest_original_pins":
            neighbor_limit,
        "not_proof_all_unmatched_are_new": True,
        "new_independently_reviewed_loc": 0,
        "new_verified_distinct_defects": None,
        "new_comparable_900_density": None,
        "note": (
            "Bounded nearest-source comparisons do not cover every old reviewed "
            "revision, do not identify renames, do not validate discoveries and "
            "do not establish a complete 900-first-parent denominator."
        ),
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("--pin-rows", type=Path, required=True)
    p.add_argument("--pin-report", type=Path, required=True)
    p.add_argument("--ledger", type=Path, required=True)
    p.add_argument("--json-out", type=Path, required=True)
    args = p.parse_args()
    report = reconcile(
        args.repo, read_records(args.pin_rows),
        json.loads(args.pin_report.read_text(encoding="utf-8")),
        read_records(args.ledger))
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    print(json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
