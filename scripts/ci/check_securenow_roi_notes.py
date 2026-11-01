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
SEND_RULE = Path("docs/securenow/ROI_SEND_RULE.md")
EXECUTIVE_TEMPLATE = Path("docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md")
SPONSOR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts")
OPERATOR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-investigation-effort-copy.ts")
OPERATOR_PAGE = Path(
    "archlucid-ui/src/app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx"
)
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
        for token in ("Hours for the formula", "Sample size", "Limitation", "Selection note"):
            if token not in text:
                errors.append(f"measurement log: missing {token!r}")
        blank_rows = _blank_data_rows(text)
        if len(blank_rows) < 3:
            errors.append(
                f"measurement log: expected at least 3 BLANK data rows, found {len(blank_rows)}"
            )
        for phrase in FORBIDDEN_PHRASES:
            if phrase in text:
                errors.append(f"measurement log: forbidden phrase {phrase!r}")
        if "$" in text:
            errors.append("measurement log: contains '$'")

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

    send_rule = root / SEND_RULE
    if not send_rule.is_file():
        errors.append(f"missing {SEND_RULE}")
    else:
        text = send_rule.read_text(encoding="utf-8")
        for token in ("NO_GO", "NOT COLLECTED", "FIXTURE", "ROI not calculated", "sponsor approved"):
            if token not in text:
                errors.append(f"send rule: missing {token!r}")
        if "$" in text:
            errors.append("send rule: contains '$'")
        for phrase in FORBIDDEN_PHRASES:
            if phrase in text:
                errors.append(f"send rule: forbidden phrase {phrase!r}")

    sponsor = root / SPONSOR_COPY
    if not sponsor.is_file():
        errors.append(f"missing {SPONSOR_COPY}")
    else:
        text = sponsor.read_text(encoding="utf-8")
        if "Investigation effort" not in text:
            errors.append("sponsor Home: missing 'Investigation effort'")
        if "/administration/securenow-investigation-effort" not in text:
            errors.append("sponsor Home: missing investigation-effort destination")

    operator = root / OPERATOR_PAGE
    operator_copy = root / OPERATOR_COPY
    if not operator.is_file():
        errors.append(f"missing {OPERATOR_PAGE}")
    if not operator_copy.is_file():
        errors.append(f"missing {OPERATOR_COPY}")
    if operator.is_file() and operator_copy.is_file():
        text = (operator.read_text(encoding="utf-8") + "\n" + operator_copy.read_text(encoding="utf-8"))
        for token in (
            "securenow-investigation-effort-page",
            "docs/securenow/PILOT_MEASUREMENT_LOG.md",
            "docs/securenow/ROI_COST_INPUT.md",
            "docs/securenow/ROI_FIXTURE_WORKSHEET.md",
            "docs/securenow/ROI_SEND_RULE.md",
        ):
            if token not in text:
                errors.append(f"{OPERATOR_PAGE}: missing {token!r}")

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
