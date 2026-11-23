#!/usr/bin/env python3
"""Non-additive, exact-blob reconciliation of legacy Aspects reviews and new evidence.

The workbook's review counts are historical reports, NOT verified unique source
intervals. A match here identifies only an identical path/blob/line position.
Changed blob revisions, unparsed legacy scopes and rolling-window membership
are NOT inferred and no combined defect-density number is emitted.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import json
from pathlib import Path

from aspects_review_evidence import read_records, verified_observation
from aspects_validate_historical_corpus import verify


def line_union(items: list[dict], key_getter) -> dict[tuple[str, str], set[int]]:
    """Return exact path/blob line unions; repeated spans never count twice."""
    covered = defaultdict(set)
    for item in items:
        pin = key_getter(item)
        if pin is None:
            continue
        key = (pin["path"], pin["blob"])
        for lo, hi in pin["spans"]:
            if type(lo) is not int or type(hi) is not int or lo < 1 or hi < lo:
                raise ValueError(f"Invalid reviewed source interval: {pin}")
            covered[key].update(range(lo, hi + 1))
    return dict(covered)


def compare_exact_source(legacy: list[dict], recent: list[dict]) -> dict:
    """Compare equal content identities only. This cannot establish line lineage."""
    legacy_lines = line_union(legacy, lambda x: x.get("parsed_pin"))
    recent_lines = line_union(recent, lambda x: x)
    shared = 0
    matched_files = 0
    unmatched_blobs = 0
    for key, lines in recent_lines.items():
        old = legacy_lines.get(key)
        if old is None:
            unmatched_blobs += 1
            continue
        matched_files += 1
        shared += len(lines & old)
    total_recent = sum(len(v) for v in recent_lines.values())
    candidate_new = total_recent - shared
    return {
        "status": "exact_path_blob_line_overlap_only_cross_revision_pending",
        "legacy_observations": len(legacy),
        "legacy_source_pins_parseable_not_git_verified": sum(x.get("parsed_pin") is not None for x in legacy),
        "legacy_source_scopes_unparsed": sum(x.get("parsed_pin") is None for x in legacy),
        "new_git_verified_rows": len(recent),
        "new_git_verified_unique_path_blob_lines": total_recent,
        "new_git_verified_defect_ids": len({r["defect_id"] for r in recent if r.get("defect_id")}),
        "identical_path_blob_keys": matched_files,
        "new_path_blob_keys_absent_from_parseable_history": unmatched_blobs,
        "identical_path_blob_line_overlap": shared,
        "new_verified_lines_outside_parseable_same_blob_history": candidate_new,
        "new_verified_lines_outside_history_are_not_confirmed_lineage_unique": True,
        "legacy_plus_recent_combined_density_per_kloc": None,
        "warning": (
            "Historical pins have not been Git-verified; exact overlap is informative but "
            "not a complete cross-revision Git line union. Do not add legacy and recent "
            "denominators or treat reported historical defect observations as distinct IDs."
        ),
    }


def load_corpus(root: Path) -> list[dict]:
    verify(root)
    rows = []
    for path in sorted((root / "review-events").glob("*.jsonl")):
        rows.extend(read_records(path))
    return rows


def verify_recent(repo: Path, rows: list[dict]) -> list[dict]:
    """Revalidate every claimed-verified Git review before reporting overlap."""
    checked = []
    for row in rows:
        if row.get("verified") is not True:
            continue
        expected = verified_observation(
            repo, row["baseline"], row["path"], row["spans"], row.get("defect_id")
        )
        if expected["blob"] != row.get("blob"):
            raise ValueError(f"New Git review blob changed: {row['path']}")
        checked.append(row)
    return checked


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--historical-root", type=Path, default=Path("docs/engineering/aspects-historical"))
    parser.add_argument("--new-ledger", type=Path, default=Path("docs/engineering/aspects-review-ledger.jsonl"))
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()
    recent = verify_recent(args.repo, read_records(args.new_ledger))
    result = compare_exact_source(load_corpus(args.historical_root), recent)
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(rendered, encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()
