#!/usr/bin/env python3
"""Require Playwright skips and fixmes to explain why they are intentional."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_BARE_SKIP = re.compile(r"\btest\.(?:skip|fixme)\s*\(\s*\)")


def find_missing_reasons(root: Path) -> list[tuple[str, int, str]]:
    hits: list[tuple[str, int, str]] = []
    for path in root.rglob("*.spec.ts"):
        if any(part in {".git", "node_modules", ".next", "dist", "coverage"} for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        lines = text.splitlines()
        for match in _BARE_SKIP.finditer(text):
            line_number = text.count("\n", 0, match.start()) + 1
            hits.append((path.relative_to(root).as_posix(), line_number, lines[line_number - 1].strip()))
    return hits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prefix", type=Path, default=Path("archlucid-ui/e2e"))
    args = parser.parse_args(argv)
    hits = find_missing_reasons(args.prefix.resolve())
    if hits:
        for path, line, text in hits:
            print(f"{path}:{line}: {text}", file=sys.stderr)
        print(f"::error::{len(hits)} Playwright skip/fixme call(s) need an explicit reason", file=sys.stderr)
        return 1
    print("check_playwright_skip_reasons: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
