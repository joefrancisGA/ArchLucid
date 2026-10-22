#!/usr/bin/env python3
"""Ensure map/index docs declare source-of-truth headers (T2-18)."""

from __future__ import annotations

import sys
from pathlib import Path

_REQUIRED_SNIPPETS = ("**Spine:**", "**Scope:**")
_TARGETS = [
    "docs/START_HERE.md",
    "docs/runbooks/README.md",
    "docs/runbooks/ROLE_INDEX.md",
    "docs/library/V1_RELEASE_CHECKLIST.md",
    "docs/go-to-market/PROCUREMENT_PACK_INDEX.md",
]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    root = repo_root()
    errors: list[str] = []

    for relative in _TARGETS:
        path = root / relative

        if not path.is_file():
            errors.append(f"Missing: {relative}")
            continue

        head = "\n".join(path.read_text(encoding="utf-8", errors="replace").splitlines()[:12])

        if not any(snippet in head for snippet in _REQUIRED_SNIPPETS):
            errors.append(f"Missing Scope/Spine header in first 12 lines: {relative}")

    if errors:
        for error in errors:
            print(error)

        return 1

    print("check_doc_source_of_truth_headers: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
