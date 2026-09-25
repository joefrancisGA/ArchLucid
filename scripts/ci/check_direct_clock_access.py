#!/usr/bin/env python3
"""Fail when production C# reads the system clock directly instead of using TimeProvider."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_CLOCK_ACCESS = re.compile(r"\b(?:DateTime|DateTimeOffset)\.(?:UtcNow|Now)\b")
_SKIP_PARTS = {"bin", "obj", ".git"}


def find_direct_clock_access(root: Path) -> list[tuple[str, int, str]]:
    hits: list[tuple[str, int, str]] = []
    for path in root.rglob("*.cs"):
        if any(part in _SKIP_PARTS for part in path.parts):
            continue
        if any(part.endswith(".Tests") or part == "tests" for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for line_number, line in enumerate(text.splitlines(), start=1):
            if _CLOCK_ACCESS.search(line):
                hits.append((path.relative_to(root).as_posix(), line_number, line.strip()))
    return hits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    args = parser.parse_args(argv)
    hits = find_direct_clock_access(args.root.resolve())
    if hits:
        for path, line_number, line in hits:
            print(f"{path}:{line_number}: {line}", file=sys.stderr)
        print("::error::Use an injected TimeProvider in production code", file=sys.stderr)
        return 1

    print("check_direct_clock_access: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
