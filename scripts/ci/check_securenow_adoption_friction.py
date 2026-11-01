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
ENVIRONMENT_CONTEXT = Path("archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx")

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
    environment_context = _read(root, ENVIRONMENT_CONTEXT, errors)

    if first_hour:
        for token in (
            "NO_GO",
            "Scope and freshness",
            "One ranked path",
            "Advisory cut point",
            "NOT VERIFIED",
            "/security/remediation-factory",
            "/administration/securenow-first-hour",
            "Path inspect",
            "Select a priority row",
        ):
            if token not in first_hour:
                errors.append(f"{FIRST_HOUR}: missing {token!r}")
        if "$" in first_hour:
            errors.append(f"{FIRST_HOUR}: contains '$'")

    if home_copy:
        for token in (
            "Start here",
            "NO_GO",
            "A missing or stale capture is the current step",
            "A blank ranking is not a clean result",
            "Scope and freshness",
            "One ranked path",
            "Path inspect",
            "Stop",
            "First hour page",
            "/integrations/cloud-connections",
            "/security/remediation-factory",
            "/administration/securenow-first-hour#path-inspect",
            "/administration/securenow-first-hour#stop",
            "/administration/securenow-first-hour",
        ):
            if token not in home_copy:
                errors.append(f"{HOME_COPY}: missing {token!r}")

    if operator_copy:
        for token in ("NO_GO", "NOT VERIFIED", "does not change Azure", "Advisory cut point"):
            if token not in operator_copy:
                errors.append(f"{OPERATOR_COPY}: missing {token!r}")
        step_three = operator_copy.split('title: "3 — Advisory cut point"', 1)
        if len(step_three) == 2:
            step_three_body = step_three[1].split('title: "4 — Stop"', 1)[0]
            if "Path inspect" not in step_three_body or "Select a priority row" not in step_three_body:
                errors.append(f"{OPERATOR_COPY}: step 3 missing Path inspect selection wording")
            if "SECURENOW_REMEDIATION_FACTORY_PATH" in step_three_body or '"/security/remediation-factory"' in step_three_body:
                errors.append(f"{OPERATOR_COPY}: step 3 reuses the remediation factory href")
        else:
            errors.append(f"{OPERATOR_COPY}: missing step 3")

    if operator_page and "securenow-first-hour-page" not in operator_page:
        errors.append(f"{OPERATOR_PAGE}: missing page test id")
    for token in ('"path-inspect"', '"stop"'):
        if operator_page and token not in operator_page:
            errors.append(f"{OPERATOR_PAGE}: missing id {token}")

    if environment_context:
        for token in ("No collection yet", "/integrations/cloud-connections"):
            if token not in environment_context:
                errors.append(f"{ENVIRONMENT_CONTEXT}: missing {token!r}")

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
