#!/usr/bin/env python3
"""Focused, fail-closed first-parent lineage of workbook row12's 79 comparable lines.

All three original-pin reviews are kept at their actual reviewed commit and
spans; never use the union of spans as though it were present at the earliest
review of the same blob. All intervening path changes, including reverts, must
be traversed before a candidate line can be called a proven repeat.

The whole-file row12 source is Git-derived, NOT an original blob-pinned review.
No output field is a new reviewed LOC, 900 denominator, or defect discovery.
"""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path

from aspects_reconcile_historical_lineage import blob_lines
from aspects_reconcile_recovered_candidates import intervals
from aspects_validate_historical_pins import git, SHA
from aspects_verify_first_parent_lineage import (
    git_verified_changed_first_parent_orders, trace_unique_first_parent_lines,
)


def proof(repo: Path, original: dict, comparators: dict,
          expected_pinned_rows: int = 3, expected_factory_files: int = 5) -> dict:
    anchor = comparators.get("cohort")
    if not isinstance(anchor, dict):
        raise ValueError("missing original first-parent cohort")
    head, oldest, count = (
        anchor.get("head_sha"), anchor.get("oldest_sha"),
        anchor.get("first_parent_commits"))
    if (not isinstance(head, str) or not SHA.fullmatch(head)
            or not isinstance(oldest, str) or not SHA.fullmatch(oldest)
            or type(count) is not int or count < 2):
        raise ValueError("incomplete original 900-first-parent cohort")
    ok, data = git(repo, "rev-list", "--first-parent",
                   f"--max-count={count}", head)
    newest = data.decode("ascii", "replace").splitlines() if ok else []
    if (len(newest) != count or newest[0] != head or newest[-1] != oldest
            or len(set(newest)) != count):
        raise ValueError("original first-parent SHA chain cannot be reproduced")
    chronological = list(reversed(newest))
    order = {sha: i for i, sha in enumerate(chronological)}

    original_row, original_sha = original.get("excel_row"), original.get("reviewed_master_sha")
    if (original_row != comparators.get("candidate_excel_row")
            or original.get("review_id") != comparators.get("candidate_review_id")
            or original_sha != comparators.get("candidate_reviewed_master_sha")
            or original_sha not in order
            or original.get("original_blob_pinned") is not False
            or original.get("candidate_nonblank_loc_expected") !=
               original.get("workbook_reported_nonblank_loc")):
        raise ValueError("source-at-commit workbook row12 identity or cohort mismatch")
    sources = original.get("sources")
    pins = comparators.get("original_pinned_review_rows")
    if (not isinstance(sources, list) or len(sources) != expected_factory_files
            or not isinstance(pins, list) or len(pins) != expected_pinned_rows):
        raise ValueError("missing five source files or three original-pin reviews")
    tree_cache = {}
    blob_cache = {}
    def tree(sha: str, path: str) -> str | None:
        key = (sha, path)
        if key not in tree_cache:
            yes, raw = git(repo, "rev-parse", "--verify", f"{sha}:{path}")
            value = raw.decode("ascii", "replace").strip() if yes else ""
            tree_cache[key] = value if SHA.fullmatch(value) else None
        return tree_cache[key]
    def source(blob: str) -> list[str] | None:
        return blob_lines(repo, blob, blob_cache)

    by_path = {}
    candidate_nonblank_total = 0
    for item in sources:
        path, blob, count_nonblank = (
            item.get("path"), item.get("blob_derived_at_reviewed_commit"),
            item.get("reported_full_file_nonblank_loc"))
        if (not isinstance(path, str) or not path or path in by_path
                or not isinstance(blob, str) or not SHA.fullmatch(blob)
                or type(count_nonblank) is not int or count_nonblank < 1):
            raise ValueError("duplicate or invalid candidate factory source")
        if tree(original_sha, path) != blob:
            raise ValueError("candidate factory blob disagrees with original reviewed Git commit")
        lines = source(blob)
        if lines is None:
            raise ValueError("candidate factory Git blob is unreadable")
        selected = {i for i, line in enumerate(lines, start=1)
                    if line.lstrip("\ufeff").strip()}
        if len(selected) != count_nonblank:
            raise ValueError("original whole-factory nonblank count mismatches Git")
        candidate_nonblank_total += len(selected)
        by_path[path] = {"blob": blob, "selected": selected}
    if candidate_nonblank_total != original["candidate_nonblank_loc_expected"]:
        raise ValueError("five candidate factory nonblank totals do not match workbook")

    review_ids = set()
    eligible_path = None
    records = []
    for pin in pins:
        excel, pin_sha, path, blob = (
            pin.get("excel_row"), pin.get("reviewed_master_sha"),
            pin.get("path"), pin.get("blob"))
        if (type(excel) is not int or excel in review_ids
                or pin_sha not in order or order[pin_sha] <= order[original_sha]
                or path not in by_path
                or not isinstance(blob, str) or not SHA.fullmatch(blob)):
            raise ValueError("original pin review identity or first-parent membership invalid")
        review_ids.add(excel)
        if eligible_path is None:
            eligible_path = path
        if path != eligible_path:
            raise ValueError("row12 targeted source pins refer to different factory paths")
        if tree(pin_sha, path) != blob:
            raise ValueError("original workbook pinned blob disagrees with reviewed Git commit")
        target = intervals(pin, "spans")
        content = source(blob)
        if (content is None or not target or max(target) > len(content)
                or any(not content[i - 1].lstrip("\ufeff").strip() for i in target)
                or len(target) != pin.get("nonblank_reviewed_loc")):
            raise ValueError("original pinned review spans missing or not nonblank at its own commit")
        records.append((excel, pin_sha, path, blob, target))
    if (eligible_path is None
            or len(by_path[eligible_path]["selected"]) !=
               comparators.get("candidate_expected_nonblank_loc_same_path")
            or (candidate_nonblank_total - len(by_path[eligible_path]["selected"])) !=
               comparators.get("candidate_expected_nonblank_loc_other_paths")):
        raise ValueError("candidate 79/203 path-level original-pin eligibility drift")

    matches = set()
    overlaps_same_blob = set()
    skipped = Counter()
    history_cache = {}
    mapping_cache = {}
    details = []
    selected_candidate = by_path[eligible_path]["selected"]
    candidate_blob = by_path[eligible_path]["blob"]
    for excel, sha, path, blob, target in records:
        if blob == candidate_blob:
            overlaps_same_blob.update(selected_candidate & target)
        coords = (order[original_sha], order[sha], path)
        if coords not in history_cache:
            history_cache[coords] = git_verified_changed_first_parent_orders(
                repo, chronological, path, coords[0], coords[1])
        changed, reason = history_cache[coords]
        if reason is not None:
            skipped[reason] += 1
            details.append({"excel_row":excel,"reviewed_master_sha":sha,
                            "status":"unresolved","reason":reason,
                            "proven_candidate_line_numbers":[]})
            continue
        if coords not in mapping_cache:
            mapping_cache[coords] = trace_unique_first_parent_lines(
                chronological, path, candidate_blob, coords[0], blob, coords[1],
                selected_candidate, tree, source, changed_orders=changed)
        mapped, reason, edges = mapping_cache[coords]
        if reason is not None:
            skipped[reason] += 1
            details.append({"excel_row":excel,"reviewed_master_sha":sha,
                            "status":"unresolved","reason":reason,
                            "proven_candidate_line_numbers":[]})
            continue
        valid = {candidate_line: old_line
                 for candidate_line, old_line in mapped.items()
                 if old_line in target}
        matches.update(valid)
        details.append({
            "excel_row":excel,"reviewed_master_sha":sha,"status":"checked",
            "original_reviewed_line_count":len(target),
            "path_changed_first_parent_edges":len(changed),
            "total_intervening_first_parent_edges":edges,
            "proven_candidate_line_numbers":sorted(valid),
            "proven_candidate_to_original_pin_line_map":[
                {"candidate_line":a,"original_pinned_line":b}
                for a,b in sorted(valid.items())
            ]
        })
    if not matches.issubset(selected_candidate) or not overlaps_same_blob.issubset(selected_candidate):
        raise ValueError("lineage proof exceeded Git-verified candidate source")
    if len(matches) > len(selected_candidate):
        raise ValueError("candidate source line proof exceeded original source")
    return {
        "status":"row12_candidate_to_original_pins_first_parent_path_proof",
        "provenance":"Git-at-reported-review-commit source candidate vs three exact independently originally pinned review spans",
        "source_artifact_run_id":comparators.get("source_run_id"),
        "original_first_parent_cohort":{"head_sha":head,"oldest_sha":oldest,
                                         "first_parent_commits":count},
        "candidate_excel_row":original_row,
        "candidate_reviewed_master_sha":original_sha,
        "candidate_git_derived_total_nonblank_line_occurrences":candidate_nonblank_total,
        "candidate_source_files_count":len(by_path),
        "source_paths_with_original_pinned_reviews":[eligible_path],
        "candidate_lines_on_path_with_original_pin":len(selected_candidate),
        "candidate_lines_on_paths_without_original_pin":
            candidate_nonblank_total-len(selected_candidate),
        "original_pinned_review_rows_reverified":len(records),
        "unique_original_pinned_review_commits":len({r[1] for r in records}),
        "exact_same_blob_candidate_line_identities":len(overlaps_same_blob),
        "different_revision_all_first_parent_proven_repeat_candidate_lines":
            len(matches-overlaps_same_blob),
        "all_first_parent_proven_repeat_candidate_lines":len(matches),
        "candidate_lines_on_shared_path_without_full_proof":
            len(selected_candidate-matches),
        "candidate_lines_without_original_pinned_path":
            candidate_nonblank_total-len(selected_candidate),
        "unresolved_path_comparison_rows":sum(skipped.values()),
        "unresolved_comparison_reasons":dict(sorted(skipped.items())),
        "candidate_line_numbers_with_proven_continuity":sorted(matches),
        "original_pinned_review_details":details,
        "candidate_only_not_new_independently_reviewed_LOC":True,
        "new_independently_verified_reviewed_loc":0,
        "new_distinct_defects":0,
        "new_comparable_900_density":None,
        "limitation":"Proven source ancestry is bounded to three original-pin review spans, five exact paths, and the Nov22 original first-parent history. It is not evidence that the derived workbook review occurred, nor is the complement newly reviewed lines, and it is not the current master 900-window denominator."
    }


def main() -> None:
    p=argparse.ArgumentParser()
    p.add_argument("--repo",type=Path,default=Path("."))
    p.add_argument("--candidate-golden",type=Path,required=True)
    p.add_argument("--original-pin-comparators",type=Path,required=True)
    p.add_argument("--json-out",type=Path,required=True)
    a=p.parse_args()
    result=proof(a.repo,
        json.loads(a.candidate_golden.read_text(encoding="utf-8")),
        json.loads(a.original_pin_comparators.read_text(encoding="utf-8")))
    a.json_out.parent.mkdir(parents=True,exist_ok=True)
    a.json_out.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items()
                      if k not in ("candidate_line_numbers_with_proven_continuity",
                                   "original_pinned_review_details")},sort_keys=True))


if __name__=="__main__":
    main()
