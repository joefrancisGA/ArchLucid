#!/usr/bin/env python3
"""Partial first-parent continuity proof for current 900-window reviewed source.

Only original Git-pinned workbook reviews and independently Git-revalidated
follow-on review spans enter. Changed-and-reverted lines are NOT matched merely
because endpoint blobs/text agree. Output NEVER constitutes the all-review LOC
denominator, new reviewed LOC, or a verified defect density.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path

from aspects_current_master_900_eligibility import reconstruct_cohort
from aspects_density_snapshot import cohort_identity
from aspects_reconcile_historical_lineage import UnionFind, blob_lines
from aspects_reconcile_recovered_candidates import intervals
from aspects_review_evidence import read_records, verified_observation, SHA
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256, git
from aspects_verify_first_parent_lineage import (
    git_verified_changed_first_parent_orders, trace_unique_first_parent_lines,
)


def prove(repo: Path, pinned: list[dict], audit: dict, recent: list[dict],
          cohort: dict, exact: dict, expected_records: int = 5741) -> dict:
    if (len(pinned) != expected_records
            or audit.get("review_events_present") != expected_records
            or audited_rows_sha256(pinned) != audit.get("audited_rows_sha256")
            or len({r.get("excel_row") for r in pinned}) != expected_records):
        raise ValueError("historical original pin evidence incomplete or altered")
    if (cohort.get("status") != "complete"
            or cohort_identity(cohort.get("ordered_shas"), cohort.get("head_sha"),
                               cohort.get("requested_commits")) != cohort):
        raise ValueError("current master first-parent cohort/digest invalid")
    if (exact.get("status") !=
            "partial_current_master_base_900_exact_pin_and_followon_reconciliation"
            or exact.get("cohort") != cohort
            or exact.get("original_historical_events_total") != expected_records):
        raise ValueError("current exact source report missing or from different cohort")

    chain = list(reversed(cohort["ordered_shas"]))
    order = {sha: i for i, sha in enumerate(chain)}
    observed: dict[tuple[str, str], dict] = {}
    trees: dict[tuple[str, str], str | None] = {}
    blobs: dict[str, list[str] | None] = {}

    def tree(sha: str, path: str) -> str | None:
        key = (sha, path)
        if key not in trees:
            ok, raw = git(repo, "rev-parse", "--verify", f"{sha}:{path}")
            digest = raw.decode("ascii", "replace").strip() if ok else None
            trees[key] = digest if isinstance(digest, str) and SHA.fullmatch(digest) else None
        return trees[key]

    def lines(blob: str) -> list[str] | None:
        return blob_lines(repo, blob, blobs)

    def add(sha: str, path: str, blob: str, selected: set[int]) -> None:
        if (not isinstance(path, str) or not path or
                not isinstance(blob, str) or not SHA.fullmatch(blob)
                or tree(sha, path) != blob):
            raise ValueError("reviewed source commit/path/blob tree mismatch")
        content = lines(blob)
        if (content is None or not selected or max(selected) > len(content)
                or any(not content[n - 1].strip() for n in selected)):
            raise ValueError("reviewed line interval missing or blank in Git blob")
        entry = observed.setdefault((path, sha), {"blob": blob, "selected": set()})
        if entry["blob"] != blob:
            raise ValueError("different blobs assigned to same reviewed commit/path")
        entry["selected"].update(selected)

    pinned_rows = pinned_occurrences = 0
    for row in pinned:
        sha = row.get("reviewed_master_sha")
        if sha not in order or row.get("pin_status") != VERIFIED:
            continue
        sources = row.get("pinned_sources")
        if sources is None:
            sources = [row]
        if not isinstance(sources, list) or not sources:
            raise ValueError("verified historical review has no pinned sources")
        n = 0
        for source in sources:
            selected = intervals(source, "spans")
            add(sha, source.get("path"), source.get("blob"), selected)
            n += len(selected)
        if n != row.get("nonblank_reviewed_loc"):
            raise ValueError("reviewed LOC disagrees with original source audit")
        pinned_rows += 1
        pinned_occurrences += n

    recent_rows = outside = recent_occurrences = 0
    for row in recent:
        sha = row.get("baseline")
        if sha not in order:
            outside += 1
            continue
        if row.get("verified") is not True:
            raise ValueError("unverified follow-on review in current cohort")
        source = verified_observation(
            repo, sha, row["path"], row["spans"], row.get("defect_id"))
        if source["blob"] != row.get("blob"):
            raise ValueError("follow-on source blob failed independent Git verification")
        selected = intervals(row, "spans")
        add(sha, row["path"], row["blob"], selected)
        recent_occurrences += len(selected)
        recent_rows += 1

    exact_identities = {
        (path, item["blob"], n)
        for (path, _), item in observed.items() for n in item["selected"]
    }
    if (pinned_rows != exact.get("original_git_pinned_rows_eligible_in_current_900")
            or pinned_occurrences != exact.get("original_git_pinned_line_occurrences_current_900")
            or recent_rows != exact.get("followon_records_in_current_master_900")
            or outside != exact.get("followon_records_outside_current_master_900")
            or recent_occurrences != exact.get("followon_line_occurrences_current_900")
            or len(exact_identities) != exact.get("combined_exact_path_blob_line_union_only")):
        raise ValueError("source population not identical to master-base exact ledger")

    union = UnionFind()
    paths = defaultdict(list)
    for (path, sha), item in observed.items():
        for n in item["selected"]:
            union.find((path, sha, n))
        paths[path].append((order[sha], sha, item["blob"], item["selected"]))

    links = checked = skipped = edges = 0
    reasons = Counter()
    for path, versions in sorted(paths.items()):
        versions.sort(key=lambda v: v[0])
        for (a, older, old_blob, old_lines), (b, newer, new_blob, new_lines) in zip(
                versions, versions[1:]):
            changed, error = git_verified_changed_first_parent_orders(
                repo, chain, path, a, b)
            if error:
                skipped += 1
                reasons[error] += 1
                continue
            mapped, error, distance = trace_unique_first_parent_lines(
                chain, path, old_blob, a, new_blob, b, old_lines,
                tree, lines, changed_orders=changed)
            if error:
                skipped += 1
                reasons[error] += 1
                continue
            checked += 1
            edges += distance
            for origin, destination in mapped.items():
                if destination in new_lines and union.unite(
                        (path, older, origin), (path, newer, destination)):
                    links += 1
    unique_revision_nodes = sum(len(v["selected"]) for v in observed.values())
    components = len({
        union.find((path, sha, n))
        for (path, sha), item in observed.items() for n in item["selected"]
    })
    if (not 0 <= links <= unique_revision_nodes
            or components + links != unique_revision_nodes
            or len(exact_identities) > unique_revision_nodes):
        raise ValueError("first-parent observed source-line lineage count invalid")
    return {
        "status": "partial_current_900_first_parent_reviewed_source_continuity",
        "captured_utc": datetime.now(timezone.utc).isoformat(),
        "cohort": {
            "head_sha": cohort["head_sha"],
            "oldest_included_sha": cohort["oldest_included_sha"],
            "first_parent_commits": cohort["actual_commits"],
            "ordered_shas_sha256": cohort["ordered_shas_sha256"],
        },
        "historical_rows_audited": expected_records,
        "original_pinned_review_rows_in_current_window": pinned_rows,
        "followon_reviews_in_current_window": recent_rows,
        "followon_reviews_outside_current_window": outside,
        "original_pinned_line_occurrences": pinned_occurrences,
        "followon_line_occurrences": recent_occurrences,
        "exact_path_blob_line_union_only": len(exact_identities),
        "unique_commit_path_line_nodes": unique_revision_nodes,
        "git_proven_continuous_cross_revision_repeat_links": links,
        "git_proven_continuous_source_line_components_subset_only": components,
        "repeated_line_occurrences_within_reviewed_commit":
            pinned_occurrences + recent_occurrences - unique_revision_nodes,
        "reviewed_adjacent_source_commit_pairs_checked": checked,
        "reviewed_adjacent_source_commit_pairs_unresolved": skipped,
        "unresolved_pair_reasons": dict(sorted(reasons.items())),
        "first_parent_edges_between_checked_source_revisions": edges,
        "new_independently_reviewed_loc": 0,
        "newly_confirmed_distinct_defects": None,
        "full_900_reviewed_loc_denominator": None,
        "new_comparable_900_density": None,
        "confidence": "only original Git pinned and reverified followon source; all traced matches survive intervening first-parent path history",
        "limitation": (
            "Candidate-only historical reviews are excluded. Unresolved comparisons, "
            "renames and unverified review events prevent a complete reviewed LOC "
            "denominator. Same-blob path identities across nonadjacent commits "
            "are not by themselves proof of continuous source-line ancestry."
        ),
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("--master-base-head", required=True)
    p.add_argument("--window", type=int, default=900)
    p.add_argument("--pin-rows", type=Path, required=True)
    p.add_argument("--pin-report", type=Path, required=True)
    p.add_argument("--exact-report", type=Path, required=True)
    p.add_argument("--ledger", type=Path,
                   default=Path("docs/engineering/aspects-review-ledger.jsonl"))
    p.add_argument("--json-out", type=Path, required=True)
    a = p.parse_args()
    result = prove(
        a.repo, read_records(a.pin_rows),
        json.loads(a.pin_report.read_text(encoding="utf-8")),
        read_records(a.ledger), reconstruct_cohort(
            a.repo, a.master_base_head, a.window),
        json.loads(a.exact_report.read_text(encoding="utf-8")))
    a.json_out.parent.mkdir(parents=True, exist_ok=True)
    a.json_out.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n",
                          encoding="utf-8")
    print(json.dumps({k: v for k, v in result.items() if k != "cohort"},
                     sort_keys=True))


if __name__ == "__main__":
    main()
