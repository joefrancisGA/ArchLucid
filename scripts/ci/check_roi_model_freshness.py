"""Warn-only CI guard: ROI_MODEL.md last-reviewed date should stay current.

Usage:
    python scripts/ci/check_roi_model_freshness.py [path]

Exit codes (always warn-only per TB-242):
    0 - success (fresh, stale warning, or missing date warning)
    2 - invocation error (file missing, unreadable)
"""

from __future__ import annotations

import argparse
import datetime as dt
import pathlib
import re
import sys

DEFAULT_PATH = pathlib.Path("docs/go-to-market/ROI_MODEL.md")
LAST_REVIEWED_PATTERN = re.compile(
    r"\*{0,2}Last reviewed:\*{0,2}\s*(\d{4}-\d{2}-\d{2})",
    re.IGNORECASE,
)
STALE_AFTER_DAYS = 90


def extract_last_reviewed(markdown_text: str) -> dt.date | None:
    match = LAST_REVIEWED_PATTERN.search(markdown_text)

    if match is None:
        return None

    return dt.date.fromisoformat(match.group(1))


def check_last_reviewed(last_reviewed: dt.date | None, today: dt.date) -> list[str]:
    messages: list[str] = []

    if last_reviewed is None:
        messages.append("WARN: ROI_MODEL.md is missing a 'Last reviewed: YYYY-MM-DD' line.")
        return messages

    age_days = (today - last_reviewed).days

    if age_days > STALE_AFTER_DAYS:
        messages.append(
            f"WARN: ROI_MODEL.md last reviewed {last_reviewed.isoformat()} "
            f"({age_days} days ago) — re-verify §8–9 numbers against PRICING_PHILOSOPHY.md §5 before sponsor use.",
        )

    return messages


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check ROI_MODEL.md last-reviewed freshness (warn-only).")
    parser.add_argument(
        "path",
        nargs="?",
        default=str(DEFAULT_PATH),
        help=f"Path to ROI model markdown (default: {DEFAULT_PATH})",
    )
    args = parser.parse_args(argv)

    target = pathlib.Path(args.path)

    if not target.is_file():
        print(f"ERROR: file not found: {target}", file=sys.stderr)
        return 2

    text = target.read_text(encoding="utf-8")
    messages = check_last_reviewed(extract_last_reviewed(text), dt.date.today())

    for message in messages:
        print(message)

    if not messages:
        print(f"OK: {target} last-reviewed date is within {STALE_AFTER_DAYS} days.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
