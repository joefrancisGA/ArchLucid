"""Fail if the most recent *past* game-day calendar date has no closing-report file.

Parses ``docs/quality/game-day-log/README.md`` table rows that start with a
``YYYY-MM-DD`` cell and contain a Markdown link to ``*.md`` in the same row.
Used to surface missed quarters; see calendar in that README.

Exit code ``0`` when there is no past calendar date yet (all dates in the future).
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path


@dataclass(frozen=True)
class CalendarRow:
    """One parsed calendar table row."""

    on_date: date
    report_rel: str


def repo_root_from_script() -> Path:
    """``scripts/ci/assert_game_day_log_recent.py`` → repository root."""

    return Path(__file__).resolve().parents[2]


def parse_calendar_rows(readme_text: str) -> list[CalendarRow]:
    """Extract (date, relative .md path) from pipe-table body lines."""

    rows: list[CalendarRow] = []
    row_start = re.compile(r"^\|\s*\*{0,2}(\d{4}-\d{2}-\d{2})\*{0,2}\s*\|")

    for line in readme_text.splitlines():
        m = row_start.match(line)
        if not m:
            continue

        on_date = datetime.strptime(m.group(1), "%Y-%m-%d").date()
        links = re.findall(r"\]\(([^)]+\.md)\)", line)
        if not links:
            continue

        rows.append(CalendarRow(on_date=on_date, report_rel=links[-1]))

    return rows


def most_recent_past_date(rows: list[CalendarRow], today: date) -> CalendarRow | None:
    """Return the calendar row with the greatest date strictly before ``today``."""

    past = [r for r in rows if r.on_date < today]
    if not past:
        return None

    return max(past, key=lambda r: r.on_date)


def assert_closing_report_exists(rows: list[CalendarRow], today: date, game_log_dir: Path) -> None:
    """Raise ``SystemExit`` with message if the required closing report is missing."""

    target = most_recent_past_date(rows, today)
    if target is None:
        return

    report_path = (game_log_dir / target.report_rel).resolve()
    if report_path.is_file():
        return

    root = game_log_dir.parent.parent.parent
    rel = report_path.relative_to(root)
    print(
        f"ERROR: Most recent past game-day date {target.on_date.isoformat()} "
        f"has no closing report at {rel} (linked from README as {target.report_rel}).",
        file=sys.stderr,
    )
    raise SystemExit(1)


def main() -> None:
    root = repo_root_from_script()
    readme = root / "docs" / "quality" / "game-day-log" / "README.md"
    game_log_dir = readme.parent

    if not readme.is_file():
        print(f"ERROR: Missing {readme}", file=sys.stderr)
        raise SystemExit(2)

    rows = parse_calendar_rows(readme.read_text(encoding="utf-8"))
    if not rows:
        print("ERROR: No calendar rows parsed from README.md table.", file=sys.stderr)
        raise SystemExit(2)

    today = datetime.now(timezone.utc).date()
    assert_closing_report_exists(rows, today, game_log_dir)


if __name__ == "__main__":
    main()
