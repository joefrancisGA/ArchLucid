#!/usr/bin/env python3
"""Prove only source-line identities that survive every intervening first-parent edge.

The input is the immutable historical 900-window original-pin audit, NOT the
workbook's estimated 343492 LOC denominator or recovered candidate-only lines.
No defect identities, newly reviewed LOC, or comparable density are inferred.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path

from aspects_reconcile_historical_lineage import UnionFind, blob_lines
from aspects_reconcile_recovered_candidates import intervals
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256, git
from aspects_verify_first_parent_lineage import (
    git_verified_changed_first_parent_orders,
    trace_unique_first_parent_lines,
)


def reconcile(repo: Path, audit_rows: list[dict], audit: dict,
              expected_records: int = 5741, max_blob_lines: int = 4000) -> dict:
    if (len(audit_rows) != expected_records
            or audit.get("review_events_present") != expected_records
            or audited_rows_sha256(audit_rows) != audit.get("audited_rows_sha256")
            or len({r.get("excel_row") for r in audit_rows}) != expected_records):
        raise ValueError("historical source-pin rows missing, repeated, or altered")
    anchor = audit.get("first_parent_checkpoint", {})
    head, oldest, size = (anchor.get("head_sha"), anchor.get("oldest_sha"),
                          anchor.get("first_parent_commits"))
    if (anchor.get("status") != "verified_first_parent_sha_membership"
            or not isinstance(head, str) or len(head) != 40
            or not isinstance(oldest, str) or len(oldest) != 40
            or type(size) is not int or size < 2):
        raise ValueError("missing complete historical first-parent source audit anchor")
    ok, raw = git(repo, "rev-list", "--first-parent", f"--max-count={size}", head)
    newest = raw.decode("ascii", "replace").splitlines() if ok else []
    if (len(newest) != size or newest[0] != head or newest[-1] != oldest
            or len(set(newest)) != size):
        raise ValueError("historical first-parent Git chain is missing or mismatched")
    chronological = list(reversed(newest))
    orders = {sha: i for i, sha in enumerate(chronological)}
    grouped: dict[tuple[str, str], set[int]] = defaultdict(set)
    first_order: dict[tuple[str, str], int] = {}
    eligible = occurrences = 0
    for row in audit_rows:
        review_sha = row.get("reviewed_master_sha")
        in_window = review_sha in orders
        if (row.get("window_membership") == "in_window") != in_window:
            raise ValueError("historical Git audit window membership drift")
        if not in_window or row.get("pin_status") != VERIFIED:
            continue
        sources = row.get("pinned_sources")
        if sources is None:
            sources = [row]
        if not isinstance(sources, list) or not sources:
            raise ValueError("original pin source list missing")
        count = 0
        for source in sources:
            path, blob = source.get("path"), source.get("blob")
            if not isinstance(path, str) or not path or not isinstance(blob, str) or len(blob) != 40:
                raise ValueError("missing exact original path/blob evidence")
            selected = intervals(source, "spans")
            count += len(selected)
            key = (path, blob)
            grouped[key].update(selected)
            first_order[key] = min(orders[review_sha], first_order.get(key, orders[review_sha]))
        if count != row.get("nonblank_reviewed_loc"):
            raise ValueError("original audit nonblank reviewed LOC disagrees with source intervals")
        occurrences += count
        eligible += 1
    exact_unique = sum(map(len, grouped.values()))
    expected_unique = anchor.get("verified_nonblank_exact_path_blob_unique_loc_subset")
    if expected_unique is not None and exact_unique != expected_unique:
        raise ValueError("recomputed exact original-pin lines differ from audited 900 source checkpoint")
    by_path: dict[str, list[tuple[int, str]]] = defaultdict(list)
    for path, blob in grouped:
        by_path[path].append((first_order[(path, blob)], blob))
    parents = UnionFind()
    # Initialise the observed population: non-reviewed intermediate source
    # lines must never enter the measured union.
    for (path, blob), selected in grouped.items():
        for line in selected:
            parents.find((path, blob, line))
    blobs_cache: dict[str, list[str] | None] = {}
    tree_cache: dict[tuple[str, str], str | None] = {}
    changed_cache = {}
    def tree_blob(sha: str, path: str) -> str | None:
        key = (sha, path)
        if key not in tree_cache:
            verified, payload = git(repo, "rev-parse", "--verify", f"{sha}:{path}")
            tree_cache[key] = payload.decode("ascii", "replace").strip() if verified else None
        return tree_cache[key]
    def source_lines(blob: str) -> list[str] | None:
        return blob_lines(repo, blob, blobs_cache)

    checked = skipped = connections = path_edges = 0
    skipped_reasons = Counter()
    for path, versions in sorted(by_path.items()):
        versions.sort()
        for (start, old_blob), (end, new_blob) in zip(versions, versions[1:]):
            if start == end or old_blob == new_blob:
                skipped += 1
                skipped_reasons["ambiguous_revision_order"] += 1
                continue
            history_key = (path, start, end)
            if history_key not in changed_cache:
                changed_cache[history_key] = git_verified_changed_first_parent_orders(
                    repo, chronological, path, start, end)
            changed_orders, failure = changed_cache[history_key]
            if failure is not None:
                skipped += 1
                skipped_reasons[failure] += 1
                continue
            old_lines = grouped[(path, old_blob)]
            traced, failure, edge_count = trace_unique_first_parent_lines(
                chronological, path, old_blob, start, new_blob, end,
                old_lines, tree_blob, source_lines,
                max_blob_lines=max_blob_lines, changed_orders=changed_orders)
            if failure is not None:
                skipped += 1
                skipped_reasons[failure] += 1
                continue
            checked += 1
            path_edges += edge_count
            newer_selected = grouped[(path, new_blob)]
            for old_line, new_line in traced.items():
                if new_line in newer_selected and parents.unite(
                    (path, old_blob, old_line), (path, new_blob, new_line)
                ):
                    connections += 1
    verified_components = len({
        parents.find((path, blob, line))
        for (path, blob), selected in grouped.items() for line in selected
    })
    if (not 0 <= verified_components <= exact_unique <= occurrences
            or exact_unique - verified_components != connections):
        raise ValueError("verified first-parent observed line identity invariant failed")
    return {
        "status": "partial_original_pinned_first_parent_lineage_proved",
        "confidence": "Git original path/blob review pins plus every intervening first-parent path edge for counted matches",
        "historical_900_window": {
            "head_sha": head, "oldest_included_sha": oldest,
            "first_parent_commits": size,
        },
        "original_review_rows_imported": expected_records,
        "original_pinned_review_rows_in_window": eligible,
        "original_pinned_line_occurrences_in_window": occurrences,
        "original_pinned_unique_exact_path_blob_lines_in_window": exact_unique,
        "same_blob_repeated_occurrences_in_window": occurrences - exact_unique,
        "proven_first_parent_mapped_repeated_exact_source_identities": connections,
        "proven_first_parent_connected_source_components": verified_components,
        "revision_pairs_checked_full_first_parent": checked,
        "revision_pairs_unresolved": skipped,
        "revision_pairs_unresolved_reasons": dict(sorted(skipped_reasons.items())),
        "first_parent_edges_between_checked_original_revisions": path_edges,
        "unresolved_cross_revision_coverage": skipped > 0,
        "candidate_only_reviews_added": 0,
        "new_independently_reviewed_loc": 0,
        "new_verified_distinct_discoveries": None,
        "new_comparable_900_density": None,
        "interpretation": (
            "Only original Git-pin attested source-line mappings surviving every first-parent "
            "edge are counted as repeated identities. Exact reviewed-line union is not the "
            "full historical source lineage or a deduplicated whole-population denominator. "
            "Repeated path/blob identities after intervening edit-and-revert are content "
            "identities and do not by themselves prove continuous source-line lineage."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--audit-rows", type=Path, required=True)
    parser.add_argument("--audit-report", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()
    rows = [json.loads(s) for s in args.audit_rows.read_text(encoding="utf-8").splitlines()
            if s.strip()]
    report = json.loads(args.audit_report.read_text(encoding="utf-8"))
    result = reconcile(args.repo, rows, report)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
