#!/usr/bin/env python3
"""Validate SecureNow self-service guidance stays bounded and discoverable."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SELF_SERVICE = Path("docs/securenow/SELF_SERVICE.md")
HOME_COPY = Path("archlucid-ui/src/lib/product-line/securenow-self-service-home-copy.ts")
PAGE = Path(
    "archlucid-ui/src/app/(operator)/administration/securenow-self-service/"
    "SecureNowSelfServicePageView.tsx"
)
COPY = Path("archlucid-ui/src/lib/product-line/securenow-self-service-copy.ts")
CATALOG = Path("archlucid-ui/src/lib/product-line/product-line-catalog.ts")

REQUIRED_NOTE = (
    "**Scope:**",
    "NO_GO",
    "Collection missing or stale",
    "Connector will not finish",
    "No ranked path, or not verified",
    "Still stuck",
    "/integrations/cloud-connections",
    "/administration/connection-status",
    "/security/remediation-factory",
    "/security/remediation-instances",
    "mailto:support@archlucid.net?subject=SecureNow",
)
REQUIRED_COPY = (
    "Collection missing or stale",
    "Connector will not finish",
    "No ranked path, or not verified",
    "Still stuck",
    "mailto:support@archlucid.net?subject=SecureNow",
)
REQUIRED_ANCHORS = ("collection", "connector", "ranking", "email")
REQUIRED_HOME_ANCHORS = ("#collection", "#connector", "#ranking", "#email")


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []

    note = _read(root, SELF_SERVICE, errors)
    for token in REQUIRED_NOTE:
        if token not in note:
            errors.append(f"{SELF_SERVICE}: missing {token!r}")
    for phrase in ("$", "Start trial"):
        if phrase.lower() in note.lower():
            errors.append(f"{SELF_SERVICE}: contains forbidden phrase {phrase!r}")

    home_copy = _read(root, HOME_COPY, errors)
    for token in ("When you are stuck", "NO_GO", "/administration/securenow-self-service"):
        if token not in home_copy:
            errors.append(f"{HOME_COPY}: missing {token!r}")
    if "recommendedFirst: true" in home_copy:
        errors.append(f"{HOME_COPY}: must not set recommendedFirst")

    copy = _read(root, COPY, errors)
    for token in REQUIRED_COPY:
        if token not in copy:
            errors.append(f"{COPY}: missing {token!r}")
    for token in REQUIRED_ANCHORS:
        if f'id: "{token}"' not in copy:
            errors.append(f"{COPY}: missing anchor id {token!r}")
    for token in REQUIRED_HOME_ANCHORS:
        if token not in home_copy:
            errors.append(f"{HOME_COPY}: missing Home anchor {token!r}")

    page = _read(root, PAGE, errors)
    if "securenow-self-service-page" not in page:
        errors.append(f"{PAGE}: missing page test id")
    if "Open remediation tracker" not in page:
        errors.append(f"{PAGE}: missing remediation tracker link")

    catalog = _read(root, CATALOG, errors)
    if '"/administration/securenow-self-service": "security"' not in catalog:
        errors.append(f"{CATALOG}: missing SecureNow self-service assignment")
    if '"/administration/support": "architecture"' not in catalog:
        errors.append(f"{CATALOG}: support route must remain architecture-only")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow self-service: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
