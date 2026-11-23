#!/usr/bin/env python3
"""Recheck Git-derived historical source candidates in a CURRENT master 900 window.

Original workbook evidence and the old historical first-parent pin audit remain
immutable. Derived Git blobs are NOT original workbook blob pins. This audit
reports candidate-only source identities as a separate, quarantined population.
It never promotes them into newly reviewed LOC or a defect-density denominator.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path

from aspects_current_master_900_eligibility import reconstruct_cohort
from aspects_density_snapshot import cohort_identity
from aspects_reconcile_historical_corpus import load_corpus
from aspects_reconcile_recovered_candidates import intervals
from aspects_review_evidence import SHA, read_records
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256, git


def audit_current(repo: Path, events: list[dict], pins: list[dict],
                  pin_report: dict, candidate_rows: list[dict],
                  candidate_report: dict, cohort: dict,
                  expected_rows: int = 5741, first_excel_row: int = 7) -> dict:
    if (cohort.get("status") != "complete"
            or cohort_identity(cohort.get("ordered_shas"), cohort.get("head_sha"),
                               cohort.get("requested_commits")) != cohort):
        raise ValueError("current first-parent SHA cohort/digest is invalid")
    if (len(events) != expected_rows or len(pins) != expected_rows
            or sorted(x.get("excel_row") for x in events)
               != list(range(first_excel_row, first_excel_row + expected_rows))
            or sorted(x.get("excel_row") for x in pins)
               != list(range(first_excel_row, first_excel_row + expected_rows))
            or pin_report.get("review_events_present") != expected_rows
            or audited_rows_sha256(pins) != pin_report.get("audited_rows_sha256")
            or audited_rows_sha256(candidate_rows) != candidate_report.get("candidate_rows_sha256")
            or len(candidate_rows) != candidate_report.get("unparsed_historical_rows_examined")):
        raise ValueError("immutable historical workbook and SHA-bound Git recovery audits disagree")
    source = {r["excel_row"]: r for r in events}
    original = {r["excel_row"]: r for r in pins}
    candidate_ids = [r.get("excel_row") for r in candidate_rows]
    if (any(type(r) is not int for r in candidate_ids)
            or len(set(candidate_ids)) != len(candidate_ids)
            or not set(candidate_ids).issubset(source)):
        raise ValueError("candidate Excel row IDs missing, duplicated, or not in original workbook")
    for row in events:
        pinned = original[row["excel_row"]]
        if (row.get("reviewed_master_sha") != pinned.get("reviewed_master_sha")
                or row.get("review_id") != pinned.get("review_id")):
            raise ValueError("original workbook review row identity changed")
    members = set(cohort["ordered_shas"])
    old_exact: dict[tuple[str, str], set[int]] = defaultdict(set)
    for row in pins:
        if (row.get("reviewed_master_sha") not in members
                or row.get("pin_status") != VERIFIED):
            continue
        for s in row.get("pinned_sources") or [row]:
            old_exact[(s["path"], s["blob"])].update(intervals(s, "spans"))
    cache: dict[tuple[str, str], str | None] = {}
    source_lines: dict[str, list[str] | None] = {}
    eligible = recovered = outside = unresolved = clean = positive = 0
    occurrences = 0
    recovered_union: dict[tuple[str, str], set[int]] = defaultdict(set)
    reasons = Counter()
    for row in candidate_rows:
        excel = row["excel_row"]
        orig = source[excel]
        sha = row.get("reviewed_master_sha")
        if (orig.get("reviewed_master_sha") != sha
                or orig.get("review_id") != row.get("review_id")
                or orig.get("reviewed_loc_reported") != row.get("reviewed_loc_workbook_reported")
                or row.get("original_blob_pinned") is not False):
            raise ValueError("candidate original workbook review/provenance identity mismatch")
        if sha not in members:
            outside += 1
            continue
        eligible += 1
        if row.get("status") != "git_source_at_review_commit_candidate_only":
            unresolved += 1
            reasons[row.get("status") or "missing_status"] += 1
            continue
        sources = row.get("sources")
        if not isinstance(sources, list) or not sources:
            raise ValueError("candidate reviewed source list unavailable")
        total = 0
        checked = []
        for s in sources:
            path, blob = s.get("path"), s.get("blob_derived_at_reviewed_commit")
            if (not isinstance(path, str) or not path
                    or not isinstance(blob, str) or not SHA.fullmatch(blob)):
                raise ValueError("candidate Git path/blob identity invalid")
            key = (sha, path)
            if key not in cache:
                ok, data = git(repo, "rev-parse", "--verify", f"{sha}:{path}")
                digest = data.decode("ascii", "replace").strip() if ok else None
                cache[key] = digest if digest and SHA.fullmatch(digest) else None
            if cache[key] != blob:
                raise ValueError("candidate source blob disagrees with its reviewed Git commit")
            if blob not in source_lines:
                ok, data = git(repo, "cat-file", "blob", blob)
                if not ok or b"\x00" in data:
                    source_lines[blob] = None
                else:
                    try:
                        source_lines[blob] = data.decode("utf-8-sig").splitlines()
                    except UnicodeDecodeError:
                        source_lines[blob] = None
            text = source_lines[blob]
            chosen = intervals(s, "nonblank_intervals_at_reviewed_commit")
            if (text is None or not chosen or max(chosen) > len(text)
                    or any(not text[n - 1].strip() for n in chosen)
                    or len(chosen) != s.get("nonblank_loc")):
                raise ValueError("candidate nonblank reviewed intervals differ from Git")
            total += len(chosen)
            checked.append((path, blob, chosen))
        if (total != row.get("candidate_nonblank_loc")
                or total != row.get("reviewed_loc_workbook_reported")):
            raise ValueError("complete candidate review LOC differs from workbook")
        # Add only after validating the ENTIRE candidate multi-source row.
        for path, blob, chosen in checked:
            recovered_union[(path, blob)].update(chosen)
        occurrences += total
        recovered += 1
        if orig.get("defects_recorded") == 0:
            clean += 1
        elif type(orig.get("defects_recorded")) is int and orig["defects_recorded"] > 0:
            positive += 1
        else:
            raise ValueError("candidate workbook defect count invalid")
    candidate_unique = sum(map(len, recovered_union.values()))
    original_shared = sum(len(lines & old_exact.get(key, set()))
                          for key, lines in recovered_union.items())
    if not 0 <= original_shared <= candidate_unique <= occurrences:
        raise ValueError("candidate exact union/repeat arithmetic invalid")
    return {
        "status": "current_master_900_derived_review_source_candidate_provenance",
        "captured_utc": datetime.now(timezone.utc).isoformat(),
        "cohort": {
            "head_sha": cohort["head_sha"],
            "oldest_included_sha": cohort["oldest_included_sha"],
            "first_parent_commits": cohort["actual_commits"],
            "ordered_shas_sha256": cohort["ordered_shas_sha256"],
        },
        "historical_observations_imported": len(events),
        "candidate_rows_total_all_history": len(candidate_rows),
        "candidate_rows_in_current_cohort": eligible,
        "candidate_rows_outside_current_cohort": outside,
        "candidate_rows_unresolved_in_current_cohort": unresolved,
        "candidate_rows_unresolved_reasons": dict(sorted(reasons.items())),
        "candidate_source_rows_reverified_git_in_current_cohort": recovered,
        "candidate_clean_review_rows_in_current_cohort": clean,
        "candidate_positive_review_rows_in_current_cohort": positive,
        "candidate_line_occurrences_at_reported_review_shas": occurrences,
        "candidate_unique_exact_path_blob_line_identities": candidate_unique,
        "candidate_exact_repeated_line_occurrences": occurrences - candidate_unique,
        "candidate_exact_overlap_with_original_pins": original_shared,
        "candidate_exact_identities_not_in_original_pins": candidate_unique - original_shared,
        "candidate_rows_promoted_to_independent_original_blob_pins": 0,
        "newly_independently_verified_reviewed_loc": 0,
        "newly_verified_distinct_defect_discoveries": None,
        "full_cross_revision_900_reviewed_loc": None,
        "new_comparable_900_density": None,
        "confidence": "workbook_explicit_source_interval_plus_Git_blob_at_review_commit_only; original workbook blob pin absent",
        "limitation": (
            "This is the existing derived candidate population filtered to a "
            "different, current master-base 900 first-parent cohort. Candidate-only "
            "row observations may be clean or positive but lack original blob pins; "
            "source-line identity, cross-revision uniqueness, independent review "
            "verification and distinct discovery identity remain separate. No "
            "candidate coverage is added to the verified denominator."
        ),
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--repo", type=Path, default=Path("."))
    p.add_argument("--master-base-head", required=True)
    p.add_argument("--window", type=int, default=900)
    p.add_argument("--historical-root", type=Path,
                   default=Path("docs/engineering/aspects-historical"))
    p.add_argument("--pin-rows", type=Path, required=True)
    p.add_argument("--pin-report", type=Path, required=True)
    p.add_argument("--candidate-rows", type=Path, required=True)
    p.add_argument("--candidate-report", type=Path, required=True)
    p.add_argument("--json-out", type=Path, required=True)
    a = p.parse_args()
    cohort = reconstruct_cohort(a.repo, a.master_base_head, a.window)
    result = audit_current(
        a.repo, load_corpus(a.historical_root), read_records(a.pin_rows),
        json.loads(a.pin_report.read_text(encoding="utf-8")),
        read_records(a.candidate_rows),
        json.loads(a.candidate_report.read_text(encoding="utf-8")),
        cohort)
    a.json_out.parent.mkdir(parents=True, exist_ok=True)
    a.json_out.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n",
                          encoding="utf-8")
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
