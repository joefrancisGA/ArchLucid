#!/usr/bin/env python3
"""Conservative cross-revision Aspects source-line reconciliation.

Operates ONLY on Git-verified, first-parent-member historical pin rows. A
matching source line is a *candidate* lineage match, not verification of the
historical review event, a distinct defect, or an independent 900-commit rate.
Unverified, missing and ambiguous rows never contribute to reported LOC.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from difflib import SequenceMatcher
import json
from pathlib import Path

from aspects_validate_historical_pins import git, first_parent_checkpoint, audited_rows_sha256, VERIFIED


class UnionFind:
    def __init__(self):
        self.parent = {}

    def find(self, x):
        self.parent.setdefault(x, x)
        p = self.parent[x]
        if p != x:
            self.parent[x] = self.find(p)
        return self.parent[x]

    def unite(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        self.parent[rb] = ra
        return True


def blob_lines(repo: Path, blob: str, cache: dict) -> list[str] | None:
    if blob not in cache:
        ok, raw = git(repo, "cat-file", "blob", blob)
        if not ok or b"\x00" in raw:
            cache[blob] = None
        else:
            try:
                cache[blob] = raw.decode("utf-8").splitlines()
            except UnicodeDecodeError:
                cache[blob] = None
    return cache[blob]


def unique_unchanged_pairs(before: list[str], after: list[str]):
    """Match only equal-hunk lines uniquely occurring in *both* file versions.

    Exact equal hunks are required; no fuzzy, shifted-by-text-only, copy/rename,
    or repeated-content matching is performed. Even these matches are
    provisional when Git revisions are separated by unreviewed commits.
    """
    old_counts, new_counts = Counter(before), Counter(after)
    matcher = SequenceMatcher(None, before, after, autojunk=False)
    for a, b, size in matcher.get_matching_blocks():
        for offset in range(size):
            old, new = a + offset, b + offset
            line = before[old]
            if line.strip() and old_counts[line] == 1 and new_counts[line] == 1:
                yield old + 1, new + 1


def reconcile(repo: Path, rows: list[dict], checkpoint: dict,
              pin_report: dict, max_blob_lines: int = 4000,
              expected_records: int = 5741,
              expected_first_excel_row: int | None = None) -> dict:
    result = {
        "status": "blocked_on_pin_window_validation",
        "confidence": "historical_workbook_plus_git_pins; cross_revision_candidates_provisional",
        "historical_900_density_recomputed": None,
        "historical_distinct_defects_reconciled": None,
        "recent_git_ledger_merged": False,
        "source_population": "Git-pin-verified rows with exact pinned 900-first-parent membership only",
    }
    # Fail closed if the aggregate pin classifications and the row-level
    # evidence come from different runs, or any audited span was modified.
    audit_digest = pin_report.get("audited_rows_sha256")
    if not isinstance(audit_digest, str) or audited_rows_sha256(rows) != audit_digest:
        result["blocking_reason"] = "Missing or mismatched row-level source-pin audit SHA-256"
        return result
    if (expected_first_excel_row is not None and
            sorted(row.get("excel_row") for row in rows) !=
            list(range(expected_first_excel_row, expected_first_excel_row + expected_records))):
        result["blocking_reason"] = "Historical Excel row range missing, duplicated, or inconsistent"
        return result
    anchor, members = first_parent_checkpoint(repo, checkpoint)
    old_anchor = pin_report.get("first_parent_checkpoint", {})
    if (members is None or old_anchor.get("status") != "verified_first_parent_sha_membership"
            or old_anchor.get("head_sha") != checkpoint.get("head_sha")
            or not isinstance(rows, list)
            or len(rows) != pin_report.get("review_events_present")
            or len(rows) != expected_records
            or len({r.get("excel_row") for r in rows}) != len(rows)):
        result["blocking_reason"] = "Full pin-audit rows and matching 900-first-parent Git anchor required"
        result["first_parent_checkpoint"] = anchor
        return result
    window_size = checkpoint.get("window_first_parent_commits", 900)
    ok, payload = git(repo, "rev-list", "--first-parent",
                      f"--max-count={window_size}", checkpoint["head_sha"])
    history = payload.decode("ascii", "replace").splitlines() if ok else []
    if len(history) != window_size or history[-1] != checkpoint["oldest_included_sha"]:
        result["blocking_reason"] = "Git history changed or incomplete since audit"
        return result
    chronological = {commit: window_size - 1 - i for i, commit in enumerate(history)}
    groups: dict[tuple[str, str], set[int]] = defaultdict(set)
    first_seen = {}
    excluded = Counter()
    eligible = 0
    total_occurrences = 0
    for row in rows:
        membership = row.get("window_membership")
        if membership != "in_window" or row.get("pin_status") != VERIFIED:
            excluded[(membership or "missing_membership") + ":" +
                     (row.get("pin_status") or "missing_pin_status")] += 1
            continue
        sha, path, blob = row.get("reviewed_master_sha"), row.get("path"), row.get("blob")
        spans = row.get("spans")
        if (sha not in members or not isinstance(path, str) or not path
                or not isinstance(blob, str) or not isinstance(spans, list)
                or not spans):
            result["blocking_reason"] = f"Malformed audited row {row.get('excel_row')}"
            return result
        key = (path, blob)
        selected = set()
        for pair in spans:
            if (not isinstance(pair, list) or len(pair) != 2
                    or type(pair[0]) is not int or type(pair[1]) is not int
                    or pair[0] < 1 or pair[1] < pair[0]
                    or pair[1] - pair[0] > 100000):
                result["blocking_reason"] = f"Invalid audited span at row {row['excel_row']}"
                return result
            selected.update(range(pair[0], pair[1] + 1))
        if len(selected) != row.get("nonblank_reviewed_loc"):
            result["blocking_reason"] = f"Audited LOC disagrees at row {row['excel_row']}"
            return result
        eligible += 1
        total_occurrences += len(selected)
        groups[key].update(selected)
        first_seen[key] = min(first_seen.get(key, chronological[sha]), chronological[sha])

    if eligible == 0:
        result.update({
            "status": "no_verified_review_pins_on_this_first_parent_window",
            "eligible_verified_review_rows": 0,
            "excluded_or_unverified_review_rows": len(rows),
            "excluded_classifications": dict(sorted(excluded.items())),
            "first_parent_checkpoint": anchor,
            "blocking_reason": "No independently Git-pin-verified historical rows qualify in the anchored window; not a zero-reviewed-LOC claim.",
        })
        return result

    files: dict[str, list[str]] = defaultdict(list)
    for path, blob in groups:
        files[path].append(blob)
    upper = sum(map(len, groups.values()))
    same_revision_repeats = total_occurrences - upper
    # Per-path maximum across one pinned blob is a descriptive floor only
    # under fixed-path identity (renames/copies have not been reconciled).
    pathwise_max = sum(max(len(groups[(path, blob)]) for blob in blobs)
                       for path, blobs in files.items())
    parents = UnionFind()
    blobs_cache = {}
    mapped_pairs = compared_pairs = skipped_pairs = 0
    skipped_reasons = Counter()
    for path, blobs in sorted(files.items()):
        blobs.sort(key=lambda blob: (first_seen[(path, blob)], blob))
        for old, new in zip(blobs, blobs[1:]):
            old_lines = blob_lines(repo, old, blobs_cache)
            new_lines = blob_lines(repo, new, blobs_cache)
            if old_lines is None or new_lines is None:
                skipped_pairs += 1
                skipped_reasons["unavailable_blob"] += 1
                continue
            if (max(len(old_lines), len(new_lines)) > max_blob_lines
                    or len(old_lines) * len(new_lines) > 2_000_000):
                skipped_pairs += 1
                skipped_reasons["source_comparison_complexity_cap"] += 1
                continue
            compared_pairs += 1
            for old_line, new_line in unique_unchanged_pairs(old_lines, new_lines):
                if parents.unite((path, old, old_line), (path, new, new_line)):
                    mapped_pairs += 1
    observed = ((path, blob, line) for (path, blob), lines in groups.items()
                for line in lines)
    mapped_union = len({parents.find(node) for node in observed})
    if not 0 <= mapped_union <= upper <= total_occurrences:
        raise RuntimeError("Internal union invariants violated")
    result.update({
        "status": "provisional_same_path_unique_unchanged_lineage",
        "eligible_verified_review_rows": eligible,
        "excluded_or_unverified_review_rows": len(rows) - eligible,
        "excluded_classifications": dict(sorted(excluded.items())),
        "verified_pin_line_occurrences_in_window": total_occurrences,
        "verified_unique_exact_path_blob_lines_in_window": upper,
        "verified_repeated_exact_path_blob_lines_in_window": same_revision_repeats,
        "per_path_max_one_revision_loc_descriptive_not_rename_safe": pathwise_max,
        "provisionally_mapped_unique_loc": mapped_union,
        "provisionally_mapped_additional_repeated_loc": upper - mapped_union,
        "unique_lineage_edges_connected": mapped_pairs,
        "adjacent_reviewed_revision_pairs_compared": compared_pairs,
        "adjacent_reviewed_revision_pairs_skipped": skipped_pairs,
        "skipped_reasons": dict(sorted(skipped_reasons.items())),
        "files_with_verified_pins": len(files),
        "path_blob_identities": len(groups),
        "first_parent_checkpoint": anchor,
        "window_definition": f"{window_size} first-parent SHAs including pinned head; only audited exact-SHA members",
        "interpretation": "Exact path/blob union is the independent verified-pin upper count. "
            "Provisional mapping merges uniquely occurring unchanged source lines in adjacent "
            "pinned same-path revisions only; not a proven lower bound or complete history. "
            "Historical 463/343492 checkpoint and recent ledger must remain separate.",
    })
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--rows", required=True, type=Path)
    parser.add_argument("--pin-report", required=True, type=Path)
    parser.add_argument("--state", type=Path,
                        default=Path("docs/engineering/aspects-historical-restoration-state.json"))
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()
    state = json.loads(args.state.read_text())
    checkpoint = state["last_900_first_parent_snapshot"]
    rows = [json.loads(line) for line in args.rows.read_text().splitlines() if line.strip()]
    pin_report = json.loads(args.pin_report.read_text())
    report = reconcile(args.repo, rows, checkpoint, pin_report,
                       expected_records=state["corpus_import"]["expected_records"],
                       expected_first_excel_row=state["source"]["first_excel_row"])
    payload = json.dumps(report, sort_keys=True, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(payload)
    print(payload)


if __name__ == "__main__":
    main()
