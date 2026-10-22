#!/usr/bin/env python3
"""Forbid invalid StatusTag kind=\"warning\" — use needs-attention instead."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_UI_SRC = Path("archlucid-ui/src")

_SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    ".next",
    "dist",
}

# EnterpriseStatusKind does not include warning (#1609 remediation pages).
_FORBIDDEN = re.compile(
    r"""<StatusTag\b[^>]*\bkind=(["'])warning\1""",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def should_scan(path: Path) -> bool:
    if path.suffix.lower() != ".tsx":
        return False

    if any(part in _SKIP_DIR_NAMES for part in path.parts):
        return False

    return True


def find_violations(root: Path) -> list[tuple[str, int, str]]:
    hits: list[tuple[str, int, str]] = []
    scan_root = root / _UI_SRC

    if not scan_root.is_dir():
        return [("archlucid-ui/src", 0, "missing Operator UI source tree")]

    for path in scan_root.rglob("*.tsx"):
        if not should_scan(path):
            continue

        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError as error:
            rel = path.relative_to(root).as_posix()
            hits.append((rel, 0, f"unreadable: {error}"))

            continue

        for line_number, line in enumerate(text.splitlines(), start=1):
            if _FORBIDDEN.search(line):
                hits.append((path.relative_to(root).as_posix(), line_number, line.rstrip()))

    return hits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    hits = find_violations(repo_root())

    if hits:
        for rel_path, line_number, line in hits:
            location = f"{rel_path}:{line_number}" if line_number else rel_path
            print(
                f"{location}: StatusTag kind=\"warning\" is invalid; use kind=\"needs-attention\"",
                file=sys.stderr,
            )
            if line:
                print(f"  {line}", file=sys.stderr)

        return 1

    print("check_status_tag_kind_warning: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
