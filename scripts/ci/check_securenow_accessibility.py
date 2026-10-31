#!/usr/bin/env python3
"""Validate SecureNow accessibility scope and operator entry point."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SCOPE = Path("docs/securenow/ACCESSIBILITY_SCOPE.md")
COPY = Path("archlucid-ui/src/lib/product-line/securenow-accessibility-copy.ts")
REVIEWER_HOME = Path("archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts")
ROUTE_POLICY = Path("archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts")
AXE_TEST = Path("archlucid-ui/src/accessibility/securenow-accessibility-axe.test.tsx")

FORBIDDEN = ("WCAG certified", "fully accessible", "VPAT complete")


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []

    scope = _read(root, SCOPE, errors)
    if scope:
        for token in ("**Scope:**", "WCAG 2.2", "accessibility@archlucid.net"):
            if token not in scope:
                errors.append(f"{SCOPE}: missing {token!r}")
        if "$" in scope:
            errors.append(f"{SCOPE}: contains '$'")
        for phrase in FORBIDDEN:
            if phrase.lower() in scope.lower():
                errors.append(f"{SCOPE}: contains forbidden phrase {phrase!r}")

    copy = _read(root, COPY, errors)
    if copy:
        for token in ("WCAG 2.2", "Report an accessibility barrier", "assistive-technology user testing"):
            if token not in copy:
                errors.append(f"{COPY}: missing {token!r}")
        for phrase in FORBIDDEN:
            if phrase.lower() in copy.lower():
                errors.append(f"{COPY}: contains forbidden phrase {phrase!r}")

    reviewer_home = _read(root, REVIEWER_HOME, errors)
    if reviewer_home:
        for token in ("/administration/securenow-accessibility", "Accessibility"):
            if token not in reviewer_home:
                errors.append(f"{REVIEWER_HOME}: missing {token!r}")

    route_policy = _read(root, ROUTE_POLICY, errors)
    if route_policy and '"/accessibility"' not in route_policy:
        errors.append(f"{ROUTE_POLICY}: missing blocked /accessibility prefix")

    axe_test = _read(root, AXE_TEST, errors)
    if axe_test and "toHaveNoViolations" not in axe_test:
        errors.append(f"{AXE_TEST}: missing toHaveNoViolations")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow accessibility: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
