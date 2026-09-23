#!/usr/bin/env python3
"""Require every ESLint suppression to document why it is intentional."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_DIRECTIVE = re.compile(r"eslint-disable(?:-next-line|-line)?\b(?P<rest>.*)")
_SCAN_SUFFIXES = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"}
_SKIP_DIR_NAMES = {".git", "node_modules", ".next", "dist", "coverage"}


def find_missing_reasons(root: Path) -> list[tuple[str, int, str]]:
    hits: list[tuple[str, int, str]] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in _SCAN_SUFFIXES:
            continue
        if any(part in _SKIP_DIR_NAMES for part in path.parts):
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        for line_number, line in enumerate(text.splitlines(), start=1):
            match = _DIRECTIVE.search(line)
            if not match:
                continue
            reason = match.group("rest").split("--", 1)[1].strip() if "--" in match.group("rest") else ""
            if not reason:
                hits.append((path.relative_to(root).as_posix(), line_number, line.strip()))
    return hits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prefix", type=Path, default=Path("archlucid-ui"))
    args = parser.parse_args(argv)
    hits = find_missing_reasons(args.prefix.resolve())
    if hits:
        for path, line, text in hits:
            print(f"{path}:{line}: {text}", file=sys.stderr)
        print(f"::error::{len(hits)} ESLint suppression(s) need a reason after '--'", file=sys.stderr)
        return 1
    print("check_eslint_disable_reasons: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
