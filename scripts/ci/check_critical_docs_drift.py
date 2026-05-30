#!/usr/bin/env python3
"""Merge-blocking guard for critical buyer/operator doc drift (Improvement #8)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

GITHUB_LINK = re.compile(r"github\.com/[^/]+/[^/]+/(blob|tree)/", re.I)
BULK_CAP_STALE = re.compile(
    r"(≤\s*30|up to 30|maximum 30|max 30)\s+files",
    re.I,
)
FORBIDDEN_ASSURANCE = re.compile(
    r"\b(SOC\s*2\s*Type\s*II\s+attestation|CPA\s+attestation|third[- ]party\s+pen[- ]test\s+(completed|passed|clean))\b",
    re.I,
)
HONEST_ASSURANCE_CONTEXT = re.compile(
    r"(not yet|not CPA|deferred|planned,\s*not|self-assert|without |interim|V1\.1 backlog|not third-party|not scheduled|template only)",
    re.I,
)
LATEST_AS_SHIPPING_TRUTH = re.compile(
    r"docs/assessments/LATEST\.md.*(?:source of (?:shipping|product) truth|shipping truth)",
    re.I,
)

ACTIVE_GTM_PATHS = (
    REPO_ROOT / "docs/go-to-market/SERVICE_LED_OFFERS.md",
    REPO_ROOT / "docs/go-to-market/GTM_BACKLOG.md",
    REPO_ROOT / "docs/go-to-market/TRUST_CENTER.md",
    REPO_ROOT / "docs/go-to-market/trust-center.md",
    REPO_ROOT / "docs/REPOSITORY_README.md",
    REPO_ROOT / "docs/library/V1_READINESS_SUMMARY.md",
    REPO_ROOT / "docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md",
)

DOC_INDEX = REPO_ROOT / "archlucid-ui/public/doc-index.json"


def _check_file(path: Path, violations: list[str]) -> None:
    if not path.is_file():
        return

    text = path.read_text(encoding="utf-8")
    rel = path.relative_to(REPO_ROOT).as_posix()

    if "archive" in rel.lower():
        return

    for match in BULK_CAP_STALE.finditer(text):
        line_no = text.count("\n", 0, match.start()) + 1
        violations.append(f"{rel}:{line_no}: obsolete bulk-upload cap wording ({match.group(0)!r})")

    for match in FORBIDDEN_ASSURANCE.finditer(text):
        line_start = text.rfind("\n", 0, match.start()) + 1
        line_end = text.find("\n", match.start())
        if line_end < 0:
            line_end = len(text)
        line = text[line_start:line_end]

        if HONEST_ASSURANCE_CONTEXT.search(line):
            continue

        line_no = text.count("\n", 0, match.start()) + 1
        violations.append(f"{rel}:{line_no}: forbidden assurance claim ({match.group(0)!r})")

    for match in LATEST_AS_SHIPPING_TRUTH.finditer(text):
        line_no = text.count("\n", 0, match.start()) + 1
        violations.append(f"{rel}:{line_no}: LATEST.md referenced as shipping truth")


def _check_doc_index(violations: list[str]) -> None:
    if not DOC_INDEX.is_file():
        violations.append("archlucid-ui/public/doc-index.json: missing")
        return

    rows = json.loads(DOC_INDEX.read_text(encoding="utf-8"))

    for row in rows:
        url = str(row.get("url", ""))
        title = str(row.get("title", ""))

        if GITHUB_LINK.search(url):
            violations.append(
                f"archlucid-ui/public/doc-index.json: entry {title!r} still uses GitHub blob URL"
            )


def critical_docs_drift_violations(root: Path) -> list[str]:
    violations: list[str] = []

    for path in ACTIVE_GTM_PATHS:
        _check_file(path, violations)

    _check_doc_index(violations)

    return violations


def main() -> int:
    violations = critical_docs_drift_violations(REPO_ROOT)

    if violations:
        print("Critical docs drift FAILED:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Critical docs drift: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
