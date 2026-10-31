#!/usr/bin/env python3
"""Validate SecureNow first-hour materials remain honest and buyer-safe."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

FIRST_HOUR = Path("docs/securenow/FIRST_HOUR.md")
HOME_COPY = Path("archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts")
OPERATOR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts")
OPERATOR_PAGE = Path(
    "archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx"
)

FORBIDDEN = (
    "minutes to value",
    "autonomous remediation",
    "breach prevention",
    "automatically fix azure",
    "guaranteed savings",
)


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    first_hour = _read(root, FIRST_HOUR, errors)
    home_copy = _read(root, HOME_COPY, errors)
    operator_copy = _read(root, OPERATOR_COPY, errors)
    operator_page = _read(root, OPERATOR_PAGE, errors)

    if first_hour:
        for token in (
            "NO_GO",
            "Scope and freshness",
            "One ranked path",
            "Advisory cut point",
            "NOT VERIFIED",
            "/security/remediation-factory",
            "/administration/securenow-first-hour",
        ):
            if token not in first_hour:
                errors.append(f"{FIRST_HOUR}: missing {token!r}")
        if "$" in first_hour:
            errors.append(f"{FIRST_HOUR}: contains '$'")

    if home_copy:
        for token in (
            "Start here",
            "NO_GO",
            "/administration/securenow-first-hour",
            "First hour path",
        ):
            if token not in home_copy:
                errors.append(f"{HOME_COPY}: missing {token!r}")

    if operator_copy:
        for token in ("NO_GO", "NOT VERIFIED", "does not change Azure", "Advisory cut point"):
            if token not in operator_copy:
                errors.append(f"{OPERATOR_COPY}: missing {token!r}")

    if operator_page and "securenow-first-hour-page" not in operator_page:
        errors.append(f"{OPERATOR_PAGE}: missing page test id")

    catalog = _read(root, Path("archlucid-ui/src/lib/product-line/product-line-catalog.ts"), errors)
    if catalog and '"/administration/securenow-first-hour": "security"' not in catalog:
        errors.append("product-line-catalog.ts: missing securenow-first-hour security assignment")

    for relative, text in (
        (FIRST_HOUR, first_hour),
        (HOME_COPY, home_copy),
        (OPERATOR_COPY, operator_copy),
        (OPERATOR_PAGE, operator_page),
    ):
        lowered = text.lower()
        for phrase in FORBIDDEN:
            if phrase in lowered:
                errors.append(f"{relative}: contains forbidden phrase {phrase!r}")
        if "$" in text:
            errors.append(f"{relative}: contains '$'")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow adoption friction: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
