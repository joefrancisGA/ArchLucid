#!/usr/bin/env python3
"""Fail when production C# introduces blocking waits or async void methods."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_HAZARDS = (
    (re.compile(r"\.Wait\s*\("), "blocking Task.Wait call"),
    (re.compile(r"\basync\s+void\b"), "async void method"),
)
_SKIP_PARTS = {"bin", "obj", ".git"}


def find_async_hazards(root: Path) -> list[tuple[str, int, str, str]]:
    hits: list[tuple[str, int, str, str]] = []
    for path in root.rglob("*.cs"):
        if any(part in _SKIP_PARTS for part in path.parts):
            continue
        if any(part.endswith(".Tests") or part == "tests" for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for line_number, line in enumerate(text.splitlines(), start=1):
            for pattern, description in _HAZARDS:
                if pattern.search(line):
                    hits.append((path.relative_to(root).as_posix(), line_number, line.strip(), description))
    return hits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    args = parser.parse_args(argv)
    hits = find_async_hazards(args.root.resolve())
    if hits:
        for path, line_number, line, description in hits:
            print(f"{path}:{line_number}: {description}: {line}", file=sys.stderr)
        print("::error::Use awaitable APIs and cancellation-aware async Task methods", file=sys.stderr)
        return 1

    print("check_async_hazards: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
