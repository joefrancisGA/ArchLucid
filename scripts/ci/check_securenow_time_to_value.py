#!/usr/bin/env python3
"""Validate the bounded SecureNow first-useful-answer contract."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NOTE = Path("docs/securenow/FIRST_USEFUL_ANSWER.md")
FIRST_HOUR_PAGE = Path(
    "archlucid-ui/src/app/(operator)/administration/securenow-first-hour/"
    "SecureNowFirstHourPageView.tsx"
)
FIRST_HOUR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts")
HOME_COPY = Path("archlucid-ui/src/lib/product-line/securenow-first-useful-answer-home-copy.ts")


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    note = _read(root, NOTE, errors)
    page = _read(root, FIRST_HOUR_PAGE, errors)
    copy = _read(root, FIRST_HOUR_COPY, errors)
    home = _read(root, HOME_COPY, errors)

    for token in ("NO_GO", "Path inspect", "/infrastructure/diagrams", "/security/remediation-factory", "missing or stale capture"):
        if token not in note:
            errors.append(f"{NOTE}: missing {token!r}")
    if "not a timed sla" not in note.lower():
        errors.append(f"{NOTE}: missing bounded SLA language")
    for phrase in ("minutes to value", "$", "Start trial"):
        if phrase.lower() in note.lower():
            errors.append(f"{NOTE}: contains forbidden phrase {phrase!r}")

    if 'id="first-useful-answer"' not in page:
        errors.append(f"{FIRST_HOUR_PAGE}: missing first-useful-answer anchor")
    if "/infrastructure/diagrams" not in copy:
        errors.append(f"{FIRST_HOUR_COPY}: missing diagrams step href")
    if "/administration/securenow-first-hour#first-useful-answer" not in home:
        errors.append(f"{HOME_COPY}: missing Home anchor")
    if "recommendedFirst: true" in home:
        errors.append(f"{HOME_COPY}: must not recommend the row first")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow time-to-value: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
