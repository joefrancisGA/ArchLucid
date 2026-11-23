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
import math
from pathlib import Path

from aspects_review_evidence import (
    SHA,
    coverage,
    git,
    normalize_path,
    parse_spans,
    read_records,
    verified_observation,
)

METHOD = "first_parent_verified_path_blob_span_union_v2"
SCOPE = "narrow_incremental_review_ledger_subset"
COHORT_DIGEST_METHOD = "sha256_newest_to_oldest_full_shas_lf_terminated_v1"
EVIDENCE_DIGEST_METHOD = "sha256_canonical_snapshot_evidence_fields_v1"
EVIDENCE_DIGEST_FIELDS = (
    "fingerprint", "identities", "defect_ids", "path_blob_intervals", "files", "baseline_shas",
)
LEDGER_DEFAULT = "docs/engineering/aspects-review-ledger.jsonl"
HISTORICAL_STATE_DEFAULT = "docs/engineering/aspects-historical-restoration-state.json"


def cohort_identity(first_parent: list[str], head: str, window: int) -> dict:
    """Keep the ordered Git cohort; an unordered set cannot establish its oldest SHA."""
    if (not isinstance(head, str) or not SHA.fullmatch(head)
            or not isinstance(window, int) or isinstance(window, bool) or window < 1):
        raise ValueError("Full pinned HEAD SHA and positive integer window are required")
    if (not isinstance(first_parent, list) or not first_parent
            or len(first_parent) > window or first_parent[0] != head
            or any(not isinstance(sha, str) or not SHA.fullmatch(sha) for sha in first_parent)
            or len(set(first_parent)) != len(first_parent)):
        raise ValueError("An ordered, unique first-parent SHA cohort starting at HEAD is required")
    return {
        "definition": "first_parent_including_head_newest_to_oldest",
        "status": "complete" if len(first_parent) == window else "incomplete",
        "requested_commits": window,
        "actual_commits": len(first_parent),
        "head_sha": first_parent[0],
        "oldest_included_sha": first_parent[-1],
        "ordered_shas": list(first_parent),
        "ordered_shas_sha256": hashlib.sha256(
            ("\n".join(first_parent) + "\n").encode("ascii")
        ).hexdigest(),
        "digest_method": COHORT_DIGEST_METHOD,
    }


def ordered_first_parent(repo: Path, head: str, window: int) -> list[str]:
    """Resolve a source-backed sequence without losing order in a membership set."""
    # Validate arguments before passing the ref to Git.
    cohort_identity([head], head, window)
    history = git(repo, "rev-list", "--first-parent", f"--max-count={window}", head).splitlines()
    cohort_identity(history, head, window)
    return history


def _sorted_unique_strings(value) -> bool:
    return (isinstance(value, list)
            and all(isinstance(item, str) and item.strip() for item in value)
            and value == sorted(set(value)))


def _evidence_digest(evidence: dict) -> str:
    content = {key: evidence[key] for key in EVIDENCE_DIGEST_FIELDS}
    return hashlib.sha256(json.dumps(
        content, sort_keys=True, separators=(",", ":"), ensure_ascii=True
    ).encode("utf-8")).hexdigest()


