#!/usr/bin/env python3
"""Reproducible Aspects density snapshots from source-verified ledger observations.

These figures describe an *observed subset*, not a whole-codebase defect rate.
They are NOT numerically interchangeable with legacy spreadsheet snapshots.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path

from aspects_review_evidence import (
    SHA,
    coverage,
    parse_spans,
    read_records,
    verified_first_parent,
    verified_observation,
)

METHOD = "first_parent_verified_path_blob_span_union_v1"
LEDGER_DEFAULT = "docs/engineering/aspects-review-ledger.jsonl"


def _identity(row: dict) -> str:
    # Same exact evidence recorded more than once remains one observation.
    value = {
        "baseline": row["baseline"],
        "blob": row["blob"],
        "path": row["path"],
        "spans": sorted([list(pair) for pair in parse_spans(row["spans"])]),
        "defect_id": row.get("defect_id"),
    }
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def _merged_intervals(rows: list[dict]) -> list[dict]:
    """Content-aware line union keyed to the exact path and Git blob."""
    by_source: dict[tuple[str, str], list[tuple[int, int]]] = {}
    for row in rows:
        by_source.setdefault((row["path"], row["blob"]), []).extend(parse_spans(row["spans"]))
    output = []
    for (path, blob), spans in sorted(by_source.items()):
        merged = []
        for start, end in sorted(spans):
            if merged and start <= merged[-1][1] + 1:
                merged[-1][1] = max(end, merged[-1][1])
            else:
                merged.append([start, end])
        output.append({"path": path, "blob": blob, "spans": merged})
    return output


def _new_unique_lines(current: list[dict], previous: list[dict]) -> int:
    """Count source-line intervals absent from previous exact path/blob coverage."""
    prior = {(r["path"], r["blob"]): r["spans"] for r in previous}
    total = 0
    for row in current:
        old = prior.get((row["path"], row["blob"]), [])
        for left, right in row["spans"]:
            covered = sum(max(0, min(right, b) - max(left, a) + 1) for a, b in old)
            total += right - left + 1 - covered
    return total

def revalidate_rows(repo: Path, rows: list[dict], baselines: set[str]) -> list[dict]:
    """Do not trust a JSON verified=true flag without inspecting the pinned git blob."""
    valid = []
    for row in rows:
        if row.get("verified") is not True or row.get("baseline") not in baselines:
            continue
        if not SHA.fullmatch(row.get("blob", "")):
            raise ValueError("Verified observation has an invalid blob SHA")
        expected = verified_observation(
            repo, row["baseline"], row["path"], row["spans"], row.get("defect_id")
        )
        if row["blob"] != expected["blob"]:
            raise ValueError(f"Pinned source blob mismatch: {row['path']}")
        valid.append(row)
    return valid


def build_snapshot(
    rows: list[dict],
    baselines: set[str],
    head: str,
    window: int,
    previous: dict | None = None,
) -> dict:
    if not SHA.fullmatch(head) or head not in baselines or window < 1:
        raise ValueError("HEAD and positive first-parent window must be verified")
    current_rows = [r for r in rows if r.get("verified") is True and r.get("baseline") in baselines]
    summary = coverage(rows, baselines)
    identities = sorted({_identity(row) for row in current_rows})
    defects = sorted({r["defect_id"] for r in current_rows if r.get("defect_id")})
    files = sorted({r["path"] for r in current_rows})
    evidence_hash = hashlib.sha256("\n".join(identities).encode("ascii")).hexdigest()
    intervals = _merged_intervals(current_rows)
    density = summary["provisional_density_per_kloc"]

    status = "source_verified_subset" if identities and density is not None else "unavailable"
    freshness = "no_prior_snapshot"
    prior_density = None
    delta = None
    new_evidence = None
    new_files = None
    newly_confirmed = None
    new_unique_lines = None

    if previous is not None:
        comparable = (
            previous.get("method") == METHOD
            and previous.get("window_commits") == window
            and previous.get("head") in baselines
        )
        if comparable:
            prior_ids = set(previous.get("evidence", {}).get("identities", []))
            prior_files = set(previous.get("evidence", {}).get("files", []))
            prior_defects = set(previous.get("evidence", {}).get("defect_ids", []))
            new_evidence = len(set(identities) - prior_ids)
            new_files = len(set(files) - prior_files)
            newly_confirmed = len(set(defects) - prior_defects)
            prior_intervals = previous.get("evidence", {}).get("path_blob_intervals")
            if isinstance(prior_intervals, list):
                new_unique_lines = _new_unique_lines(intervals, prior_intervals)
            prior_density = previous.get("density", {}).get("defects_per_kloc")
            if density is not None and isinstance(prior_density, (int, float)):
                delta = round(density - prior_density, 6)
            if evidence_hash == previous.get("evidence", {}).get("fingerprint"):
                freshness = "stale_no_new_verified_evidence"
            elif new_evidence:
                freshness = "new_verified_evidence"
            else:
                freshness = "rolling_window_membership_changed"
        else:
            freshness = "prior_not_comparable"

    return {
        "schema_version": 1,
        "method": METHOD,
        "captured_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "head": head,
        "window_commits": window,
        "status": status,
        "freshness": freshness,
        "density": {
            "defects_per_kloc": density,
            "previous_comparable": prior_density,
            "signed_delta": delta,
            "distinct_confirmed_defects": len(defects),
            "unique_path_blob_reviewed_lines": summary["unique_path_blob_lines"],
        },
        "review": {
            "verified_rows": len(current_rows),
            "distinct_verified_observations": len(identities),
            "distinct_reviewed_files": len(files),
            "unverified_rows_excluded": summary["excluded_unverified_records"],
            "new_observations_since_prior": new_evidence,
            "new_files_since_prior": new_files,
            "new_defects_since_prior": newly_confirmed,
            "new_unique_path_blob_lines_since_prior": new_unique_lines,
        },
        "evidence": {
            "fingerprint": evidence_hash,
            "path_blob_intervals": intervals,
            "identities": identities,
            "defect_ids": defects,
            "files": files,
            "baseline_shas": sorted({r["baseline"] for r in current_rows}),
            "ledger_ref": LEDGER_DEFAULT,
        },
        "limitations": [
            "Coverage is source-verified only for ledger spans, not the whole codebase.",
            "Same path at distinct blobs may double-count unchanged lines across revisions.",
            "Legacy spreadsheet counts are not interchangeable without record-level reconciliation.",
            "Confirmed discoveries are not the same as remaining unresolved defects.",
            "Only first-parent baselines within the pinned window enter this snapshot.",
        ],
    }


def markdown(snapshot: dict) -> str:
    d, r = snapshot["density"], snapshot["review"]
    fmt = lambda v: "unavailable" if v is None else f"{v:.6f}"
    return "\n".join([
        "# Aspects verified-subset defect-density snapshot",
        "",
        f"- Pinned head: `{snapshot['head']}`",
        f"- First-parent window: {snapshot['window_commits']} commits",
        f"- Status: **{snapshot['status']}**",
        f"- Evidence freshness: **{snapshot['freshness']}**",
        f"- Distinct confirmed defects: **{d['distinct_confirmed_defects']}**",
        f"- Unique path/blob reviewed lines: **{d['unique_path_blob_reviewed_lines']}**",
        f"- Source-verified subset density (per KLOC): **{fmt(d['defects_per_kloc'])}**",
        f"- Previous comparable density: {fmt(d['previous_comparable'])}",
        f"- Signed change: {fmt(d['signed_delta'])}",
        f"- Distinct source files reviewed: {r['distinct_reviewed_files']}",
        f"- Newly verified observations since prior: {r['new_observations_since_prior']}",
        f"- New unique path/blob reviewed lines since prior: {r['new_unique_path_blob_lines_since_prior']}",
        "",
        "**Not comparable to the historical 1.3479 defects/KLOC workbook figure.**",
        "",
        *[f"- {limitation}" for limitation in snapshot["limitations"]],
        "",
    ])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--ledger", type=Path, default=Path(LEDGER_DEFAULT))
    parser.add_argument("--head", required=True)
    parser.add_argument("--window", type=int, default=900)
    parser.add_argument("--previous", type=Path)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args()

    first_parent = verified_first_parent(args.repo, args.head, args.window)
    records = read_records(args.ledger)
    # This explicit Git-backed revalidation is what elevates candidate source rows
    # to reportable verified observations. It fails closed on forged or stale blobs.
    revalidate_rows(args.repo, records, first_parent)

    prior = None
    if args.previous is not None and args.previous.exists():
        prior = json.loads(args.previous.read_text(encoding="utf-8"))
    snapshot = build_snapshot(records, first_parent, args.head, args.window, prior)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(markdown(snapshot), encoding="utf-8")
    print(json.dumps({
        "status": snapshot["status"],
        "freshness": snapshot["freshness"],
        "density": snapshot["density"],
        "review": snapshot["review"],
    }, sort_keys=True))


if __name__ == "__main__":
    main()
