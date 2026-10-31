#!/usr/bin/env python3
"""Validate SecureNow commercial packaging stays buyer-safe and non-transactable."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ORDER_FORM = Path("docs/securenow/ORDER_FORM_TEMPLATE.md")
CHECKLIST = Path("docs/securenow/QUOTE_TO_PILOT_CHECKLIST.md")
METER_CARD = Path("docs/securenow/SKU_METER_CARD.md")

SKU_IDS = ("SN-EVAL", "SN-ANNUAL", "SN-SUB-ADD", "SN-SNAP-4")
FORBIDDEN_PHRASES = ("guaranteed savings", "guaranteed ROI", "READY_TO_PUBLISH")


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def _check_common(relative: Path, text: str, errors: list[str]) -> None:
    if not text.startswith("> **Scope:**"):
        errors.append(f"{relative}: missing leading Scope blockquote")
    if "NO_GO" not in text:
        errors.append(f"{relative}: missing NO_GO")
    if "$" in text:
        errors.append(f"{relative}: contains '$'; fee amounts must stay private")
    lowered = text.lower()
    for phrase in FORBIDDEN_PHRASES:
        if phrase.lower() in lowered:
            errors.append(f"{relative}: contains forbidden phrase {phrase!r}")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []

    order = _read(root, ORDER_FORM, errors)
    if order:
        _check_common(ORDER_FORM, order, errors)
        for sku in SKU_IDS:
            if sku not in order:
                errors.append(f"{ORDER_FORM}: missing {sku}")
        for token in (
            "PRIVATE_PRICE_SHEET.md",
            "NOT AN APPROVED CUSTOMER OFFER",
            "CONTROLLED_PILOT_OFFER.md",
            "SUPPORT_COMMITMENT.md",
        ):
            if token not in order:
                errors.append(f"{ORDER_FORM}: missing {token!r}")

    checklist = _read(root, CHECKLIST, errors)
    if checklist:
        _check_common(CHECKLIST, checklist, errors)
        for token in (
            "PRIVATE_PRICE_SHEET.md",
            "QUOTE_COVER.md",
            "ORDER_FORM_TEMPLATE.md",
            "DATA_PROCESSING_SCHEDULE.md",
            "PILOT_MEASUREMENT_LOG.md",
            "ROI_COST_INPUT.md",
            "cannot authorize commerce",
        ):
            if token not in checklist:
                errors.append(f"{CHECKLIST}: missing {token!r}")

    meter = _read(root, METER_CARD, errors)
    if meter:
        _check_common(METER_CARD, meter, errors)
        for sku in SKU_IDS:
            if sku not in meter:
                errors.append(f"{METER_CARD}: missing {sku}")
        for token in ("2 Azure subscriptions", "4 successful snapshots", "5 named operators"):
            if token not in meter:
                errors.append(f"{METER_CARD}: missing meter {token!r}")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow commercial packaging: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
