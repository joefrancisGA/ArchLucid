#!/usr/bin/env python3
"""Prove unchanged same-path line identity across ALL intervening first-parent commits.

Neither this evidence nor derived-commit source lines constitute original
workbook pin verification, proof of a review event, or density numerator/denominator.
"""
from __future__ import annotations
from pathlib import Path
from typing import Callable
from aspects_reconcile_historical_lineage import unique_unchanged_pairs
from aspects_validate_historical_pins import git


def git_verified_changed_first_parent_orders(
    repo: Path, ordered_shas: list[str], path: str, a: int, b: int,
) -> tuple[set[int] | None, str | None]:
    """Index all same-path first-parent changes, including intervening reverts.

    --full-history is essential: endpoint-equal content is not proof that an
    intermediate commit did not modify (and subsequently revert) a line.
    Returns the chronological index of each *newer* commit on a changed edge.
    Caller must have independently reproduced the COMPLETE ordered SHA chain.
    """
    if (not path or not isinstance(path, str) or
            not (0 <= a < len(ordered_shas) and 0 <= b < len(ordered_shas))):
        return None, "invalid_path_history_coordinates"
    low, high = sorted((a, b))
    if low == high:
        return set(), None
    ok, raw = git(repo, "log", "--first-parent", "--full-history",
                  "--no-renames", "--format=%H", ordered_shas[high],
                  "^" + ordered_shas[low], "--", path)
    if not ok:
        return None, "path_history_unavailable"
    allowed = {sha: i for i, sha in
               enumerate(ordered_shas[low + 1:high + 1], start=low + 1)}
    history = [line.strip() for line in raw.decode("ascii", "replace").splitlines()
               if line.strip()]
    if any(sha not in allowed for sha in history) or len(set(history)) != len(history):
        return None, "path_history_outside_anchored_first_parent"
    return {allowed[sha] for sha in history}, None


def trace_unique_first_parent_lines(
    ordered_shas: list[str], path: str, candidate_blob: str,
    candidate_order: int, original_blob: str, original_order: int,
    candidate_lines: set[int], tree_blob: Callable[[str, str], str | None],
    source_lines: Callable[[str], list[str] | None],
    max_edges: int = 128, max_blob_lines: int = 4000,
    changed_orders: set[int] | None = None,
) -> tuple[dict[int, int], str | None, int]:
    """Trace unique exact equal-hunk nonblank lines across every Git parent edge.

    Fail closed for missing paths, altered lines, duplicate-content ambiguity
    and bounded complexity; renames or edits-and-reverts are not inferred.
    """
    if (not path or not candidate_lines
            or any(type(n) is not int or n <= 0 for n in candidate_lines)
            or not (0 <= candidate_order < len(ordered_shas))
            or not (0 <= original_order < len(ordered_shas))):
        return {}, "invalid_chain_coordinates", 0
    edges = abs(candidate_order - original_order)
    if edges == 0:
        return {}, "same_commit_without_distinct_revision", 0
    # In dense mode check every tree edge. Sparse mode accepts ONLY a
    # Git-derived full-history path-change index from the independently
    # attested first-parent chain; it never trusts endpoint equality alone.
    low, high = sorted((candidate_order, original_order))
    if changed_orders is None:
        if edges > max_edges:
            return {}, "distance_cap", edges
    else:
        if (not isinstance(changed_orders, set)
                or any(type(i) is not int or not (low < i <= high)
                       for i in changed_orders)):
            return {}, "invalid_path_change_index", edges
        if len(changed_orders) > max_edges:
            return {}, "change_cap", edges
    if (tree_blob(ordered_shas[candidate_order], path) != candidate_blob
            or tree_blob(ordered_shas[original_order], path) != original_blob):
        return {}, "review_commit_tree_mismatch", edges
    live = {n: n for n in candidate_lines}
    position = candidate_order
    current_blob = candidate_blob
    step = 1 if original_order > candidate_order else -1
    for _ in range(edges):
        next_position = position + step
        # A path-unchanged edge is attested by Git's complete first-parent
        # --full-history diff, including intervening edit-and-revert commits.
        # Never use a caller-supplied incomplete index as proof.
        if (changed_orders is not None
                and max(position, next_position) not in changed_orders):
            position = next_position
            continue
        next_blob = tree_blob(ordered_shas[next_position], path)
        if next_blob is None:
            return {}, "missing_intermediate_path", edges
        if next_blob != current_blob:
            before, after = source_lines(current_blob), source_lines(next_blob)
            if before is None or after is None:
                return {}, "missing_or_non_utf8_blob", edges
            if (max(len(before), len(after)) > max_blob_lines
                    or len(before) * len(after) > 2_000_000):
                return {}, "complexity_cap", edges
            edge_map = dict(unique_unchanged_pairs(before, after))
            live = {origin: edge_map[line] for origin, line in live.items()
                    if line in edge_map}
        current_blob = next_blob
        position = next_position
        if not live:
            break
    if current_blob != original_blob and live:
        return {}, "destination_blob_mismatch", edges
    return live, None, edges
