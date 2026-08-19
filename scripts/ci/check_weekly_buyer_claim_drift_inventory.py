#!/usr/bin/env python3
"""TB-1463 / M-263: Weekly buyer-claim drift inventory structure guard.

Ensures the fused SEND vs REWRITE inventory remains complete for PA triage:
Critical C1–C6, High H1–H7, Medium M1–M4, orchestration pointers, and procurement cross-links.

Contract: docs/library/WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

INVENTORY_REL = Path("docs/library/WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/WEEKLY_BUYER_CLAIM_DRIFT_PA_ONE_PAGER.md")
PROCUREMENT_PACKET_REL = Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md")

REQUIRED_CRITICAL_IDS: tuple[str, ...] = tuple(f"C{i}" for i in range(1, 7))
REQUIRED_HIGH_IDS: tuple[str, ...] = tuple(f"H{i}" for i in range(1, 8))
REQUIRED_MEDIUM_IDS: tuple[str, ...] = tuple(f"M{i}" for i in range(1, 5))

INVENTORY_ANCHORS: tuple[str, ...] = (
    "SEND vs rewrite",
    "Critical — rewrite this week",
    "High — SEND or rewrite",
    "Medium — keep OK",
    "Orchestration",
    "TB-1464",
    "M-263",
    "M-264",
)

PROCUREMENT_ANCHORS: tuple[str, ...] = (
    "weekly-buyer-claim-drift-m-264",
    "WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md",
    "TB-1463",
)

OWNER_PATTERN = re.compile(r"\*\*TB-\d+\*\*|\*\*M-\d+\*\*|G-[A-Z]+-\d+")


def _missing_anchors(text: str, anchors: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    missing: list[str] = []

    for anchor in anchors:
        if anchor.lower() not in lowered:
            missing.append(anchor)

    return missing


def _missing_row_ids(text: str, row_ids: tuple[str, ...], *, label: str) -> list[str]:
    missing: list[str] = []

    for row_id in row_ids:
        if f"| **{row_id}** |" not in text:
            missing.append(f"{label} row {row_id}")

    return missing


def _critical_rows_without_owner(text: str) -> list[str]:
    errors: list[str] = []

    for row_id in REQUIRED_CRITICAL_IDS:
        match = re.search(rf"\| \*\*{row_id}\*\* \|[^\n]+\|", text)

        if match is None:
            continue

        if OWNER_PATTERN.search(match.group(0)) is None:
            errors.append(f"Critical row {row_id} missing living owner (TB-/M-/G- row)")

    return errors


def weekly_buyer_claim_drift_inventory_errors(root: Path) -> list[str]:
    errors: list[str] = []

    inventory_path = root / INVENTORY_REL

    if not inventory_path.is_file():
        return [f"missing inventory: {INVENTORY_REL}"]

    inventory_text = inventory_path.read_text(encoding="utf-8", errors="replace")

    errors.extend(_missing_row_ids(inventory_text, REQUIRED_CRITICAL_IDS, label="Critical"))
    errors.extend(_missing_row_ids(inventory_text, REQUIRED_HIGH_IDS, label="High"))
    errors.extend(_missing_row_ids(inventory_text, REQUIRED_MEDIUM_IDS, label="Medium"))

    for anchor in _missing_anchors(inventory_text, INVENTORY_ANCHORS):
        errors.append(f"{INVENTORY_REL}: missing anchor '{anchor}'")

    errors.extend(_critical_rows_without_owner(inventory_text))

    pa_path = root / PA_ONE_PAGER_REL

    if not pa_path.is_file():
        errors.append(f"missing PA one-pager alias: {PA_ONE_PAGER_REL}")
    else:
        pa_text = pa_path.read_text(encoding="utf-8", errors="replace")

        if "WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md" not in pa_text:
            errors.append(f"{PA_ONE_PAGER_REL}: missing inventory link")

    procurement_path = root / PROCUREMENT_PACKET_REL

    if not procurement_path.is_file():
        errors.append(f"missing procurement packet: {PROCUREMENT_PACKET_REL}")
    else:
        procurement_text = procurement_path.read_text(encoding="utf-8", errors="replace")

        for anchor in _missing_anchors(procurement_text, PROCUREMENT_ANCHORS):
            errors.append(f"{PROCUREMENT_PACKET_REL}: missing anchor '{anchor}'")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    errors = weekly_buyer_claim_drift_inventory_errors(REPO_ROOT)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_weekly_buyer_claim_drift_inventory: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
