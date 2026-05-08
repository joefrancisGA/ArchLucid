#!/usr/bin/env python3
"""
Validate docs/go-to-market/PROCUREMENT_PACK_INDEX.md canonical buyer evidence table
and the Procurement artifact status map section.

Checks:
  - Required columns appear in order on the canonical table.
  - Evidence Type ∈ approved token set (matches procurement accelerator wording).
  - Source File markdown links resolve to existing repo paths.
  - "Implemented" and "Self-asserted" rows: Last reviewed UTC ≤ 90 days from reference date.
  - Status map: Status ∈ fixed buyer vocabulary; links resolve; "Deferred" rows cite V1_DEFERRED in Notes.
  - No buyer-placeholder tokens (TBD/TODO/...) in the index body.
  - No forbidden SOC 2 / ISO / third-party pen-test completion wording (honest procurement posture).

Run from repo root: python scripts/ci/check_procurement_pack_index.py
"""

from __future__ import annotations

import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


_SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

import procurement_pack_validation as pp_val  # noqa: E402


LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
APPROVED_TYPES = frozenset(
    {
        "Implemented",
        "Self-asserted",
        "In flight",
        "Deferred V1.1",
    },
)
STATUS_MAP_STATUSES = frozenset(
    {
        "Implemented",
        "Self-attested",
        "Template",
        "Deferred",
        "Not applicable",
        "External/NDA-gated",
    },
)
STATUS_MAP_HEADING = "## Procurement artifact status map (buyer-safe classification)"
STATUS_MAP_HEADER = [
    "Procurement Artifact",
    "Status",
    "Source File",
    "Notes",
]
CANONICAL_TYPES_REQUIRING_FRESHNESS = frozenset({"Implemented", "Self-asserted"})
INDEX_CANONICAL_REVIEW_MAX_AGE = timedelta(days=90)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def parse_table_paths(text: str) -> tuple[list[list[str]], int]:
    rows: list[list[str]] = []
    header_idx = text.find("| Evidence Artifact |")
    if header_idx < 0:
        return [], header_idx

    block = text[header_idx:]
    for raw_line in block.splitlines():
        line = raw_line.strip()
        if not line.startswith("|"):
            if rows:
                break
            continue
        if "---" in raw_line.replace(" ", ""):
            continue
        parts = [p.strip() for p in line.strip("|").split("|")]
        if len(parts) < 5:
            continue
        rows.append(parts)
    return rows, header_idx


def parse_status_map_rows(text: str) -> tuple[list[list[str]], list[str]]:
    errors: list[str] = []
    start = text.find(STATUS_MAP_HEADING)
    if start < 0:
        errors.append(f"Missing section {STATUS_MAP_HEADING!r}")
        return [], errors

    tail = text[start:]
    rows: list[list[str]] = []
    in_table = False

    for raw_line in tail.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if stripped.startswith("## ") and stripped != STATUS_MAP_HEADING.strip():
            if in_table:
                break
            continue

        if not stripped.startswith("|"):
            if in_table and rows:
                break
            continue

        if "---" in stripped.replace(" ", ""):
            in_table = True
            continue

        parts = [p.strip() for p in stripped.strip("|").split("|")]

        if len(parts) > 4:
            if in_table and rows:
                break
            continue

        if len(parts) < 4:
            continue

        if parts[0] == STATUS_MAP_HEADER[0] and parts[1] == STATUS_MAP_HEADER[1]:
            in_table = True
            if parts[:4] != STATUS_MAP_HEADER:
                errors.append(
                    "Status map header mismatch — expected "
                    + f"{STATUS_MAP_HEADER!r}, observed {parts[:4]!r}",
                )
            continue

        if in_table:
            rows.append(parts)

    if not rows and not errors:
        errors.append("Status map table has no data rows.")

    return rows, errors


def normalize_source_link(href: str, index_md: Path, root: Path) -> Path | None:
    h = href.split("#", 1)[0].strip()
    if not h:
        return None
    base = index_md.parent
    target = (base / h).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return None
    return target


def parse_iso_date(cell: str) -> datetime.date | None:
    s = cell.strip()
    m = re.match(r"(\d{4}-\d{2}-\d{2})", s)
    if not m:
        return None
    try:
        return datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc).date()
    except ValueError:
        return None


def validate_status_map(
    rows: list[list[str]],
    index_md: Path,
    root: Path,
) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    for parts in rows:
        if len(parts) < 4:
            errors.append(f"Status map short row (<4 columns): {parts!r}")
            continue

        artifact, status_cell, source_blob, notes = parts[0], parts[1], parts[2], parts[3]
        status = status_cell.strip()

        if status not in STATUS_MAP_STATUSES:
            errors.append(
                f"Status map {artifact!r}: invalid Status {status!r} (allowed {sorted(STATUS_MAP_STATUSES)})",
            )

        if status == "Deferred" and "V1_DEFERRED" not in notes:
            errors.append(
                f"Status map {artifact!r}: Deferred row Notes must cite V1_DEFERRED (got {notes!r})",
            )

        found_link = False
        for m in LINK_RE.finditer(source_blob):
            found_link = True
            target = normalize_source_link(m.group(1), index_md, root)

            if target is None:
                warnings.append(f"Status map {artifact!r}: skipped non-repo link `{m.group(1)}`")
                continue

            if not target.is_file():
                errors.append(
                    f"Status map {artifact!r}: missing file `{m.group(1)}` -> "
                    + f"{target.relative_to(root).as_posix()}",
                )

        if not found_link:
            errors.append(f"Status map {artifact!r}: Source File column has no markdown link.")

    return errors, warnings


