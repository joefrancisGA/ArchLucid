#!/usr/bin/env python3
"""Validate SecureNow compliance-readiness notes and lineage formatter."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESPONSIBILITY = Path("docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md")
COVERAGE = Path("docs/securenow/FRAMEWORK_COVERAGE.md")
FORMATTER = Path("archlucid-ui/src/lib/audit-evidence-control-lineage-markdown.ts")
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
FORBIDDEN = ("SOC 2 certified", "ISO 27001 certified")


def _resolve_link(base: Path, target: str) -> Path:
    return (base.parent / target.split("#", 1)[0]).resolve()


def _check_links(text: str, base: Path, errors: list[str]) -> None:
    for match in LINK_RE.finditer(text):
        target = match.group(1)
        if target.startswith("http") or not target.split("#", 1)[0]:
            continue
        if not _resolve_link(base, target).is_file():
            errors.append(f"{base}: broken link {target!r}")


def _table_data_rows(text: str, header: str) -> list[str]:
    start = text.find(header)
    if start < 0:
        return []
    rows: list[str] = []
    in_table = False
    for line in text[start:].splitlines():
        stripped = line.strip()
        if stripped.startswith("## ") and stripped != heading:
            break
        if not stripped.startswith("|"):
            if in_table and rows:
                break
            continue
        if "---" in stripped.replace(" ", ""):
            in_table = True
            continue
        if in_table and not stripped.lower().startswith(header.lower()):
            rows.append(stripped)
    return rows


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    responsibility = root / RESPONSIBILITY
    coverage = root / COVERAGE
    formatter = root / FORMATTER

    if not responsibility.is_file():
        errors.append(f"missing {RESPONSIBILITY}")
    else:
        text = responsibility.read_text(encoding="utf-8")
        rows = _table_data_rows(text, "| Duty |")
        if len(rows) < 6 or len(rows) > 8:
            errors.append(f"responsibility: expected 6–8 duty rows, found {len(rows)}")
        for token in ("Not an ATO", "NOT VERIFIED"):
            if token not in text:
                errors.append(f"responsibility: missing {token!r}")
        if any(phrase in text for phrase in FORBIDDEN):
            errors.append("responsibility: contains forbidden certification phrase")
        _check_links(text, responsibility, errors)

    if not coverage.is_file():
        errors.append(f"missing {COVERAGE}")
    else:
        text = coverage.read_text(encoding="utf-8")
        for token in ("Not a certification", "frameworkMappings"):
            if token not in text:
                errors.append(f"coverage: missing {token!r}")
        if any(phrase in text for phrase in FORBIDDEN):
            errors.append("coverage: contains forbidden certification phrase")
        _check_links(text, coverage, errors)

    if not formatter.is_file():
        errors.append(f"missing {FORMATTER}")
    elif "NOT VERIFIED" not in formatter.read_text(encoding="utf-8"):
        errors.append("formatter: missing 'NOT VERIFIED'")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow compliance notes: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
