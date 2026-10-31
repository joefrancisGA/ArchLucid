#!/usr/bin/env python3
"""Validate SecureNow proof-of-ROI notes stay blank, fixture-labeled, and non-calculating."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MEASUREMENT_LOG = Path("docs/securenow/PILOT_MEASUREMENT_LOG.md")
COST_INPUT = Path("docs/securenow/ROI_COST_INPUT.md")
FIXTURE_WORKSHEET = Path("docs/securenow/ROI_FIXTURE_WORKSHEET.md")
EXECUTIVE_TEMPLATE = Path("docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md")
FORBIDDEN_PHRASES = ("975%", "guaranteed ROI")


def _table_data_rows_after(text: str, marker: str) -> list[str]:
    start = text.find(marker)
    if start < 0:
        return []
    rows: list[str] = []
    in_table = False
    for line in text[start:].splitlines():
        stripped = line.strip()
        if stripped.startswith("## ") and in_table and rows:
            break
        if not stripped.startswith("|"):
            if in_table and rows:
                break
            continue
        if "---" in stripped.replace(" ", ""):
            in_table = True
            continue
        if in_table:
            header = stripped.lower()
            if header.startswith("| task |") or header.startswith("| part of c |"):
                continue
            rows.append(stripped)
    return rows


def _blank_data_rows(text: str) -> list[str]:
    rows = _table_data_rows_after(text, "| Task |")
    return [row for row in rows if "BLANK" in row]


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []

    measurement = root / MEASUREMENT_LOG
    if not measurement.is_file():
        errors.append(f"missing {MEASUREMENT_LOG}")
    else:
        text = measurement.read_text(encoding="utf-8")
        if "NOT MEASURED" not in text:
            errors.append("measurement log: missing 'NOT MEASURED'")
        blank_rows = _blank_data_rows(text)
        if len(blank_rows) < 3:
            errors.append(
                f"measurement log: expected at least 3 BLANK data rows, found {len(blank_rows)}"
            )
        for phrase in FORBIDDEN_PHRASES:
            if phrase in text:
                errors.append(f"measurement log: forbidden phrase {phrase!r}")

    cost = root / COST_INPUT
    if not cost.is_file():
        errors.append(f"missing {COST_INPUT}")
    else:
        text = cost.read_text(encoding="utf-8")
        if "PRIVATE_PRICE_SHEET.md" not in text:
            errors.append("cost input: missing link to PRIVATE_PRICE_SHEET.md")
        if "SN-ANNUAL" not in text:
            errors.append("cost input: missing SN-ANNUAL")
        if "$" in text:
            errors.append("cost input: contains '$'")
        for phrase in FORBIDDEN_PHRASES:
            if phrase in text:
                errors.append(f"cost input: forbidden phrase {phrase!r}")

    fixture = root / FIXTURE_WORKSHEET
    if not fixture.is_file():
        errors.append(f"missing {FIXTURE_WORKSHEET}")
    else:
        text = fixture.read_text(encoding="utf-8")
        if "FIXTURE" not in text:
            errors.append("fixture worksheet: missing FIXTURE label")
        if "-8000" not in text:
            errors.append("fixture worksheet: missing -8000")
        if "not a customer result" not in text.lower():
            errors.append("fixture worksheet: missing 'not a customer result'")
        if "$" in text:
            errors.append("fixture worksheet: contains '$'")
        for phrase in FORBIDDEN_PHRASES:
            if phrase in text:
                errors.append(f"fixture worksheet: forbidden phrase {phrase!r}")

    executive = root / EXECUTIVE_TEMPLATE
    if not executive.is_file():
        errors.append(f"missing {EXECUTIVE_TEMPLATE}")
    else:
        text = executive.read_text(encoding="utf-8")
        if "ROI not calculated" not in text:
            errors.append("executive template: missing 'ROI not calculated'")
        collected = len(re.findall(r"NOT COLLECTED", text))
        if collected < 5:
            errors.append(
                f"executive template: expected at least 5 NOT COLLECTED, found {collected}"
            )

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow ROI notes: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
