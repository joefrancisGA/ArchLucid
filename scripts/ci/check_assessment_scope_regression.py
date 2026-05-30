#!/usr/bin/env python3
"""Detect V1/V1.1 scope regressions in assessment implementation prompts."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class ScopeTerm:
    label: str
    pattern: re.Pattern[str]


V1_1_SCOPE_TERMS: tuple[ScopeTerm, ...] = (
    ScopeTerm("real pilot proof packet cohort", re.compile(r"real\s+pilot\s+proof\s+packet\s+cohort", re.IGNORECASE)),
    ScopeTerm("market-facing demo asset production", re.compile(r"market[-\s]facing\s+demo\s+asset\s+production", re.IGNORECASE)),
    ScopeTerm("SOC 2 CPA attestation", re.compile(r"SOC\s*2\s+CPA|CPA\s+SOC\s*2", re.IGNORECASE)),
    ScopeTerm("third-party pen-test program", re.compile(r"third[-\s]party\s+pen(?:etration)?[-\s]test", re.IGNORECASE)),
    ScopeTerm("first-party connectors", re.compile(r"first[-\s]party\s+(?:ITSM|Jira|ServiceNow|Confluence|Slack|Teams|chat)[^.\n]*connect", re.IGNORECASE)),
    ScopeTerm("MCP public/plugin ecosystem", re.compile(r"\bMCP\b|plugin\s+ecosystem|third[-\s]party\s+plugin\s+marketplace", re.IGNORECASE)),
    ScopeTerm("live commerce un-hold", re.compile(r"live\s+commerce\s+un[-\s]hold|live\s+Marketplace|Stripe\s+live", re.IGNORECASE)),
)


SAFE_SCOPE_MARKERS: tuple[str, ...] = (
    "deferred",
    "deferred_scope",
    "planned, not yet scheduled",
    "v1.1 backlog",
    "v1.1 owner",
    "owner-gated",
    "owner-only",
    "out of v1",
    "not scored",
    "not scored into `(a)`",
    "not a v1 scored defect",
    "not a v1 assessment",
    "unless the corresponding v1.1 backlog item is explicitly picked up",
)


ASSESSMENT_PATH = Path("docs/assessments/LATEST.md")


def _section(text: str, heading: str) -> str:
    start = text.find(heading)

    if start < 0:
        return ""

    next_heading = re.search(r"^##\s+", text[start + len(heading) :], re.MULTILINE)

    if next_heading is None:
        return text[start:]

    return text[start : start + len(heading) + next_heading.start()]


def _heading_lines(section_text: str) -> list[str]:
    return [line.strip() for line in section_text.splitlines() if line.startswith("### ")]


def _bullet_lines(section_text: str) -> list[str]:
    return [line.strip() for line in section_text.splitlines() if line.lstrip().startswith("- ")]


def _is_safe_scope_reference(line: str) -> bool:
    lower = line.lower()

    return any(marker in lower for marker in SAFE_SCOPE_MARKERS)


def assessment_scope_violations(root: Path) -> list[str]:
    path = root / ASSESSMENT_PATH

    if not path.is_file():
        return [f"{ASSESSMENT_PATH.as_posix()}: missing assessment file"]

    text = path.read_text(encoding="utf-8", errors="replace")
    opportunities = _section(text, "## 9. Top Improvement Opportunities")
    pending = _section(text, "## 11. Pending Questions for Later")
    violations: list[str] = []

    for line in _heading_lines(opportunities):
        for term in V1_1_SCOPE_TERMS:
            if term.pattern.search(line) and not _is_safe_scope_reference(line):
                violations.append(
                    f"{ASSESSMENT_PATH.as_posix()}: V1.1 item `{term.label}` appears as a current improvement heading: {line}"
                )

    for line in _bullet_lines(pending):
        for term in V1_1_SCOPE_TERMS:
            if term.pattern.search(line) and not _is_safe_scope_reference(line):
                violations.append(
                    f"{ASSESSMENT_PATH.as_posix()}: V1.1 item `{term.label}` appears as an unresolved pending question: {line}"
                )

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--advisory",
        action="store_true",
        help="Warn-only exit 0 even when violations are found.",
    )
    args = parser.parse_args(argv)

    violations = assessment_scope_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"assessment-scope-regression: {label}", file=sys.stderr)

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("assessment-scope-regression: OK")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