def validate_procurement_pack_index(
    root: Path,
    index_md: Path,
    today: datetime.date,
    text: str | None = None,
) -> tuple[list[str], list[str]]:
    """Return (errors, warnings). `today` is typically UTC date (freshness budgets)."""
    errors: list[str] = []
    warnings: list[str] = []
    rel_label = index_md.relative_to(root).as_posix()

    if text is None:
        text = index_md.read_text(encoding="utf-8")

    errors.extend(pp_val.buyer_index_placeholder_violations(text, rel_label))
    errors.extend(pp_val.assurance_phrase_violations_for_text(text, rel_label))

    rows, _ = parse_table_paths(text)

    if len(rows) < 2:
        errors.append("expected header + ≥1 procurement index row in canonical table.")
        return errors, warnings

    header = rows[0]

    expected = [
        "Evidence Artifact",
        "Evidence Type",
        "Last Reviewed UTC",
        "Source File",
        "Buyer-safe Claim",
    ]
    if header[: len(expected)] != expected:
        errors.append(
            "table header mismatch — canonical columns: "
            + f"expected {expected!r}, observed {header[: len(expected)]!r}",
        )
        return errors, warnings

    for parts in rows[1:]:
        if len(parts) < 5:
            errors.append(f"Short row (<5 columns): {parts!r}")
            continue

        artifact, ev_type_cell, reviewed_cell = parts[0], parts[1], parts[2]
        source_blob = parts[3]
        evidence_type = ev_type_cell.strip()

        if evidence_type not in APPROVED_TYPES:
            errors.append(f"{artifact!r}: invalid Evidence Type {evidence_type!r} ({APPROVED_TYPES})")

        d = parse_iso_date(reviewed_cell)

        if d is None:
            errors.append(f"{artifact!r}: Last Reviewed UTC not YYYY-MM-DD: {reviewed_cell!r}")

        elif evidence_type in CANONICAL_TYPES_REQUIRING_FRESHNESS:
            age = today - d

            if age > INDEX_CANONICAL_REVIEW_MAX_AGE:
                errors.append(
                    f"{artifact!r}: {evidence_type} row stale ({d.isoformat()} UTC > "
                    f"{INDEX_CANONICAL_REVIEW_MAX_AGE.days} days).",
                )

        found_link = False

        for m in LINK_RE.finditer(source_blob):
            found_link = True
            target = normalize_source_link(m.group(1), index_md, root)

            if target is None:
                warnings.append(f"{artifact!r}: skipped non-repo link `{m.group(1)}`")
                continue

            if not target.is_file():
                errors.append(f"{artifact!r}: missing file `{m.group(1)}` -> {target.relative_to(root).as_posix()}")

        if not found_link:
            errors.append(f"{artifact!r}: Source File column has no markdown link.")

    sm_rows, sm_heading_errors = parse_status_map_rows(text)
    errors.extend(sm_heading_errors)
    sm_errs, sm_warns = validate_status_map(sm_rows, index_md, root)
    errors.extend(sm_errs)
    warnings.extend(sm_warns)

    return errors, warnings


def main() -> int:
    root = repo_root()
    index_md = root / "docs" / "go-to-market" / "PROCUREMENT_PACK_INDEX.md"

    if not index_md.is_file():
        print(f"ERROR: missing {index_md.relative_to(root)}", file=sys.stderr)
        return 1

    today = datetime.now(timezone.utc).date()
    text = index_md.read_text(encoding="utf-8")
    errors, warnings = validate_procurement_pack_index(root, index_md, today, text)

    if errors:
        print("Procurement pack index check FAILED:", file=sys.stderr)

        for e in errors:
            print(f"  {e}", file=sys.stderr)

    if warnings:
        print("Warnings (non-failing):", file=sys.stderr)

        for w in warnings:
            print(f"  {w}", file=sys.stderr)

    if errors:
        return 1

    rows, _ = parse_table_paths(text)
    sm_rows, sm_heading_errors = parse_status_map_rows(text)

    if sm_heading_errors:
        # Defensive: success path should not happen if validate returned no errors.
        for e in sm_heading_errors:
            print(f"ERROR: {e}", file=sys.stderr)
        return 1

    print(
        "Procurement pack index OK:",
        index_md.relative_to(root).as_posix(),
        f"({len(rows) - 1} canonical rows, {len(sm_rows)} status-map rows)",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
