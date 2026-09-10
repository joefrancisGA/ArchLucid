#!/usr/bin/env python3
"""Unit tests for al-bug-lint-zone-paths.py."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

_SPEC = importlib.util.spec_from_file_location("zone_paths", _AGENT_DIR / "al-bug-lint-zone-paths.py")
zone_paths = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["zone_paths"] = zone_paths
_SPEC.loader.exec_module(zone_paths)

REPO_ROOT = Path(__file__).resolve().parents[2]


def test_missing_file_prefix_fails() -> None:
    ledger = """# fixture

## Zone: ghost-zone

- **id:** ghost-zone
- **status:** open
- **paths:** ArchLucid.Application/DoesNotExist.cs
"""
    ghosts = zone_paths.lint_zone_paths(ledger, REPO_ROOT)
    assert ("ghost-zone", "ArchLucid.Application/DoesNotExist.cs") in ghosts


def test_existing_application_prefix_passes() -> None:
    ledger = """# fixture

## Zone: good-zone

- **id:** good-zone
- **status:** open
- **paths:** ArchLucid.Application/Runs/
"""
    ghosts = zone_paths.lint_zone_paths(ledger, REPO_ROOT)
    assert ("good-zone", "ArchLucid.Application/Runs/") not in ghosts


def test_retired_mega_zone_skipped() -> None:
    ledger = """# fixture

## Zone: archlucid-core

- **id:** archlucid-core
- **status:** exhausted
- **paths:** ArchLucid.Core/MissingEverywhere.cs
"""
    ghosts = zone_paths.lint_zone_paths(ledger, REPO_ROOT)
    assert ghosts == []


if __name__ == "__main__":
    failures = 0
    for name, fn in sorted(globals().items()):
        if not name.startswith("test_") or not callable(fn):
            continue
        try:
            fn()
            print(f"PASS {name}")
        except AssertionError as exc:
            failures += 1
            print(f"FAIL {name}: {exc}")
    print(f"\n{failures} failure(s)")
    raise SystemExit(1 if failures else 0)
