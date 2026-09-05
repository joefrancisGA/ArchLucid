#!/usr/bin/env python3
"""Fail when Git merge conflict markers remain in tracked product sources."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_CONFLICT_MARKER = re.compile(
    r"^(<<<<<<< |=======\s*$|>>>>>>> )",
)

_SCAN_SUFFIXES = {
    ".cs",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".yml",
    ".yaml",
    ".md",
    ".ps1",
    ".sh",
    ".sql",
    ".tf",
}

_SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    "bin",
    "obj",
    ".next",
    "dist",
    ".build",
    ".cache",
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def should_scan(path: Path) -> bool:
    if not path.is_file():
        return False

    if path.suffix.lower() not in _SCAN_SUFFIXES:
        return False

    return not any(part in _SKIP_DIR_NAMES for part in path.parts)


def find_conflict_markers(root: Path) -> list[tuple[str, int, str]]:
    hits: list[tuple[str, int, str]] = []

    for path in root.rglob("*"):
        if not should_scan(path):
            continue

        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError as error:
            rel = path.relative_to(root).as_posix()
            hits.append((rel, 0, f"unreadable: {error}"))

            continue

        for line_number, line in enumerate(text.splitlines(), start=1):
            if _CONFLICT_MARKER.match(line):
                hits.append((path.relative_to(root).as_posix(), line_number, line.rstrip()))

    return hits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    hits = find_conflict_markers(root)

    if not hits:
        print("check_no_merge_conflict_markers: OK")

        return 0

    for rel_path, line_number, line in hits:
        if line_number == 0:
            print(f"{rel_path}: {line}", file=sys.stderr)
        else:
            print(f"{rel_path}:{line_number}: {line}", file=sys.stderr)

    print(
        f"::error::Found {len(hits)} merge conflict marker(s); resolve before merging to trunk",
        file=sys.stderr,
    )

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
