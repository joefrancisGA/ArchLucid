#!/usr/bin/env python3
"""
Verify docs/trust-center.md posture summary table:
  - Parses "Last reviewed" column as YYYY-MM-DD.
  - Computes staleness hints by Status class (warnings only unless --fail-on-stale).

Exit codes:
  - 0: OK (warnings printed to stderr when --warn-stale Default).
  - 2: malformed dates or posture table missing (fail-fast).
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


POSTURE_MARKER = "## Posture summary"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def parse_iso_date(cell: str) -> datetime.date | None:
    s = cell.strip()
    m = re.search(r"(\d{4}-\d{2}-\d{2})", s)

    if not m:
        return None

    try:
        return datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc).date()
    except ValueError:
        return None


def staleness_budget_days(status_cell: str) -> int | None:
    """None = exempt from staleness budget."""
    low = status_cell.lower()

    if "v2-planned" in low or "template only" in low or "planned" in low and "vendor" in low:

        return None

    if "in progress" in low or "/ tracked" in low:
        return 120

    if "self-asserted" in low:
        return 270


    # Default tightening for substantive operational narratives
    return 270


def extract_posture_rows(text: str) -> tuple[list[list[str]], str | None]:
    start = text.find(POSTURE_MARKER)

    if start < 0:
        return [], 'missing "## Posture summary" heading'

    sub = text[start:]
    end = sub.find("\n---\n")

    if end > 0:
        sub = sub[:end]

    lines = [ln.rstrip("\n") for ln in sub.splitlines()]
    rows_out: list[list[str]] = []
    scanning = False

    for ln in lines:
        if ln.strip().startswith("| Control |"):
            scanning = True
            continue


        if not scanning:

            continue

        raw = ln.strip()

        if not raw.startswith("|"):
            break

        if re.match(r"^\|\s*---+\s*\|", raw):
            continue

        parts = [p.strip() for p in raw.strip("|").split("|")]

        if len(parts) < 4:

            continue

        rows_out.append(parts)

    if not rows_out:
        return [], "Posture summary table parsed zero data rows."

    return rows_out, None


def main(argv: list[str]) -> int:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--fail-on-stale",
        action="store_true",
        help="Treat stale posture rows as errors (otherwise stderr warnings only).",
    )
    args = p.parse_args(argv)

    root = repo_root()
    trust_md = root / "docs" / "trust-center.md"

    if not trust_md.is_file():

        print(f"ERROR: missing {trust_md.relative_to(root)}", file=sys.stderr)
        return 2

    text = trust_md.read_text(encoding="utf-8")
    rows, err = extract_posture_rows(text)


    if err is not None:


        print(f"ERROR posture table: {err}", file=sys.stderr)
        return 2

    today = datetime.now(timezone.utc).date()
    errors: list[str] = []
    stale_notes: list[str] = []

    for parts in rows:
        control_preview = parts[0][:72] + ("…" if len(parts[0]) > 72 else "")
        status = parts[1]
        reviewed_cell = parts[3] if len(parts) > 3 else ""
        dt = parse_iso_date(reviewed_cell)

        if dt is None:
            errors.append(f"{control_preview!r}: Last reviewed '{reviewed_cell}' not YYYY-MM-DD")

            continue

        budget = staleness_budget_days(status)


        if budget is None:


            continue

        if (today - dt).days > budget:
            stale_notes.append(
                f"{control_preview!r}: last reviewed {dt.isoformat()} (> {budget} days for this status bucket).",
            )

    print(
        trust_md.relative_to(root).as_posix(),
        "| posture rows:",
        len(rows),
        "| today UTC:",
        today.isoformat(),
    )

    for n in stale_notes:
        msg = "STALE_ROW " + n

        if args.fail_on_stale:


            errors.append(msg)
        else:
            print(msg, file=sys.stderr)

    if errors:

        print("trust-center posture check FAILED:", file=sys.stderr)


        for e in errors:


            print("  ", e, file=sys.stderr)

        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
