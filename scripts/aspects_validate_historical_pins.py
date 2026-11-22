#!/usr/bin/env python3
"""Conservatively verify workbook-sourced Aspects path/blob/line pins against Git.

These observations remain historical workbook reports, even when the referenced
Git blob and nonblank intervals can be independently revalidated. Validation
does not prove review happened, first-parent window membership, defect identity,
or cross-revision line equivalence. Never add this subset to another denominator.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
import subprocess

from aspects_review_evidence import read_records
from aspects_import_historical_workbook import _spans
from aspects_validate_historical_corpus import verify

SHA = re.compile(r"^[0-9a-f]{40}$")


def git(repo: Path, *args: str) -> tuple[bool, bytes]:
    proc = subprocess.run(
        ["git", "-C", str(repo), *args],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45, check=False,
    )
    return proc.returncode == 0, proc.stdout



VERIFIED = "git_blob_and_nonblank_intervals_verified"
MULTI_SOURCE_BOUNDARY = re.compile(
    r";\s+(?=[^;\[\]\n]+\s+\[blob [0-9a-f]{40}\b)"
)


def source_pins(row: dict) -> list[dict]:
    """Keep the old single-source schema; parse only fully pinned multi-file rows.

    All components must be unambiguous and blob-pinned. In particular, legacy
    basename-only summaries are never silently resolved to a Git path.
    """
    if row.get("parsed_pin") is not None:
        return [row["parsed_pin"]]
    raw = row.get("reviewed_file_spans_raw")
    if not isinstance(raw, str) or raw.count("[blob ") < 2:
        return []
    segments = MULTI_SOURCE_BOUNDARY.split(raw.strip())
    if len(segments) < 2:
        return []
    result = [_spans(segment) for segment in segments]
    return result if all(result) else []




def first_parent_checkpoint(repo: Path, checkpoint: dict | None) -> tuple[dict, set[str] | None]:
    """Verify the exact historical first-parent window and oldest SHA.

    A mismatched/short/unavailable chain has unknown membership, not zero
    eligible observations. Membership alone does not reconstruct defect density.
    """
    if checkpoint is None:
        return {"status": "not_requested"}, None
    head = checkpoint.get("head_sha")
    oldest = checkpoint.get("oldest_included_sha") or checkpoint.get("oldest_sha")
    count = checkpoint.get("window_first_parent_commits", 900)
    if not (isinstance(head, str) and SHA.fullmatch(head)
            and isinstance(oldest, str) and SHA.fullmatch(oldest)
            and type(count) is int and count > 0):
        return {"status": "invalid_checkpoint_fields"}, None
    ok, raw = git(repo, "rev-list", "--first-parent", f"--max-count={count}", head)
    commits = raw.decode("ascii", "replace").splitlines() if ok else []
    if not commits or commits[0] != head:
        return {"status": "head_unavailable", "head_sha": head}, None
    if len(commits) != count or commits[-1] != oldest:
        return {
            "status": "checkpoint_anchor_mismatch", "head_sha": head,
            "expected_oldest_sha": oldest, "actual_oldest_sha": commits[-1],
            "actual_commits": len(commits), "requested_commits": count,
        }, None
    return {
        "status": "verified_first_parent_sha_membership",
        "head_sha": head, "oldest_sha": oldest,
        "first_parent_commits": len(commits),
        "scope": "exact commit membership only; not legacy LOC or defect reconstruction",
    }, set(commits)


def inspect_pin(
    repo: Path, row: dict, source_cache: dict[tuple[str, str], str | None],
    lines_cache: dict[str, list[str] | None],
) -> tuple[str, set[int]]:
    """Return classification and exact nonblank lines for one pinned revision."""
    pin = row.get("parsed_pin")
    if pin is None:
        return "not_parseable", set()
    commit = row.get("reviewed_master_sha")
    blob = pin.get("blob")
    path = pin.get("path")
    spans = pin.get("spans")
    if not (isinstance(commit, str) and SHA.fullmatch(commit)
            and isinstance(blob, str) and SHA.fullmatch(blob)
            and isinstance(path, str) and bool(path)
            and isinstance(spans, list) and bool(spans)):
        return "invalid_identity", set()
    identity = (commit, path)
    if identity not in source_cache:
        ok, payload = git(repo, "rev-parse", "--verify", f"{commit}:{path}")
        resolved = payload.strip().decode("ascii", "replace") if ok else None
        source_cache[identity] = resolved if resolved and SHA.fullmatch(resolved) else None
    actual = source_cache[identity]
    if actual is None:
        return "path_or_commit_unavailable", set()
    if actual != blob:
        return "blob_mismatch", set()
    if blob not in lines_cache:
        ok, payload = git(repo, "cat-file", "-p", blob)
        if not ok or b"\x00" in payload:
            lines_cache[blob] = None
        else:
            try:
                lines_cache[blob] = payload.decode("utf-8").splitlines()
            except UnicodeDecodeError:
                lines_cache[blob] = None
    lines = lines_cache[blob]
    if lines is None:
        return "blob_unreadable", set()
    selected: set[int] = set()
    for span in spans:
        if (not isinstance(span, list) or len(span) != 2
                or type(span[0]) is not int or type(span[1]) is not int
                or span[0] < 1 or span[1] < span[0] or span[1] > len(lines)):
            return "span_out_of_bounds", set()
        selected.update(range(span[0], span[1] + 1))
    if any(not lines[index - 1].strip() for index in selected):
        return "blank_line_in_reported_span", set()
    return "git_blob_and_nonblank_intervals_verified", selected



def verify_pins(
    repo: Path, rows: list[dict], checkpoint: dict | None = None,
    audit_rows: list[dict] | None = None,
) -> dict:
    source_cache: dict[tuple[str, str], str | None] = {}
    lines_cache: dict[str, list[str] | None] = {}
    counts: Counter[str] = Counter()
    by_content: dict[tuple[str, str], set[int]] = defaultdict(set)
    window_content: dict[tuple[str, str], set[int]] = defaultdict(set)
    duplicates = line_occurrences = positive_rows = clean_rows = 0
    quarantined: list[dict] = []
    window_counts: Counter[str] = Counter()
    window_summary, eligible_shas = first_parent_checkpoint(repo, checkpoint)
    for row in rows:
        pins = source_pins(row)
        reviewed = []
        status = "not_parseable"
        if pins:
            checked = [
                (pin, *inspect_pin(
                    repo, {**row, "parsed_pin": pin}, source_cache, lines_cache
                )) for pin in pins
            ]
            invalid = next((kind for _, kind, _ in checked if kind != VERIFIED), None)
            if invalid is None:
                status = VERIFIED
                reviewed = [(pin, lines) for pin, _, lines in checked]
            else:
                # Multi-file rows are atomic: one bad segment quarantines the
                # entire review, never silently counting the valid fragments.
                status = invalid if len(pins) == 1 else "multisource_" + invalid
        if status == VERIFIED and len(pins) > 1:
            # Workbook provenance must agree with the COMPLETE atomic review.
            # A parser that silently drops one multi-file component must never
            # promote its surviving subset as a verified historical review.
            reported = row.get("reviewed_loc_reported")
            actual = sum(len(lines) for _, lines in reviewed)
            if type(reported) is not int or reported != actual:
                status = "multisource_reported_loc_mismatch"
                reviewed = []
        counts[status] += 1
        membership = ("not_checked" if checkpoint is None else
                      "membership_unverified" if eligible_shas is None else
                      "in_window" if row.get("reviewed_master_sha") in eligible_shas else
                      "not_on_first_parent_window")
        window_counts[membership] += 1
        record = {
            "excel_row": row["excel_row"], "review_id": row.get("review_id"),
            "reviewed_master_sha": row.get("reviewed_master_sha"),
            "pin_status": status, "window_membership": membership,
            "new_exact_path_blob_loc": 0, "repeated_exact_path_blob_loc": 0,
            "nonblank_reviewed_loc": 0,
            "provenance": "historical_workbook_reported; git_source_identity_only",
        }
        if len(pins) == 1:
            record.update({"path": pins[0].get("path"), "blob": pins[0].get("blob"),
                           "spans": pins[0].get("spans")})
        elif len(pins) > 1:
            record["pinned_sources"] = pins
        if status != VERIFIED:
            quarantined.append({"excel_row": row["excel_row"], "reason": status})
            if audit_rows is not None:
                audit_rows.append(record)
            continue
        fresh = repeated = occurrences = 0
        for pin, covered in reviewed:
            content_key = (pin["path"], pin["blob"])
            prior = by_content[content_key]
            repeated += len(covered & prior)
            fresh += len(covered - prior)
            prior.update(covered)
            occurrences += len(covered)
            if membership == "in_window":
                window_content[content_key].update(covered)
        record.update({"new_exact_path_blob_loc": fresh,
                       "repeated_exact_path_blob_loc": repeated,
                       "nonblank_reviewed_loc": occurrences})
        duplicates += repeated
        line_occurrences += occurrences
        if row["defects_recorded"] == 0:
            clean_rows += 1
        else:
            positive_rows += 1
        if audit_rows is not None:
            audit_rows.append(record)
    exact_unique = sum(len(lines) for lines in by_content.values())
    # This is a separate source-pin-verified subset, not 343,492 historical LOC.
    window_unique = (sum(len(lines) for lines in window_content.values())
                     if eligible_shas is not None else None)
    window_summary.update({
        "review_events_by_membership": dict(sorted(window_counts.items())),
        "verified_nonblank_exact_path_blob_unique_loc_subset": window_unique,
        "confidence": "git_pin_verified_only_no_historical_density_reconstruction",
    })
    return {
        "status": "git_blob_and_nonblank_intervals_subset_only_cross_revision_unresolved",
        "review_events_present": len(rows),
        "candidate_pin_count": sum(bool(source_pins(row)) for row in rows),
        "classifications": dict(sorted(counts.items())),
        "verified_pin_rows": counts[VERIFIED],
        "verified_clean_review_rows": clean_rows,
        "verified_defect_positive_rows_not_distinct_defects": positive_rows,
        "verified_nonblank_line_occurrences": line_occurrences,
        "verified_unique_exact_path_blob_lines": exact_unique,
        "verified_repeated_exact_path_blob_lines": duplicates,
        "verified_path_blob_identities": len(by_content),
        "unverified_sample": quarantined[:100],
        "unverified_total_excluding_unparseable": len(quarantined) - counts["not_parseable"],
        "quarantined_or_ambiguous_total": len(quarantined),
        "full_quarantine_details": "see audited row-by-row JSONL artifact",
        "first_parent_checkpoint": window_summary,
        "known_all_history_incremental_loc_reported_not_git_union": 402314,
        "historical_900_first_parent_density_recomputed": None,
        "recent_ledger_combined_density": None,
        "cross_revision_lineage": "unresolved",
        "confidence": "source_pin_integrity_only_not_independent_reconstruction_of_review_history",
        "note": "Nonblank pinned source is not proof that a review occurred. "
                "Exact path/blob overlap does not establish cross-revision line identity.",
    }


def audited_rows_sha256(rows: list[dict]) -> str:
    """Digest the exact canonical UTF-8 JSONL audit consumed by lineage.

    This binds the aggregate pin report to its 5,741 row-level decisions and
    detects stale/mispaired artifacts. It does not authenticate the workbook.
    """
    digest = hashlib.sha256()
    for row in rows:
        digest.update((json.dumps(row, sort_keys=True) + "\n").encode("utf-8"))
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--historical-root", type=Path,
                        default=Path("docs/engineering/aspects-historical"))
    parser.add_argument("--state", type=Path,
                        default=Path("docs/engineering/aspects-historical-restoration-state.json"))
    parser.add_argument("--json-out", type=Path)
    parser.add_argument("--row-jsonl-out", type=Path)
    args = parser.parse_args()
    # Fail closed if the imported source has drifted or clean rows went missing.
    verify(args.historical_root)
    rows = []
    for path in sorted((args.historical_root / "review-events").glob("*.jsonl")):
        rows.extend(read_records(path))
    checkpoint = json.loads(args.state.read_text(encoding="utf-8"))["last_900_first_parent_snapshot"]
    row_details: list[dict] = []
    report = verify_pins(args.repo, rows, checkpoint=checkpoint, audit_rows=row_details)
    if len(row_details) != len(rows):
        raise RuntimeError("Incomplete row-level pin audit; refusing partial artifact")
    report["audited_rows_sha256"] = audited_rows_sha256(row_details)
    report["audited_rows_digest_method"] = "sha256_canonical_sorted_keys_jsonl_v1"
    result = json.dumps(report, sort_keys=True, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(result, encoding="utf-8")
    if args.row_jsonl_out:
        args.row_jsonl_out.parent.mkdir(parents=True, exist_ok=True)
        with args.row_jsonl_out.open("w", encoding="utf-8") as out:
            for row in row_details:
                out.write(json.dumps(row, sort_keys=True) + "\n")
    print(result)

if __name__ == "__main__":
    main()
