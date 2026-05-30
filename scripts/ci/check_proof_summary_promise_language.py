#!/usr/bin/env python3
"""Warn-only scan for forbidden GTM promise phrases (Improvement #20 / WHAT_NOT_TO_PROMISE.md)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


# Phrases from docs/go-to-market/WHAT_NOT_TO_PROMISE.md "Do not promise" column (lowercase match).
FORBIDDEN_PHRASES: tuple[str, ...] = (
    "we are soc 2 certified",
    "soc 2 certified",
    "independent pen test report available",
    "buy on marketplace today",
    "mcp marketplace ga",
    "native jira/teams ga in v1",
    "active/active multi-region sla",
    "guaranteed $ savings",
    "guaranteed savings",
    "invoice-accurate cogs",
    "signed design partner reference",
    "public plugin marketplace",
    "third-party pen test complete",
)

NEGATION_PREFIXES: tuple[str, ...] = (
    "do not claim",
    "do not promise",
    "not ",
    "never ",
    "without ",
    "deferred",
    "avoid ",
)


def _line_has_negation(line_lower: str, phrase: str) -> bool:
    idx = line_lower.find(phrase)
    if idx < 0:
        return False

    prefix = line_lower[:idx].strip()
    return any(prefix.endswith(p) or p in prefix for p in NEGATION_PREFIXES)


def scan_text(text: str, *, source_label: str) -> list[str]:
    violations: list[str] = []
    for line_no, line in enumerate(text.splitlines(), start=1):
        line_lower = line.lower()
        for phrase in FORBIDDEN_PHRASES:
            if phrase not in line_lower:
                continue

            if _line_has_negation(line_lower, phrase):
                continue

            violations.append(f"{source_label}:{line_no}: forbidden phrase '{phrase}'")
    return violations


def scan_paths(paths: list[Path]) -> list[str]:
    all_violations: list[str] = []
    for path in paths:
        if not path.is_file():
            all_violations.append(f"::warning::Missing file {path}")
            continue

        content = path.read_text(encoding="utf-8", errors="replace")
        all_violations.extend(scan_text(content, source_label=str(path)))
    return all_violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="Files to scan (default: proof-summary template paths under docs/).",
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit 1 when violations are found (default: warn-only, exit 0).",
    )
    args = parser.parse_args(argv)

    root = _repo_root()
    targets = args.paths
    if not targets:
        targets = [
            root / "docs" / "go-to-market" / "WHAT_NOT_TO_PROMISE.md",
            root / "docs" / "go-to-market" / "COMMERCIAL_DECISION_PACKET.md",
            root / "docs" / "go-to-market" / "PROCUREMENT_FAQ.md",
            root / "docs" / "go-to-market" / "QUOTE_TO_PROOF_READINESS_CHECKLIST.md",
        ]

    violations = scan_paths(targets)
    for message in violations:
        if message.startswith("::warning::"):
            print(message, file=sys.stderr)
        else:
            print(f"::warning::{message}", file=sys.stderr)

    if violations and args.enforce:
        print(f"::error::{len(violations)} forbidden promise phrase(s) detected", file=sys.stderr)
        return 1

    if violations:
        print(f"promise-language: {len(violations)} warning(s) (warn-only)", file=sys.stderr)
        return 0

    print("promise-language: no forbidden phrases detected")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