def prior_evidence_consistent(previous: dict) -> bool:
    """Validate quantities used by deltas; this is not authentication of an artifact."""
    evidence, density = previous.get("evidence"), previous.get("density")
    if not isinstance(evidence, dict) or not isinstance(density, dict):
        return False
    identities, defects = evidence.get("identities"), evidence.get("defect_ids")
    if (not _sorted_unique_strings(identities) or not _sorted_unique_strings(defects)
            or any(len(item) != 64 or any(c not in "0123456789abcdef" for c in item)
                   for item in identities)
            or len(defects) > len(identities)
            or evidence.get("fingerprint") != hashlib.sha256(
                "\n".join(identities).encode("ascii")).hexdigest()):
        return False
    intervals = evidence.get("path_blob_intervals")
    if not isinstance(intervals, list):
        return False
    keys, unique_loc = [], 0
    for source in intervals:
        if not isinstance(source, dict):
            return False
        path, blob, spans = source.get("path"), source.get("blob"), source.get("spans")
        if (not isinstance(path, str) or not path.strip() or "\x00" in path
                or not isinstance(blob, str) or not SHA.fullmatch(blob)
                or not isinstance(spans, list) or not spans):
            return False
        try:
            if normalize_path(path) != path:
                return False
        except ValueError:
            return False
        keys.append((path, blob))
        last_end = 0
        for pair in spans:
            if (not isinstance(pair, list) or len(pair) != 2
                    or any(type(number) is not int for number in pair)
                    or pair[0] < 1 or pair[1] < pair[0]
                    or (last_end and pair[0] <= last_end + 1)):
                return False
            unique_loc += pair[1] - pair[0] + 1
            last_end = pair[1]
    baselines = evidence.get("baseline_shas")
    if (keys != sorted(set(keys))
            or evidence.get("files") != sorted({path for path, _ in keys})
            or not _sorted_unique_strings(baselines)
            or any(not SHA.fullmatch(sha) or sha not in previous["cohort"]["ordered_shas"]
                   for sha in baselines)
            or bool(baselines) != bool(identities) or bool(unique_loc) != bool(identities)
            or type(density.get("unique_path_blob_reviewed_lines")) is not int
            or density["unique_path_blob_reviewed_lines"] != unique_loc
            or type(density.get("distinct_confirmed_defects")) is not int
            or density["distinct_confirmed_defects"] != len(defects)):
        return False
    # Observation hashes alone cannot reconstruct the associated named defects
    # or source union. Bind those published fields too, so a same-count ID edit
    # cannot silently change new-defect deltas while keeping the old fingerprint.
    if (evidence.get("integrity_method") != EVIDENCE_DIGEST_METHOD
            or evidence.get("integrity_sha256") != _evidence_digest(evidence)):
        return False
    rate = density.get("defects_per_kloc")
    if not unique_loc:
        return (not defects and rate is None and previous.get("status") == "unavailable")
    if (previous.get("status") != "source_verified_subset"
            or not isinstance(rate, (int, float)) or isinstance(rate, bool)):
        return False
    try:
        # v2 serializes density to six decimals. Permit only that rounding error.
        return math.isfinite(rate) and rate >= 0 and math.isclose(
            rate, 1000 * len(defects) / unique_loc, rel_tol=0.0, abs_tol=0.000000500001)
    except OverflowError:
        return False


def comparison_reason(previous: dict, current_cohort: dict) -> str | None:
    """Require complete, self-consistent anchors and matching shared Git ancestry."""
    if current_cohort["status"] != "complete":
        return "current_first_parent_cohort_incomplete"
    if not isinstance(previous, dict) or previous.get("schema_version") != 2:
        return "prior_schema_has_no_verified_cohort_contract"
    if previous.get("method") != METHOD or previous.get("scope") != SCOPE:
        return "prior_method_or_population_scope_mismatch"
    if previous.get("window_commits") != current_cohort["requested_commits"]:
        return "prior_window_size_mismatch"
    try:
        captured = dt.datetime.fromisoformat(previous["captured_utc"])
        if captured.utcoffset() is None:
            return "prior_as_of_timestamp_invalid"
    except (KeyError, TypeError, ValueError):
        return "prior_as_of_timestamp_invalid"
    old = previous.get("cohort")
    if not isinstance(old, dict):
        return "prior_first_parent_anchors_missing"
    try:
        expected = cohort_identity(old.get("ordered_shas"), previous.get("head"),
                                   previous.get("window_commits"))
    except ValueError:
        return "prior_first_parent_sequence_invalid"
    if old != expected:
        return "prior_first_parent_anchors_or_digest_mismatch"
    if old["status"] != "complete":
        return "prior_first_parent_cohort_incomplete"
    if not prior_evidence_consistent(previous):
        return "prior_evidence_invalid"
    current = current_cohort["ordered_shas"]
    if old["head_sha"] not in current:
        return "prior_head_outside_current_cohort"
    offset = current.index(old["head_sha"])
    if current[offset:] != old["ordered_shas"][:len(current) - offset]:
        return "shared_first_parent_history_mismatch"
    return None


