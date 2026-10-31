#!/usr/bin/env python3
"""Validate SecureNow decision-velocity materials remain human-led and buyer-safe."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

RECORD = Path("docs/securenow/PILOT_DECISION_RECORD.md")
ONE_PAGER = Path("docs/securenow/DECISION_PATH_ONE_PAGER.md")
WHY_COPY = Path("archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts")
WHY_PAGE = Path("archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx")
SPONSOR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts")
OPERATOR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-pilot-decision-copy.ts")
OPERATOR_PAGE = Path(
    "archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx"
)
PACK_INDEX = Path("docs/securenow/PROCUREMENT_PACK_INDEX.md")

FORBIDDEN = (
    "guaranteed savings",
    "guaranteed roi",
    "soc 2 certified",
    "automatically fix azure",
)


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    record = _read(root, RECORD, errors)
    one_pager = _read(root, ONE_PAGER, errors)
    why_copy = _read(root, WHY_COPY, errors)
    why_page = _read(root, WHY_PAGE, errors)
    sponsor_copy = _read(root, SPONSOR_COPY, errors)
    operator_copy = _read(root, OPERATOR_COPY, errors)
    operator_page = _read(root, OPERATOR_PAGE, errors)
    pack_index = _read(root, PACK_INDEX, errors)

    if record:
        for token in ("Proceed to commercial discussion", "Extend with bounded scope", "Stop", "NOT COLLECTED", "NO_GO"):
            if token not in record:
                errors.append(f"{RECORD}: missing {token!r}")
    if one_pager:
        for token in (
            "Qualify",
            "Scope",
            "Review",
            "Verify",
            "Close",
            "PILOT_DECISION_RECORD.md",
            "NOT VERIFIED",
            "Proceed to commercial discussion",
            "Extend with bounded scope",
            "Stop",
        ):
            if token not in one_pager:
                errors.append(f"{ONE_PAGER}: missing {token!r}")
    if why_copy:
        for token in ("WHY_SECURENOW_PILOT_DECISION_HEADING", "proceed to commercial discussion", "extend with bounded scope"):
            if token not in why_copy:
                errors.append(f"{WHY_COPY}: missing {token!r}")
    if why_page and "id=\"pilot-decision\"" not in why_page:
        errors.append(f"{WHY_PAGE}: missing pilot-decision anchor")
    if sponsor_copy and "/administration/securenow-pilot-decision" not in sponsor_copy:
        errors.append(f"{SPONSOR_COPY}: missing operator decision-prep link")
    if operator_copy:
        for token in ("NO_GO", "Proceed to commercial discussion", "Extend with bounded scope", "Stop"):
            if token not in operator_copy:
                errors.append(f"{OPERATOR_COPY}: missing {token!r}")
    if operator_page and "securenow-pilot-decision-page" not in operator_page:
        errors.append(f"{OPERATOR_PAGE}: missing page test id")
    if pack_index and "PILOT_DECISION_RECORD.md" not in pack_index:
        errors.append(f"{PACK_INDEX}: missing decision record index entry")

    for relative, text in (
        (RECORD, record),
        (ONE_PAGER, one_pager),
        (WHY_COPY, why_copy),
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
    print("SecureNow decision velocity: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
