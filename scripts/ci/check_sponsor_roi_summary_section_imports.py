#!/usr/bin/env python3
"""Fail when SponsorRoiSummarySection.tsx uses symbols without importing them (trunk typecheck guard)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_REL_PATH = (
    "archlucid-ui/src/app/(operator)/architecture/sponsor-dashboard/_sections/"
    "SponsorRoiSummarySection.tsx"
)

# Symbols referenced in the component that must have a matching import line.
_REQUIRED_IMPORT_MARKERS: tuple[str, ...] = (
    "Card",
    "CardContent",
    "CardDescription",
    "CardHeader",
    "CardTitle",
    "ApiV1Routes",
    "toApiLoadFailure",
    "BUYER_SPONSOR_DATA_SOURCE_NOTE",
    "BUYER_SPONSOR_SUMMARY_VOCABULARY",
)

_USAGE_PATTERNS: dict[str, re.Pattern[str]] = {
    "Card": re.compile(r"\bCard\b"),
    "CardContent": re.compile(r"\bCardContent\b"),
    "CardDescription": re.compile(r"\bCardDescription\b"),
    "CardHeader": re.compile(r"\bCardHeader\b"),
    "CardTitle": re.compile(r"\bCardTitle\b"),
    "ApiV1Routes": re.compile(r"\bApiV1Routes\b"),
    "toApiLoadFailure": re.compile(r"\btoApiLoadFailure\b"),
    "BUYER_SPONSOR_DATA_SOURCE_NOTE": re.compile(r"\bBUYER_SPONSOR_DATA_SOURCE_NOTE\b"),
    "BUYER_SPONSOR_SUMMARY_VOCABULARY": re.compile(r"\bBUYER_SPONSOR_SUMMARY_VOCABULARY\b"),
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _import_section(text: str) -> str:
    lines: list[str] = []
    collecting = False

    for line in text.splitlines():
        stripped = line.strip()

        if stripped.startswith("import"):
            collecting = True
            lines.append(line)

            if stripped.endswith(";"):
                collecting = False

            continue

        if collecting:
            lines.append(line)

            if stripped.endswith(";"):
                collecting = False

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    path = repo_root() / _REL_PATH

    if not path.is_file():
        print(f"check_sponsor_roi_summary_section_imports: missing {_REL_PATH}", file=sys.stderr)
        return 1

    text = path.read_text(encoding="utf-8", errors="replace")
    imports = _import_section(text)
    errors: list[str] = []

    for marker in _REQUIRED_IMPORT_MARKERS:
        usage = _USAGE_PATTERNS[marker]

        if not usage.search(text):
            continue

        if marker not in imports:
            errors.append(f"{_REL_PATH}: uses {marker} but import section lacks '{marker}'")

    if errors:
        for error in errors:
            print(f"check_sponsor_roi_summary_section_imports: {error}", file=sys.stderr)

        return 1

    print("check_sponsor_roi_summary_section_imports: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