def read_historical_checkpoint(path: Path) -> dict | None:
    """Keep the legacy population visible without treating it as live Git-verified LOC."""
    if not path.exists():
        return None
    state = json.loads(path.read_text(encoding="utf-8"))
    # The legacy baseline stays distinct from Git-verified review subsets,
    # but once the historical corpus is committed it MUST be checked for loss.
    corpus = None
    if state.get("corpus_import", {}).get("expected_records"):
        from aspects_validate_historical_corpus import verify
        corpus = verify(path.parent / "aspects-historical")
    baseline = state["last_900_first_parent_snapshot"]
    if state["historical_review_observations"] != 5741:
        raise ValueError("Historical review population has drifted")
    if state["clean_review_observations"] != 4864:
        raise ValueError("Missing clean historical review observations")
    if baseline["defects"] != 463 or baseline["unique_loc"] != 343492:
        raise ValueError("Historical 900-commit goldens have drifted")
    rate = 1000 * baseline["defects"] / baseline["unique_loc"]
    if abs(rate - baseline["per_kloc"]) > 1e-10:
        raise ValueError("Historical density numerator/denominator mismatch")
    return {
        "status": "historical_workbook_partial_checkpoint_not_current",
        "git_staged_corpus": (
            {
                "status": corpus["status"],
                "review_observations": corpus["observations_imported"],
                "clean_reviews": corpus["zero_defect_observations"],
                "import_sha256": corpus["corpus_sha256"],
            } if corpus is not None else None
        ),
        "source_sha256": state["source"]["sha256"],
        "all_history_review_observations": state["historical_review_observations"],
        "clean_reviews": state["clean_review_observations"],
        "known_all_history_incremental_loc_sum_not_window_union": state["historical_incremental_loc_reported_known_sum"],
        "missing_incremental_loc_observations": state["missing_incremental_loc_observations"],
        "latest_legacy_900_window": baseline,
        "notice": "The historical baseline and Git source-verified subset are distinct; do not add them without identity and first-parent reconciliation.",
    }


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
    first_parent: list[str],
    head: str,
    window: int,
    previous: dict | None = None,
) -> dict:
    cohort = cohort_identity(first_parent, head, window)
    baselines = set(first_parent)
    current_rows = [r for r in rows if r.get("verified") is True and r.get("baseline") in baselines]
    summary = coverage(rows, baselines)
    identities = sorted({_identity(row) for row in current_rows})
    defects = sorted({r["defect_id"] for r in current_rows if r.get("defect_id")})
    files = sorted({r["path"] for r in current_rows})
    evidence_hash = hashlib.sha256("\n".join(identities).encode("ascii")).hexdigest()
    intervals = _merged_intervals(current_rows)
    evidence = {
        "fingerprint": evidence_hash,
        "path_blob_intervals": intervals,
        "identities": identities,
        "defect_ids": defects,
        "files": files,
        "baseline_shas": sorted({r["baseline"] for r in current_rows}),
        "ledger_ref": LEDGER_DEFAULT,
        "integrity_method": EVIDENCE_DIGEST_METHOD,
    }
    evidence["integrity_sha256"] = _evidence_digest(evidence)
    # Short/shallow histories cannot be published as complete rolling windows.
    density = summary["provisional_density_per_kloc"] if cohort["status"] == "complete" else None

    status = ("incomplete_first_parent_cohort" if cohort["status"] != "complete"
              else "source_verified_subset" if identities and density is not None else "unavailable")
    freshness = "no_prior_snapshot"
    prior_density = None
    delta = None
    new_evidence = None
    new_files = None
    newly_confirmed = None
    new_unique_lines = None
    new_line_occurrences = None
    repeated_line_occurrences = None
    removed_unique_lines = None
    comparison = {"status": "unavailable", "reason": "no_prior_snapshot",
                  "rotated_commits": None, "previous_captured_utc": None}

    if previous is not None:
        reason = comparison_reason(previous, cohort)
        comparison["reason"] = reason
        if reason is None:
            comparison.update(status="comparable", rotated_commits=first_parent.index(previous["head"]),
                              previous_captured_utc=previous["captured_utc"])
            prior_ids = set(previous.get("evidence", {}).get("identities", []))
            prior_files = set(previous.get("evidence", {}).get("files", []))
            prior_defects = set(previous.get("evidence", {}).get("defect_ids", []))
            new_evidence = len(set(identities) - prior_ids)
            new_files = len(set(files) - prior_files)
            newly_confirmed = len(set(defects) - prior_defects)
            prior_intervals = previous.get("evidence", {}).get("path_blob_intervals")
            if isinstance(prior_intervals, list):
                new_unique_lines = _new_unique_lines(intervals, prior_intervals)
                removed_unique_lines = _new_unique_lines(prior_intervals, intervals)
                distinct_new_rows = {_identity(row): row for row in current_rows
                                     if _identity(row) not in prior_ids}
                new_line_occurrences = sum(
                    end - start + 1 for row in distinct_new_rows.values()
                    for source in _merged_intervals([row]) for start, end in source["spans"]
                )
                repeated_line_occurrences = new_line_occurrences - new_unique_lines
            prior_value = previous.get("density", {}).get("defects_per_kloc")
            if (isinstance(prior_value, (int, float)) and not isinstance(prior_value, bool)
                    and math.isfinite(prior_value) and prior_value >= 0):
                prior_density = prior_value
            if density is not None and prior_density is not None:
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
        "schema_version": 2,
        "method": METHOD,
        "scope": SCOPE,
        "confidence": "git_source_pin_and_first_parent_membership_only_cross_revision_lineage_unresolved",
        "captured_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "head": head,
        "window_commits": window,
        "cohort": cohort,
        "comparison": comparison,
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
            "new_line_occurrences_since_prior": new_line_occurrences,
            "repeated_line_occurrences_since_prior": repeated_line_occurrences,
            "removed_unique_path_blob_lines_since_prior": removed_unique_lines,
        },
        "evidence": evidence,
        "limitations": [
            "Coverage is source-verified only for ledger spans, not the whole codebase.",
            "Same path at distinct blobs may double-count unchanged lines across revisions.",
            "Legacy spreadsheet counts are not interchangeable without record-level reconciliation.",
            "Confirmed discoveries are not the same as remaining unresolved defects.",
            "Only first-parent baselines within the pinned window enter this snapshot.",
            "Complete ordered first-parent anchors are required before publishing a rate or signed delta.",
        ],
    }


