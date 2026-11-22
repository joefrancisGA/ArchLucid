#!/usr/bin/env python3
"""Lossless, provenance-labeled migration of the Aspects historical XLSX evidence.

No third-party libraries needed. This import preserves *reported* historical counts,
including clean reviews. It does not promote workbook line claims into Git-verified
path/blob coverage, nor add the new narrow ledger to a legacy denominator.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
from xml.etree import ElementTree as ET
from zipfile import ZipFile

XML = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
COL = re.compile(r"^([A-Z]+)")
SHA = re.compile(r"^[a-f0-9]{40}$")
BLOB_SPANS = re.compile(
    r"^(?P<path>.+?)\s+\[blob (?P<blob>[0-9a-f]{40})(?:;[^\]]*)?\]\s+(?P<ranges>.+)$"
)
RANGE = re.compile(r"^([1-9][0-9]*)(?:[-–—]([1-9][0-9]*))?$")
NUMERIC = re.compile(r"^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$")
DEFAULT_NAME = "ArchLucid_Defect_Density_Trend_repaired.xlsx"
EXPECTED_WORKBOOK_SHA256 = "9fab94e0cd7d642f84d37ae9b8988e72b34367a479ebdba65fb893349ade0787"
EXPECTED_HEADER = [
    "Review period (ET)", "Reviewed master SHA", "Defect ID", "Defects",
    "Reviewed lines", "New unique lines", "Status", "Scope",
    "Source reference", "Reviewed file spans",
]
BASELINE_GOLDEN = {
    "window": 900,
    "as_of_utc": "2026-11-22T14:43:27.293Z",
    "head_sha": "15ac3b9abeff23e4fa8cb7a16027bf9b17211251",
    "oldest_sha": "6252805a908f5bf0413bb40c68cb546013ff1843",
    "defects": 463,
    "unique_loc": 343492,
}


def _excel_rows(archive: ZipFile, tab: int):
    """Read sparse sheet rows, expanding to stable 1-based column coordinates."""
    shared = []
    if "xl/sharedStrings.xml" in archive.namelist():
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        for si in root.findall(f"{XML}si"):
            shared.append("".join(el.text or "" for el in si.iter(f"{XML}t")))
    root = ET.fromstring(archive.read(f"xl/worksheets/sheet{tab}.xml"))
    for row in root.findall(f".//{XML}sheetData/{XML}row"):
        values = {}
        for cell in row.findall(f"{XML}c"):
            match = COL.match(cell.attrib.get("r", ""))
            if not match:
                continue
            index = 0
            for char in match.group(1):
                index = index * 26 + ord(char) - ord("A") + 1
            kind = cell.attrib.get("t")
            if kind == "inlineStr":
                value = "".join(e.text or "" for e in cell.iter(f"{XML}t"))
            else:
                node = cell.find(f"{XML}v")
                value = node.text if node is not None else None
                if kind == "s" and value is not None:
                    value = shared[int(value)]
                elif value is not None and kind not in ("str", "e", "b", "d") and NUMERIC.fullmatch(value):
                    value = float(value) if "." in value or "E" in value.upper() else int(value)
            values[index - 1] = value
        yield int(row.attrib["r"]), [values.get(i) for i in range(max(values, default=-1) + 1)]


def _cells(row, columns):
    return (row + [None] * columns)[:columns]


def _spans(raw: str):
    """Parse only unambiguous, blob-pinned single-source line intervals."""
    if not isinstance(raw, str):
        return None
    match = BLOB_SPANS.fullmatch(raw.strip())
    if not match:
        return None
    path = match.group("path")
    if path.startswith("/") or "\\" in path or ".." in path.split("/") or "/" not in path:
        return None
    ranges = []
    for part in match.group("ranges").split(","):
        m = RANGE.fullmatch(part.strip())
        if not m:
            return None
        start, end = int(m.group(1)), int(m.group(2) or m.group(1))
        if end < start:
            return None
        ranges.append([start, end])
    return {"path": path, "blob": match.group("blob"), "spans": ranges}


def extract(workbook: Path):
    """Return workbook observations, 900-commit snapshots, immutable provenance."""
    file_hash = hashlib.sha256(workbook.read_bytes()).hexdigest()
    if file_hash != EXPECTED_WORKBOOK_SHA256:
        raise ValueError("Historical workbook SHA256 mismatch; review provenance before importing")
    events = []
    snapshots = []
    with ZipFile(workbook) as book:
        review_header = None
        for excel_row, row in _excel_rows(book, 3):
            if excel_row == 6:
                review_header = _cells(row, 10)
                if review_header != EXPECTED_HEADER:
                    raise ValueError(f"Unrecognized review sheet columns: {review_header}")
            if excel_row < 7:
                continue
            v = _cells(row, 10)
            if all(x is None for x in v):
                continue
            # 30 early workbook rows never recorded a new-unique-line count.
            # Preserve that missing value as unknown, not as a fabricated zero.
            if not isinstance(v[3], (int, float)) or not isinstance(v[4], (int, float)):
                raise ValueError(f"Non-numeric defect/review counts in Review evidence!{excel_row}")
            if v[5] is not None and not isinstance(v[5], (int, float)):
                raise ValueError(f"Invalid incremental count in Review evidence!{excel_row}")
            defects, reviewed = int(v[3]), int(v[4])
            fresh = int(v[5]) if v[5] is not None else None
            if defects != v[3] or reviewed != v[4] or (fresh is not None and fresh != v[5]):
                raise ValueError(f"Fractional counts in Review evidence!{excel_row}")
            if defects < 0 or reviewed < 0 or (fresh is not None and (fresh < 0 or fresh > reviewed)):
                raise ValueError(f"Invalid review count in Review evidence!{excel_row}")
            pin = _spans(v[9])
            events.append({
                "source": DEFAULT_NAME,
                "source_sha256": file_hash,
                "sheet": "Review evidence",
                "excel_row": excel_row,
                "review_period_et": v[0],
                "reviewed_master_sha": v[1],
                "review_id": v[2],
                "defects_recorded": defects,
                "reviewed_loc_reported": reviewed,
                "new_unique_loc_reported": fresh,
                "repeated_loc_reported": reviewed - fresh if fresh is not None else None,
                "historical_status": v[6],
                "scope": v[7],
                "source_reference": v[8],
                "reviewed_file_spans_raw": v[9],
                "parsed_pin": pin,
                "provenance": "historical_workbook_reported_unverified",
            })
        for excel_row, row in _excel_rows(book, 5):
            if excel_row < 2:
                continue
            v = _cells(row, 11)
            if v[5] != 900 or not isinstance(v[2], (int, float)):
                continue
            snapshots.append({
                "excel_row": excel_row,
                "as_of_utc": v[0],
                "as_of_et": v[1],
                "defects_reported": int(v[2]),
                "unique_loc_reported": int(v[3]),
                "density_per_kloc_reported": v[4],
                "window_first_parent_commits": 900,
                "head_sha": v[6],
                "oldest_sha": v[7],
                "coverage": v[8],
                "evidence_reference": v[9],
                "sma_25_reported": v[10],
                "provenance": "historical_workbook_partial_snapshot",
            })
    if len(events) != 5741 or events[0]["excel_row"] != 7 or events[-1]["excel_row"] != 5747:
        raise ValueError(f"Unexpected Review evidence population: {len(events)} rows")
    if sum(e["defects_recorded"] for e in events) != 877:
        raise ValueError("Historical review defect observations changed unexpectedly")
    if sum(e["new_unique_loc_reported"] or 0 for e in events) != 402314:
        raise ValueError("Historical incremental LOC changed unexpectedly")
    if sum(not e["defects_recorded"] for e in events) != 4864:
        raise ValueError("Historical clean observations changed unexpectedly")
    if not snapshots:
        raise ValueError("Missing 900-commit snapshot series")
    last = snapshots[-1]
    for field, expected in (
        ("as_of_utc", BASELINE_GOLDEN["as_of_utc"]),
        ("head_sha", BASELINE_GOLDEN["head_sha"]),
        ("oldest_sha", BASELINE_GOLDEN["oldest_sha"]),
        ("defects_reported", BASELINE_GOLDEN["defects"]),
        ("unique_loc_reported", BASELINE_GOLDEN["unique_loc"]),
    ):
        if last[field] != expected:
            raise ValueError(f"Historical 900-commit checkpoint drift: {field}")
    if abs(last["density_per_kloc_reported"] - 1000 * 463 / 343492) > 1e-10:
        raise ValueError("900-commit density doesn't match numerator/denominator")
    return events, snapshots, file_hash


def reconcile_exact_pins(events: list[dict], verified_ledger: list[dict]):
    """Overlap report, NOT a cross-revision or historical LOC union."""
    by_blob = {}
    for row in verified_ledger:
        if row.get("verified") is not True or not row.get("blob") or not row.get("path"):
            continue
        key = (row["path"], row["blob"])
        lines = by_blob.setdefault(key, set())
        for start, end in row.get("spans", []):
            lines.update(range(start, end + 1))
    matches, shared, unmapped = 0, 0, 0
    for event in events:
        pin = event["parsed_pin"]
        if pin is None:
            unmapped += 1
            continue
        previous = by_blob.get((pin["path"], pin["blob"]), set())
        overlap = sum(sum(line in previous for line in range(lo, hi + 1)) for lo, hi in pin["spans"])
        if overlap:
            matches += 1
            shared += overlap
    return {
        "legacy_single_file_blob_pins_overlap_with_new_ledger": matches,
        "overlapping_source_span_line_occurrences": shared,
        "legacy_rows_without_parseable_single_source_blob_pin": unmapped,
        "warning": "Not an all-history unique LOC count: cross-revision and legacy multi-file spans not reconciled.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--new-ledger", type=Path)
    args = parser.parse_args()
    events, snapshots, sha = extract(args.workbook)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    files = [
        ("aspects-historical-review-events.jsonl", events),
        ("aspects-historical-900-commit-snapshots.jsonl", snapshots),
    ]
    for filename, rows in files:
        with (args.output_dir / filename).open("w", encoding="utf-8") as out:
            for row in rows:
                out.write(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n")
    review_ledger = []
    if args.new_ledger and args.new_ledger.exists():
        review_ledger = [json.loads(line) for line in args.new_ledger.read_text(encoding="utf-8").splitlines() if line.strip()]
    stats = {
        "format_version": 1,
        "source_name": DEFAULT_NAME,
        "source_sha256": sha,
        "total_historical_observations": len(events),
        "clean_historical_observations": sum(e["defects_recorded"] == 0 for e in events),
        "historical_defect_observations_sum_not_distinct": sum(e["defects_recorded"] for e in events),
        "all_history_incremental_loc_sum_not_window_union": sum(e["new_unique_loc_reported"] or 0 for e in events),
        "historical_observations_missing_incremental_loc": sum(e["new_unique_loc_reported"] is None for e in events),
        "all_history_reviewed_loc_occurrences": sum(e["reviewed_loc_reported"] for e in events),
        "single_source_blob_pinned_rows_parseable_not_git_validated": sum(e["parsed_pin"] is not None for e in events),
        "historical_snapshot_count_900_commits": len(snapshots),
        "last_legacy_900_snapshot": snapshots[-1],
        "new_ledger_overlap": reconcile_exact_pins(events, review_ledger),
        "source_truth": "legacy_workbook_claims_preserved_with_source_sha256; no automatic verified promotion",
        "current_cross_revision_density": None,
        "next_step": "Validate parseable pinned source spans against Git, preserve unknown spans as legacy-only, then reconcile first-parent window membership.",
    }
    (args.output_dir / "aspects-historical-import-manifest.json").write_text(
        json.dumps(stats, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps({
        "events": len(events),
        "clean": stats["clean_historical_observations"],
        "incremental_loc": stats["all_history_incremental_loc_sum_not_window_union"],
        "legacy_900_loc": snapshots[-1]["unique_loc_reported"],
        "legacy_900_defects": snapshots[-1]["defects_reported"],
        "parseable_pins": stats["single_source_blob_pinned_rows_parseable_not_git_validated"],
        "workbook_sha256": sha,
    }, sort_keys=True))


if __name__ == "__main__":
    main()
