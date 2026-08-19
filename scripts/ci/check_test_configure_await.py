#!/usr/bin/env python3
"""Fail when test projects use ConfigureAwait(false) (workspace rule: tests must not use it)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEST_GLOB_SUFFIXES = ("Tests.cs", "Test.cs")
PATTERN = re.compile(r"\.ConfigureAwait\s*\(\s*false\s*\)")
# Architecture tests assert production code contains ConfigureAwait — not a violation.
SKIP_LINE = re.compile(r'Should\s*\(\s*\)\s*\.\s*Contain\s*\(\s*["\'].*ConfigureAwait')


def is_test_file(path: Path) -> bool:
    name = path.name
    return any(name.endswith(suffix) for suffix in TEST_GLOB_SUFFIXES)


def scan_file(path: Path) -> list[tuple[int, str]]:
    hits: list[tuple[int, str]] = []
    text = path.read_text(encoding="utf-8")

    for line_no, line in enumerate(text.splitlines(), start=1):
        if SKIP_LINE.search(line):
            continue

        if PATTERN.search(line):
            hits.append((line_no, line.strip()))

    return hits


def main() -> int:
    violations: list[str] = []

    for path in sorted(ROOT.rglob("*.cs")):
        if "obj" in path.parts or "bin" in path.parts or ".git" in path.parts:
            continue

        if not is_test_file(path):
            continue

        for line_no, snippet in scan_file(path):
            rel = path.relative_to(ROOT).as_posix()
            violations.append(f"{rel}:{line_no}: {snippet}")

    if not violations:
        print("No ConfigureAwait(false) in test projects.")
        return 0

    print("ConfigureAwait(false) is prohibited in test projects:", file=sys.stderr)

    for item in violations:
        print(f"  {item}", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