def markdown(snapshot: dict) -> str:
    d, r = snapshot["density"], snapshot["review"]
    fmt = lambda v: "unavailable" if v is None else f"{v:.6f}"
    historical = snapshot.get("historical_checkpoint")
    introduction = []
    if historical:
        old = historical["latest_legacy_900_window"]
        introduction = [
            "# Aspects historical accounting restoration",
            "",
            f"- Historical workbook reviewed observations: **{historical['all_history_review_observations']:,}**",
            f"- Historical clean (zero-defect) observations: **{historical['clean_reviews']:,}**",
            f"- Historical known all-row incremental LOC: **{historical['known_all_history_incremental_loc_sum_not_window_union']:,}** (not a rolling-window union)",
            f"- Historical missing incremental LOC observations: **{historical['missing_incremental_loc_observations']}**",
            f"- Unchanged historical checkpoint — {old['as_of_et']}, partial workbook provenance: **{old['defects']} defects / {old['unique_loc']:,} reviewed LOC = {old['per_kloc']:.6f} defects/KLOC**",
            "- Legacy baseline is **not** a current fully reconciled rate; it is preserved separately from Git-backed new observations.",
            "",
            "## New source-verified Git ledger subset",
            "",
        ]
        staged = historical.get("git_staged_corpus")
        if staged:
            introduction.insert(
                3,
                f"- Git-staged historical review events: **{staged['review_observations']:,}**, "
                f"checksum validated; **source-line ancestry remains unverified**.",
            )
    return "\n".join(introduction + [
        "# Aspects verified-subset defect-density snapshot",
        "",
        f"- As-of (UTC): `{snapshot['captured_utc']}`",
        f"- Population scope: `{snapshot['scope']}`",
        f"- Pinned head: `{snapshot['head']}`",
        f"- First-parent window: {snapshot['cohort']['actual_commits']}/{snapshot['window_commits']} commits ({snapshot['cohort']['status']})",
        f"- Oldest included SHA: `{snapshot['cohort']['oldest_included_sha']}`",
        f"- Ordered cohort SHA-256: `{snapshot['cohort']['ordered_shas_sha256']}`",
        f"- Status: **{snapshot['status']}**",
        f"- Evidence freshness: **{snapshot['freshness']}**",
        f"- Comparison: **{snapshot['comparison']['status']}**, reason: {snapshot['comparison']['reason']}",
        f"- Distinct confirmed defects: **{d['distinct_confirmed_defects']}**",
        f"- Unique path/blob reviewed lines: **{d['unique_path_blob_reviewed_lines']}**",
        f"- Source-verified subset density (per KLOC): **{fmt(d['defects_per_kloc'])}**",
        f"- Previous comparable density: {fmt(d['previous_comparable'])}",
        f"- Signed change: {fmt(d['signed_delta'])}",
        f"- Distinct source files reviewed: {r['distinct_reviewed_files']}",
        f"- Newly verified observations since prior: {r['new_observations_since_prior']}",
        f"- New unique path/blob reviewed lines since prior: {r['new_unique_path_blob_lines_since_prior']}",
        f"- Repeated line occurrences in new observations: {r['repeated_line_occurrences_since_prior']}",
        f"- Unique path/blob lines removed by window rotation: {r['removed_unique_path_blob_lines_since_prior']}",
        "",
        "**Not comparable to the historical workbook checkpoint; full restoration and cross-revision deduplication remain unresolved.**",
        "",
        *[f"- {limitation}" for limitation in snapshot["limitations"]],
        "",
    ])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--ledger", type=Path, default=Path(LEDGER_DEFAULT))
    parser.add_argument("--historical-state", type=Path, default=Path(HISTORICAL_STATE_DEFAULT))
    parser.add_argument("--head", required=True)
    parser.add_argument("--window", type=int, default=900)
    parser.add_argument("--previous", type=Path)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    args = parser.parse_args()

    first_parent = ordered_first_parent(args.repo, args.head, args.window)
    records = read_records(args.ledger)
    # This explicit Git-backed revalidation is what elevates candidate source rows
    # to reportable verified observations. It fails closed on forged or stale blobs.
    revalidate_rows(args.repo, records, set(first_parent))

    prior = None
    if args.previous is not None and args.previous.exists():
        prior = json.loads(args.previous.read_text(encoding="utf-8"))
    snapshot = build_snapshot(records, first_parent, args.head, args.window, prior)
    snapshot["historical_checkpoint"] = read_historical_checkpoint(args.historical_state)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(markdown(snapshot), encoding="utf-8")
    print(json.dumps({
        "status": snapshot["status"],
        "freshness": snapshot["freshness"],
        "cohort": {key: value for key, value in snapshot["cohort"].items() if key != "ordered_shas"},
        "comparison": snapshot["comparison"],
        "density": snapshot["density"],
        "review": snapshot["review"],
    }, sort_keys=True))


if __name__ == "__main__":
    main()
