#!/usr/bin/env python3
"""Fail when pilot UI env examples opt into full operator shell (buyer polish regression)."""

from __future__ import annotations

import re
import sys
from pathlib import Path


OPERATOR_EXPERIENCE_PATTERN = re.compile(
    r"^\s*NEXT_PUBLIC_OPERATOR_EXPERIENCE\s*=\s*operator\s*$",
    re.IGNORECASE | re.MULTILINE,
)

SCAN_PATHS = (
    "archlucid-ui/.env.pilot.example",
    "archlucid-ui/.env.example",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    root = repo_root()
    failed = False

    for relative in SCAN_PATHS:
        path = root / relative
        if not path.is_file():
            print(f"PILOT_UI_ENV missing required file: {relative}", file=sys.stderr)
            failed = True
            continue

        text = path.read_text(encoding="utf-8")
        if OPERATOR_EXPERIENCE_PATTERN.search(text):
            print(
                f"PILOT_UI_ENV {relative} must not set NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator "
                "(pilot tenants use buyer-default shell)",
                file=sys.stderr,
            )
            failed = True

    if failed:
        return 1

    print("PILOT_UI_ENV posture OK (buyer-default operator experience)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
