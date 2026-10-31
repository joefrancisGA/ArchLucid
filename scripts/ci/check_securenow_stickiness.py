#!/usr/bin/env python3
"""Validate SecureNow return-reason materials remain non-notification and buyer-safe."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

RETURN_REASONS = Path("docs/securenow/RETURN_REASONS.md")
HOME_COPY = Path("archlucid-ui/src/lib/product-line/securenow-return-home-copy.ts")
REASONS_COPY = Path("archlucid-ui/src/lib/product-line/securenow-return-reasons-copy.ts")
REASONS_PAGE = Path(
    "archlucid-ui/src/app/(operator)/administration/securenow-return-reasons/SecureNowReturnReasonsPageView.tsx"
)

FORBIDDEN = ("engagement score", "guaranteed return")


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    return_reasons = _read(root, RETURN_REASONS, errors)
    home_copy = _read(root, HOME_COPY, errors)
    reasons_copy = _read(root, REASONS_COPY, errors)
    reasons_page = _read(root, REASONS_PAGE, errors)

    if return_reasons:
        for token in (
            "NO_GO",
            "does not send email",
            "Awaiting verification",
            "Recent changes",
            "Open questions",
            "Sponsor follow-up",
        ):
            if token not in return_reasons:
                errors.append(f"{RETURN_REASONS}: missing {token!r}")
        if "$" in return_reasons:
            errors.append(f"{RETURN_REASONS}: contains '$'")

    if home_copy:
        for token in (
            "Come back for",
            "NO_GO",
            "/security/remediation-instances",
            "/infrastructure/snapshots-drift",
            "/infrastructure/diagrams",
            "/administration/securenow-pilot-decision",
        ):
            if token not in home_copy:
                errors.append(f"{HOME_COPY}: missing {token!r}")

    if reasons_copy:
        for token in ("does not send a reminder", "NO_GO"):
            if token not in reasons_copy:
                errors.append(f"{REASONS_COPY}: missing {token!r}")

    if reasons_page and "securenow-return-reasons-page" not in reasons_page:
        errors.append(f"{REASONS_PAGE}: missing page test id")

    for relative, text in (
        (RETURN_REASONS, return_reasons),
        (HOME_COPY, home_copy),
        (REASONS_COPY, reasons_copy),
        (REASONS_PAGE, reasons_page),
    ):
        lowered = text.lower()
        for phrase in FORBIDDEN:
            if phrase in lowered:
                errors.append(f"{relative}: contains forbidden phrase {phrase!r}")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow stickiness: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
