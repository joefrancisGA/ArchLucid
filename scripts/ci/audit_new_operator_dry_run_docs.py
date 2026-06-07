#!/usr/bin/env python3
"""Audit first-pilot entry stays within persona-guided paths (T2-21)."""

from __future__ import annotations

import sys
from pathlib import Path

_ENTRY = Path("docs/START_HERE.md")
_ROLE_INDEX = Path("docs/runbooks/ROLE_INDEX.md")
_REQUIRED_PERSONAS = ("Operator", "Platform engineer", "Release owner")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def main() -> int:
    root = repo_root()
    start_here = root / _ENTRY
    role_index = root / _ROLE_INDEX
    errors: list[str] = []

    if not start_here.is_file():
        errors.append("Missing docs/START_HERE.md")
    elif "ROLE_INDEX.md" not in start_here.read_text(encoding="utf-8"):
        errors.append("START_HERE.md must link ROLE_INDEX.md")

    if not role_index.is_file():
        errors.append("Missing docs/runbooks/ROLE_INDEX.md")
    else:
        role_text = role_index.read_text(encoding="utf-8", errors="replace")

        for persona in _REQUIRED_PERSONAS:
            if persona not in role_text:
                errors.append(f"ROLE_INDEX.md missing persona section: {persona}")

        if "If this failed, go here" not in role_text:
            errors.append("ROLE_INDEX.md must include failure-branch sections")

    if errors:
        for error in errors:
            print(error)

        return 1

    print("audit_new_operator_dry_run_docs: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
