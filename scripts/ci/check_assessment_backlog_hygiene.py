#!/usr/bin/env python3
"""Detect stale or deferred assessment improvement prompts in LATEST.md."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ASSESSMENT_PATH = Path("docs/assessments/LATEST.md")
IMPLEMENTED_MARKER = "**Implemented"

# Improvements marked complete in the 2026-05-30 batch passes (keep in sync with LATEST section 9).
IMPLEMENTED_NUMBERS: frozenset[int] = frozenset({1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25})

DEFERRED_PROMPT_TERMS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("SOC 2 CPA attestation", re.compile(r"SOC\s*2\s+CPA|CPA\s+SOC\s*2", re.IGNORECASE)),
    ("third-party pen-test program", re.compile(r"third[-\s]party\s+pen(?:etration)?[-\s]test", re.IGNORECASE)),
    ("MCP public/plugin ecosystem", re.compile(r"\bMCP\b|plugin\s+ecosystem|third[-\s]party\s+plugin\s+marketplace", re.IGNORECASE)),
    ("live commerce un-hold", re.compile(r"live\s+commerce\s+un[-\s]hold|Stripe\s+live", re.IGNORECASE)),
    ("multi-region active/active", re.compile(r"multi[-\s]region\s+active/active", re.IGNORECASE)),
)

SAFE_SCOPE_MARKERS: tuple[str, ...] = (
    "deferred",
    "v1.1 backlog",
    "owner-gated",
    "not scored",
    "unless the corresponding v1.1 backlog item is explicitly picked up",
    "no mcp",
    "not a public plugin",
    "constraints: no",
    "do not widen",
)


def _section(text: str, heading: str) -> str:
    start = text.find(heading)

    if start < 0:
        return ""

    next_heading = re.search(r"^##\s+", text[start + len(heading) :], re.MULTILINE)

    if next_heading is None:
        return text[start:]

    return text[start : start + len(heading) + next_heading.start()]


def _is_safe_scope_reference(line: str) -> bool:
    lower = line.lower()

    return any(marker in lower for marker in SAFE_SCOPE_MARKERS)


def _parse_improvement_blocks(opportunities: str) -> list[tuple[int, str, str]]:
    blocks: list[tuple[int, str, str]] = []
    pattern = re.compile(r"^###\s+(\d+)\.\s+(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(opportunities))

    for index, match in enumerate(matches):
        number = int(match.group(1))
        title = match.group(2).strip()
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(opportunities)
        body = opportunities[start:end]
        blocks.append((number, title, body))

    return blocks


def assessment_backlog_hygiene_violations(root: Path) -> list[str]:
    path = root / ASSESSMENT_PATH

    if not path.is_file():
        return [f"{ASSESSMENT_PATH.as_posix()}: missing assessment file"]

    text = path.read_text(encoding="utf-8", errors="replace")
    opportunities = _section(text, "## 9. Top Improvement Opportunities")
    violations: list[str] = []

    for number, title, body in _parse_improvement_blocks(opportunities):
        if number in IMPLEMENTED_NUMBERS and IMPLEMENTED_MARKER not in body and "Fully actionable now" in body:
            violations.append(
                f"{ASSESSMENT_PATH.as_posix()}: improvement #{number} ({title}) is implemented in repo "
                "but LATEST still marks it Fully actionable — update Status to Implemented."
            )

        if IMPLEMENTED_MARKER in body:
            continue

        for line in body.splitlines():
            if _is_safe_scope_reference(line):
                continue

            for label, pattern in DEFERRED_PROMPT_TERMS:
                if pattern.search(line):
                    violations.append(
                        f"{ASSESSMENT_PATH.as_posix()}: improvement #{number} prompt references deferred "
                        f"scope `{label}` without safe marker: {line.strip()}"
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

    violations = assessment_backlog_hygiene_violations(REPO_ROOT)

    if violations:
        for violation in violations:
            print(violation, file=sys.stderr)

        if args.advisory:
            print(f"assessment backlog hygiene: {len(violations)} advisory finding(s).", file=sys.stderr)
            return 0

        return 1

    print("assessment backlog hygiene: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
