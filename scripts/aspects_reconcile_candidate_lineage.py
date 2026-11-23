#!/usr/bin/env python3
"""Provisional SAME-PATH cross-revision matches for recovered source candidates.

Input audits are complete, SHA-bound, and separately verify original workbook
pins versus sources derived at the historical review commit. Matching unchanged
unique text between two Git blobs is *not* proof of an identical reviewed line
through intervening commits. This is a diagnostic only; denominator delta is 0.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import json
from pathlib import Path

from aspects_reconcile_recovered_candidates import reconcile as reconcile_exact, intervals
from aspects_reconcile_historical_lineage import blob_lines, unique_unchanged_pairs
from aspects_verify_first_parent_lineage import (trace_unique_first_parent_lines,
                                                git_verified_changed_first_parent_orders)
from aspects_validate_historical_pins import git, VERIFIED


def candidate_lineage(repo: Path, pinned: list[dict], pin_report: dict,
                      candidates: list[dict], candidate_report: dict,
                      expected_records: int = 5741,
                      max_blob_lines: int = 4000) -> dict:
    exact = reconcile_exact(pinned, pin_report, candidates, candidate_report,
                            expected_records=expected_records)
    result = {
        "status": "blocked_on_evidence",
        "confidence": "provisional_same_path_unchanged_unique_line_candidates_only",
        "new_original_pin_verified_loc": 0,
        "new_distinct_defects": 0,
        "new_comparable_900_density": None,
    }
    if exact.get("status") != "provisional_exact_path_blob_candidate_overlap_reconciled":
        result["blocking_reason"] = exact.get("blocking_reason", "Exact audit failed")
        return result

    anchor = pin_report["first_parent_checkpoint"]
    length = anchor["first_parent_commits"]
    if type(length) is not int or length <= 0:
        result["blocking_reason"] = "Malformed first-parent length"
        return result
    ok, raw = git(repo, "rev-list", "--first-parent", f"--max-count={length}",
                  anchor["head_sha"])
    commits = raw.decode("ascii", "replace").splitlines() if ok else []
    if (len(commits) != length or commits[-1] != anchor["oldest_sha"]
            or len(set(commits)) != length):
        result["blocking_reason"] = "Git first-parent chain not independently reproducible"
        return result
    order = {sha: length - 1 - i for i, sha in enumerate(commits)}
    chronological_commits = list(reversed(commits))
    original: dict[tuple[str, str], set[int]] = defaultdict(set)
    derived: dict[tuple[str, str], set[int]] = defaultdict(set)
    first_original: dict[tuple[str, str], int] = {}
    first_derived: dict[tuple[str, str], int] = {}
    # An artifact digest detects cross-run changes, but cannot authenticate the
    # blob chosen by a candidate. Recheck every in-window derived source
    # against the tree of its own *reported review commit* before comparison.
    derived_tree_cache: dict[tuple[str, str], str | None] = {}
    blob_cache: dict[str, list[str] | None] = {}
    derived_components_attested = 0
    derived_nonblank_occurrences_attested = 0
    try:
        for row in pinned:
            if row.get("pin_status") != VERIFIED or row.get("window_membership") != "in_window":
                continue
            sha = row["reviewed_master_sha"]
            if sha not in order:
                raise ValueError("Original source row absent from independently checked window")
            for s in row.get("pinned_sources") or [row]:
                key = (s["path"], s["blob"])
                original[key].update(intervals(s, "spans"))
                first_original[key] = min(first_original.get(key, order[sha]), order[sha])
        for row in candidates:
            if (row.get("status") != "git_source_at_review_commit_candidate_only"
                    or row.get("window_membership") != "in_900_first_parent_window"):
                continue
            sha = row["reviewed_master_sha"]
            if sha not in order:
                raise ValueError("Candidate row absent from independently checked window")
            for s in row["sources"]:
                path, blob = s["path"], s["blob_derived_at_reviewed_commit"]
                key = (path, blob)
                selected = intervals(s, "nonblank_intervals_at_reviewed_commit")
                commit_path = (sha, path)
                if commit_path not in derived_tree_cache:
                    ok, raw_blob = git(repo, "rev-parse", "--verify", f"{sha}:{path}")
                    derived_tree_cache[commit_path] = (
                        raw_blob.decode("ascii", "replace").strip() if ok else None
                    )
                if derived_tree_cache[commit_path] != blob:
                    raise ValueError("Derived path/blob differs from Git tree at reported review commit")
                source_lines = blob_lines(repo, blob, blob_cache)
                if (source_lines is None or not selected or max(selected) > len(source_lines)
                        or any(not source_lines[n - 1].lstrip("\ufeff").strip()
                               for n in selected)):
                    raise ValueError("Derived nonblank intervals do not match Git source bytes")
                derived_components_attested += 1
                derived_nonblank_occurrences_attested += len(selected)
                derived[key].update(selected)
                first_derived[key] = min(first_derived.get(key, order[sha]), order[sha])
    except (KeyError, TypeError, ValueError) as exc:
        result["blocking_reason"] = f"Malformed source identity: {exc}"
        return result

    only: dict[tuple[str, str], set[int]] = {
        key: lines - original.get(key, set()) for key, lines in derived.items()
    }
    expected_only = exact["candidate_exact_path_blob_line_identities_not_in_original_pins"]
    if sum(map(len, only.values())) != expected_only:
        result["blocking_reason"] = "Candidate exact-only population disagrees with SHA-bound overlap audit"
        return result

    path_sources: dict[str, list[tuple[int, str, set[int]]]] = defaultdict(list)
    for (path, blob), lines in original.items():
        path_sources[path].append((first_original[(path, blob)], blob, lines))
    matches = set()
    cache = blob_cache
    adjacent_matches = set()
    first_parent_proven_matches = set()
    first_parent_edges_checked = first_parent_pairs_checked = first_parent_pairs_skipped = 0
    first_parent_skip_reasons = defaultdict(int)
    first_parent_changed_edges_checked = 0
    first_parent_unchanged_edges_attested_by_git_history = 0
    path_history_cache = {}
    compared = skipped = 0
    skipped_reasons = defaultdict(int)
    def tree_blob_at_commit(commit_sha: str, path: str) -> str | None:
        key = (commit_sha, path)
        if key not in derived_tree_cache:
            ok, payload = git(repo, "rev-parse", "--verify", f"{commit_sha}:{path}")
            derived_tree_cache[key] = payload.decode("ascii", "replace").strip() if ok else None
        return derived_tree_cache[key]

    def source_lines(blob: str) -> list[str] | None:
        return blob_lines(repo, blob, cache)

    # Compare at most the two closest original-pinned blob identities to each
    # derived candidate. Transitive historical source lineage is NOT asserted.
    for (path, candidate_blob), selected in sorted(only.items()):
        if not selected or not path_sources.get(path):
            continue
        neighbors = sorted(path_sources[path],
                           key=lambda p: (abs(p[0] - first_derived[(path, candidate_blob)]),
                                          p[0], p[1]))[:2]
        candidate_source = blob_lines(repo, candidate_blob, cache)
        for original_order, original_blob, original_lines in neighbors:
            if original_blob == candidate_blob:
                continue  # Same blob: only same line number is an exact identity.
            source = blob_lines(repo, original_blob, cache)
            if source is None or candidate_source is None:
                skipped += 1
                skipped_reasons["missing_or_non_utf8_blob"] += 1
                continue
            if (max(len(source), len(candidate_source)) > max_blob_lines
                    or len(source) * len(candidate_source) > 2_000_000):
                skipped += 1
                skipped_reasons["complexity_cap"] += 1
                continue
            compared += 1
            if first_derived[(path, candidate_blob)] < original_order:
                pairs = ((a, b) for a, b in unique_unchanged_pairs(candidate_source, source))
            else:
                pairs = ((b, a) for a, b in unique_unchanged_pairs(source, candidate_source))
            comparable_pairs = []
            for candidate_line, original_line in pairs:
                if candidate_line in selected and original_line in original_lines:
                    identity = (path, candidate_blob, candidate_line)
                    matches.add(identity)
                    comparable_pairs.append((candidate_line, original_line))
                    if abs(first_derived[(path, candidate_blob)] - original_order) == 1:
                        adjacent_matches.add(identity)
            if comparable_pairs:
                candidate_order = first_derived[(path, candidate_blob)]
                path_history_key = (path, min(candidate_order, original_order),
                                    max(candidate_order, original_order))
                if path_history_key not in path_history_cache:
                    path_history_cache[path_history_key] = git_verified_changed_first_parent_orders(
                        repo, chronological_commits, path, candidate_order, original_order)
                changed_orders, history_error = path_history_cache[path_history_key]
                if history_error is not None:
                    first_parent_pairs_skipped += 1
                    first_parent_skip_reasons[history_error] += 1
                    continue
                traced, reason, edge_count = trace_unique_first_parent_lines(
                    chronological_commits, path, candidate_blob,
                    candidate_order, original_blob,
                    original_order, {a for a, _ in comparable_pairs},
                    tree_blob_at_commit, source_lines, max_blob_lines=max_blob_lines,
                    changed_orders=changed_orders)
                if reason is not None:
                    first_parent_pairs_skipped += 1
                    first_parent_skip_reasons[reason] += 1
                else:
                    first_parent_pairs_checked += 1
                    first_parent_edges_checked += edge_count
                    first_parent_changed_edges_checked += len(changed_orders)
                    first_parent_unchanged_edges_attested_by_git_history += (
                        edge_count - len(changed_orders))
                    for candidate_line, original_line in comparable_pairs:
                        if traced.get(candidate_line) == original_line:
                            first_parent_proven_matches.add((path, candidate_blob, candidate_line))
    if len(matches) > expected_only:
        raise RuntimeError("Provisional lineage exceeded candidate-only cohort")
    result.update({
        "status": "provisional_cross_revision_candidate_lineage",
        "window_definition": "original immutable 900-first-parent Git SHA cohort",
        "head_sha": anchor["head_sha"],
        "oldest_sha": anchor["oldest_sha"],
        "first_parent_commits": length,
        "candidate_exact_only_line_identities": expected_only,
        "derived_git_tree_source_components_attested": derived_components_attested,
        "derived_git_tree_nonblank_occurrences_attested": derived_nonblank_occurrences_attested,
        "candidate_only_matching_adjacent_first_parent_unchanged_unique_lines": len(adjacent_matches),
        "candidate_only_proven_same_path_first_parent_lineage_to_original_pin": len(first_parent_proven_matches),
        "candidate_only_provisional_equal_hunk_without_full_first_parent_proof": len(matches - first_parent_proven_matches),
        "first_parent_lineage_revision_pairs_checked": first_parent_pairs_checked,
        "first_parent_lineage_revision_pairs_skipped": first_parent_pairs_skipped,
        "first_parent_lineage_intermediate_edges_checked": first_parent_edges_checked,
        "first_parent_changed_path_edges_tree_verified": first_parent_changed_edges_checked,
        "first_parent_unchanged_path_edges_git_history_attested":
            first_parent_unchanged_edges_attested_by_git_history,
        "first_parent_path_history_index": (
            "git_log_first_parent_full_history_no_renames; all changed path edges "
            "checked with exact Git tree blobs; no inferred renames"),
        "first_parent_lineage_skipped_reasons": dict(sorted(first_parent_skip_reasons.items())),
        "candidate_only_matching_unique_unchanged_text_in_nearby_original_pins": len(matches),
        "candidate_only_remaining_without_such_match": expected_only - len(matches),
        "candidate_original_revision_pairs_compared": compared,
        "candidate_original_revision_pairs_skipped": skipped,
        "skipped_reasons": dict(sorted(skipped_reasons.items())),
        "interpretation": (
            "Endpoint equal-hunk matches are provisional. Separately reported "
            "full first-parent proof requires same-path Git blob identity and unique "
            "unchanged nonblank text through EVERY first-parent path change "
            "plus Git-attested unchanged edges, subject to strict caps. "
            "No renames or edits-and-reverts are inferred. Proven "
            "line identity is not proof of a derived review, and changes no "
            "independently verified LOC, historical denominator or defect numerator."
        ),
    })
    return result


def main() -> None:
    p = argparse.ArgumentParser()
    for name in ("pin-rows", "pin-report", "candidate-rows", "candidate-report"):
        p.add_argument("--" + name, type=Path, required=True)
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("--json-out", type=Path, required=True)
    p.add_argument("--expected-records", type=int, default=5741)
    args = p.parse_args()

    def jsonl(path: Path):
        return [json.loads(s) for s in path.read_text(encoding="utf-8").splitlines()
                if s.strip()]

    result = candidate_lineage(
        args.repo, jsonl(args.pin_rows), json.loads(args.pin_report.read_text()),
        jsonl(args.candidate_rows), json.loads(args.candidate_report.read_text()),
        expected_records=args.expected_records)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    print(json.dumps(result, sort_keys=True))
    if result["status"] != "provisional_cross_revision_candidate_lineage":
        raise SystemExit("::error::" + str(result.get("blocking_reason", "Unknown lineage error")))


if __name__ == "__main__":
    main()
