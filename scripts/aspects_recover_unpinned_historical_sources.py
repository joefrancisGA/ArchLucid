#!/usr/bin/env python3
"""Conservative source-at-commit candidates for historical reviews without blob pins.

Only explicit repository-relative full paths and numeric inclusive intervals are
accepted. A resolved Git blob is NOT the original workbook's blob pin and this
report MUST NOT be added to the independently pinned or 900-commit density
denominator. Malformed/partial multi-file rows receive zero candidate coverage.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re

from aspects_import_historical_workbook import RANGE
from aspects_review_evidence import read_records
from aspects_validate_historical_corpus import verify
from aspects_validate_historical_pins import SHA, first_parent_checkpoint, git, audited_rows_sha256

# Strict syntax on purpose: unknown narratives, bare filenames, comments,
# renames, glob patterns, and inferred basename-to-path matches are excluded.
# The workbook uses "and" between *numeric intervals on the same full path*.
# A period may also separate two full-path source references (Excel row 32).
# Requiring an explicit path for every segment keeps narratives and basenames
# out; no source path or intervals are inferred from prose.
SPAN_TOKEN = r"[1-9][0-9]*(?:[-–—][1-9][0-9]*)?"
RANGE_SEPARATOR = r"(?:\s*,\s*|\s+and\s+)"
SEGMENT = re.compile(
    r"^(?P<path>\S+/\S+?)\s+"
    rf"(?P<ranges>{SPAN_TOKEN}(?:{RANGE_SEPARATOR}{SPAN_TOKEN})*)\.?$"
)
INTERVAL_SPLIT = re.compile(RANGE_SEPARATOR)
# A sentence terminator is accepted as a source separator ONLY when the next
# fragment starts with an explicit slash-qualified repo-relative path.
SOURCE_SENTENCE_SPLIT = re.compile(r"(?<=\d)\.\s+(?=[A-Za-z0-9_.-]+/)")
PREFIX = "Reviewed spans (inclusive):"
# An explicitly declared repository directory may qualify a line-oriented
# list of RELATIVE subpaths. The subpath itself must contain '/', preventing
# basename-only guesses. Every Git tree/blob and nonblank count is still
# verified at the original reviewed SHA; partial rows remain quarantined.
PREFIXED_HEADER = re.compile(
    r"^Reviewed spans under (?P<base>[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)+):$"
)
PREFIXED_ITEM = re.compile(
    rf"^- (?P<rel>[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)+) lines "
    rf"(?P<ranges>{SPAN_TOKEN}(?:{RANGE_SEPARATOR}{SPAN_TOKEN})*)$"
)


def parse_explicit_unpinned(raw: object) -> list[dict] | None:
    """Do not guess missing blobs or treat basename-only prose as a Git path."""
    if not isinstance(raw, str) or "[blob " in raw:
        return None
    raw = raw.strip()
    if raw.startswith("Reviewed spans under "):
        pieces = raw.splitlines()
        header = PREFIXED_HEADER.fullmatch(pieces[0])
        if header is None or len(pieces) < 2:
            return None
        base = header.group("base")
        # Only documented explicit nested subpaths are accepted. No basename
        # searching, narrative inference, glob, or missing interval repair.
        if any(seg in {".", ".."} for seg in base.split("/")):
            return None
        expanded = []
        for item in pieces[1:]:
            match = PREFIXED_ITEM.fullmatch(item.strip())
            if match is None:
                return None
            relative = match.group("rel")
            if any(seg in {".", ".."} for seg in relative.split("/")):
                return None
            expanded.append(
                f"{base}/{relative} {match.group('ranges')}"
            )
        raw = "; ".join(expanded)
    if raw.startswith(PREFIX):
        raw = raw[len(PREFIX):].strip()
    if not raw:
        return None
    sources = []
    for semicolon_segment in raw.split(";"):
        for part in SOURCE_SENTENCE_SPLIT.split(semicolon_segment):
            match = SEGMENT.fullmatch(part.strip())
            if not match:
                return None
            path = match.group("path")
            if (path.startswith("/") or "\\" in path or ".." in path.split("/")
                    or "//" in path or ":" in path or path.startswith("./")):
                return None
            intervals = []
            for token in INTERVAL_SPLIT.split(match.group("ranges")):
                range_match = RANGE.fullmatch(token.strip())
                if range_match is None:
                    return None
                lo = int(range_match.group(1))
                hi = int(range_match.group(2) or range_match.group(1))
                if hi < lo:
                    return None
                intervals.append([lo, hi])
            sources.append({"path": path, "reported_inclusive_intervals": intervals})
    # A single workbook observation may list the SAME full path in several
    # disjoint interval fragments. Consolidate only identical, explicit paths
    # at the same reviewed commit. Do not count a repeated interval twice.
    grouped: dict[str, list[list[int]]] = {}
    for source in sources:
        grouped.setdefault(source["path"], []).extend(
            source["reported_inclusive_intervals"])
    consolidated = []
    for path, ranges in grouped.items():
        merged = []
        for start, end in sorted(ranges):
            if merged and start <= merged[-1][1] + 1:
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])
        consolidated.append({
            "path": path, "reported_inclusive_intervals": merged,
        })
    return consolidated


def contiguous_intervals(numbers: set[int]) -> list[list[int]]:
    result = []
    for n in sorted(numbers):
        if result and n == result[-1][1] + 1:
            result[-1][1] = n
        else:
            result.append([n, n])
    return result


def recover(repo: Path, rows: list[dict], checkpoint: dict) -> tuple[dict, list[dict]]:
    anchor, eligible_shas = first_parent_checkpoint(repo, checkpoint)
    blobs: dict[str, list[str] | None] = {}
    committed_paths: dict[tuple[str, str], str | None] = {}
    prior: dict[tuple[str, str], set[int]] = defaultdict(set)
    totals = Counter()
    statuses = Counter()
    audit = []
    for row in rows:
        if row.get("parsed_pin") is not None:
            continue
        sha = row.get("reviewed_master_sha")
        membership = ("unverified_anchor" if eligible_shas is None else
                      "in_900_first_parent_window" if sha in eligible_shas else
                      "outside_900_first_parent_window")
        record = {
            "excel_row": row["excel_row"],
            "review_id": row.get("review_id"),
            "reviewed_master_sha": sha,
            "window_membership": membership,
            "original_blob_pinned": False,
            "reviewed_loc_workbook_reported": row.get("reviewed_loc_reported"),
            "candidate_nonblank_loc": 0,
            "candidate_new_exact_path_blob_loc": 0,
            "candidate_repeated_exact_path_blob_loc": 0,
            "sources": [],
            "confidence": "workbook_span_plus_derived_git_commit_path_not_historical_blob_pin",
        }
        raw = row.get("reviewed_file_spans_raw")
        sources = parse_explicit_unpinned(raw)
        if sources is None:
            record["status"] = ("original_multi_blob_pins_deferred_to_main_audit"
                                if isinstance(raw, str) and "[blob " in raw else
                                "unparseable_unpinned_source_reference")
            statuses[record["status"]] += 1
            audit.append(record)
            continue
        if not isinstance(sha, str) or not SHA.fullmatch(sha):
            record["status"] = "missing_or_invalid_reviewed_commit_sha"
            statuses[record["status"]] += 1
            audit.append(record)
            continue
        validated = []
        failure = None
        for source in sources:
            path = source["path"]
            key = (sha, path)
            if key not in committed_paths:
                ok, payload = git(repo, "rev-parse", "--verify", f"{sha}:{path}")
                resolved = payload.strip().decode("ascii", "replace") if ok else ""
                committed_paths[key] = resolved if SHA.fullmatch(resolved) else None
            blob = committed_paths[key]
            if blob is None:
                failure = "commit_path_unavailable"
                break
            if blob not in blobs:
                ok, payload = git(repo, "cat-file", "blob", blob)
                if not ok or b"\x00" in payload:
                    blobs[blob] = None
                else:
                    try:
                        # A leading UTF-8 BOM is an encoding marker, not source
                        # LOC. Remove only that marker while preserving line
                        # coordinates and interior U+FEFF; the Git blob ID still
                        # identifies the original bytes, never normalized text.
                        blobs[blob] = payload.decode("utf-8-sig").splitlines()
                    except UnicodeDecodeError:
                        blobs[blob] = None
            lines = blobs[blob]
            if lines is None:
                failure = "unreadable_source_blob"
                break
            selected = set()
            for start, end in source["reported_inclusive_intervals"]:
                if end > len(lines):
                    failure = "source_interval_out_of_bounds"
                    break
                selected.update(i for i in range(start, end + 1) if lines[i - 1].strip())
            if failure:
                break
            validated.append((path, blob, source["reported_inclusive_intervals"], selected))
        actual_loc = sum(len(selected) for _, _, _, selected in validated)
        reported_loc = row.get("reviewed_loc_reported")
        if failure is None and (type(reported_loc) is not int or
                                actual_loc != reported_loc):
            failure = "workbook_nonblank_loc_mismatch"
        if failure:
            # All-or-nothing even when earlier file segments were resolvable.
            record["status"] = failure
            if failure == "workbook_nonblank_loc_mismatch":
                # Diagnostic only: candidate coverage remains zero for the
                # complete quarantined review, including its valid fragments.
                record["diagnostic_nonblank_loc_at_reviewed_commit"] = actual_loc
            statuses[failure] += 1
            audit.append(record)
            continue
        new = repeat = 0
        for path, blob, original_intervals, selected in validated:
            key = (path, blob)
            new += len(selected - prior[key])
            repeat += len(selected & prior[key])
            prior[key].update(selected)
            record["sources"].append({
                "path": path, "blob_derived_at_reviewed_commit": blob,
                "reported_inclusive_intervals": original_intervals,
                "nonblank_intervals_at_reviewed_commit": contiguous_intervals(selected),
                "nonblank_loc": len(selected),
                "original_blob_pinned": False,
            })
        record.update({
            "status": "git_source_at_review_commit_candidate_only",
            "candidate_nonblank_loc": actual_loc,
            "candidate_new_exact_path_blob_loc": new,
            "candidate_repeated_exact_path_blob_loc": repeat,
        })
        statuses[record["status"]] += 1
        totals["candidate_rows"] += 1
        totals["candidate_line_occurrences"] += actual_loc
        totals["candidate_new_exact_path_blob_loc"] += new
        totals["candidate_repeated_exact_path_blob_loc"] += repeat
        if membership == "in_900_first_parent_window":
            totals["in_window_candidate_rows"] += 1
            totals["in_window_candidate_line_occurrences"] += actual_loc
        audit.append(record)
    report = {
        "candidate_rows_sha256": audited_rows_sha256(audit),
        "candidate_rows_digest_method": "sha256_canonical_sorted_keys_jsonl_v1",
        "status": "provisional_source_at_commit_triage_not_verified_legacy_pin",
        "first_parent_checkpoint": anchor,
        "unparsed_historical_rows_examined": len(audit),
        "classifications": dict(sorted(statuses.items())),
        **dict(totals),
        "historical_900_density_recomputed": None,
        "distinct_defect_ids_reconciled": None,
        "included_in_verified_pin_denominator": False,
        "included_in_reported_historical_463_343492": False,
        "interpretation": (
            "Full source paths and line ranges are workbook reports. Git source "
            "blobs are derived from the reported commit, not original workbook pins. "
            "All multi-file candidates require exact nonblank LOC agreement. These "
            "counts are separate from independently pinned source and legacy rates."
        ),
    }
    return report, audit


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", type=Path, default=Path("."))
    ap.add_argument("--historical-root", type=Path,
                    default=Path("docs/engineering/aspects-historical"))
    ap.add_argument("--state", type=Path,
                    default=Path("docs/engineering/aspects-historical-restoration-state.json"))
    ap.add_argument("--json-out", type=Path, required=True)
    ap.add_argument("--rows-out", type=Path, required=True)
    args = ap.parse_args()
    verify(args.historical_root)
    rows = []
    for shard in sorted((args.historical_root / "review-events").glob("*.jsonl")):
        rows.extend(read_records(shard))
    if len(rows) != 5741:
        raise RuntimeError("Historical corpus incomplete; refusing inferred source recovery")
    state = json.loads(args.state.read_text(encoding="utf-8"))
    report, audit = recover(args.repo, rows, state["last_900_first_parent_snapshot"])
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.rows_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n",
                             encoding="utf-8")
    with args.rows_out.open("w", encoding="utf-8") as dest:
        for item in audit:
            dest.write(json.dumps(item, sort_keys=True) + "\n")
    print(json.dumps(report, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
