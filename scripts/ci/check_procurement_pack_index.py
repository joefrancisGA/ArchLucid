#!/usr/bin/env python3
"""
Validate docs/go-to-market/PROCUREMENT_PACK_INDEX.md canonical buyer evidence table.

Checks:
  - Required columns appear in order.
  - Evidence Type ∈ approved token set (matches procurement accelerator wording).
  - Source File markdown links resolve to existing repo paths.
  - "Implemented" rows: Last reviewed UTC ≤ 90 days from today.

Run from repo root: python scripts/ci/check_procurement_pack_index.py
"""

from __future__ import annotations

import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
APPROVED_TYPES = frozenset(
    {
        "Implemented",
        "Self-asserted",
        "In flight",
        "Deferred V1.1",
    }
)
IMPLEMENTED_MAX_AGE = timedelta(days=90)


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


def main() -> int:
    root = repo_root()
    index_md = root / "docs" / "go-to-market" / "PROCUREMENT_PACK_INDEX.md"

    if not index_md.is_file():
        print(f"ERROR: missing {index_md.relative_to(root)}", file=sys.stderr)
        return 1

    today = datetime.now(timezone.utc).date()
    text = index_md.read_text(encoding="utf-8")
    rows, _ = parse_table_paths(text)

    if len(rows) < 2:
        print("ERROR: expected header + ≥1 procurement index row.", file=sys.stderr)
        return 1

    header = rows[0]

    expected = [
        "Evidence Artifact",
        "Evidence Type",
        "Last Reviewed UTC",
        "Source File",
        "Buyer-safe Claim",
    ]
    if header[: len(expected)] != expected:
        print("ERROR: table header mismatch — canonical columns:", file=sys.stderr)
        print(f"  expected: {expected}", file=sys.stderr)
        print(f"  observed: {header[: len(expected)]}", file=sys.stderr)
        return 1

    errors: list[str] = []
    warnings: list[str] = []

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
        elif evidence_type == "Implemented":
            age = today - d

            if age > IMPLEMENTED_MAX_AGE:
                errors.append(
                    f"{artifact!r}: Implemented row stale ({d.isoformat()} UTC > {IMPLEMENTED_MAX_AGE.days} days).",
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

    print("Procurement pack index OK:", index_md.relative_to(root).as_posix(), f"({len(rows) - 1} rows)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
