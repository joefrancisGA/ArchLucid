#!/usr/bin/env python3
"""Scan buyer-facing docs for compliance wording that overclaims formal attestation."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


SCAN_ROOTS: tuple[str, ...] = (
    "docs/go-to-market",
    "docs/library",
    "docs/security",
    "docs/runbooks",
)

# Match phrase unless the same line contains an approved caveat token.
PROHIBITED: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bSOC\s*2\s+compliant\b", re.I), "SOC 2 compliant"),
    (re.compile(r"\bcertification\s+automation\b", re.I), "certification automation"),
    (re.compile(r"\bISO\s+\d+\s+certified\b", re.I), "ISO certified"),
    (re.compile(r"\bCPA\s+attested\b", re.I), "CPA attested"),
)

APPROVED_CAVEAT_MARKERS: tuple[str, ...] = (
    "not ",
    "no ",
    "self-assessment",
    "self-assessed",
    "roadmap",
    "deferred",
    "template",
    "do not",
    "does not",
    "informational",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def line_has_caveat(line: str) -> bool:
    lowered = line.lower()
    return any(marker in lowered for marker in APPROVED_CAVEAT_MARKERS)


def scan_file(path: Path) -> list[str]:
    violations: list[str] = []
    text = path.read_text(encoding="utf-8")

    for index, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()

        if stripped.startswith("**Q:") or "never imply" in line.lower():
            continue

        if line_has_caveat(line):
            continue

        for pattern, label in PROHIBITED:
            if pattern.search(line):
                violations.append(f"{path.as_posix()}:{index}: ambiguous '{label}' — {line.strip()}")

    return violations


def scan_repo(root: Path) -> list[str]:
    all_violations: list[str] = []

    for rel_root in SCAN_ROOTS:
        base = root / rel_root

        if not base.is_dir():
            continue

        for path in base.rglob("*.md"):
            if "archive" in path.parts or "ai-pack-design-specs" in path.parts:
                continue

            all_violations.extend(scan_file(path))

    return all_violations


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", action="store_true", help="Scan tests/fixtures only.")
    args = parser.parse_args()

    root = repo_root()

    if args.fixture:
        fixture = root / "scripts" / "ci" / "fixtures" / "compliance-posture-violation.sample.md"
        violations = scan_file(fixture) if fixture.is_file() else ["fixture missing"]
    else:
        violations = scan_repo(root)

    if violations:
        print("compliance posture clarity: FAIL")
        for item in violations[:40]:
            print(item)

        if len(violations) > 40:
            print(f"... and {len(violations) - 40} more")

        return 1

    print("compliance posture clarity: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
