#!/usr/bin/env python3
"""Unit tests for al-bug-lint-high-impact-proven.py."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

_SPEC = importlib.util.spec_from_file_location("lint_high", _AGENT_DIR / "al-bug-lint-high-impact-proven.py")
lint_high = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["lint_high"] = lint_high
_SPEC.loader.exec_module(lint_high)

HIGH_LEDGER = """# fixture

## Zone: scary-zone

- **id:** scary-zone
- **impact:** high
- **paths:** ArchLucid.Api/

## Zone: calm-zone

- **id:** calm-zone
- **impact:** medium
- **paths:** ArchLucid.Core/
"""


def test_added_high_proven_without_tokens_fails() -> None:
    diff = (
        '+ - **id:** scary-zone\n'
        '+ - [x] (proven) missing harm narrative 2026-09-07\n'
    )
    violations = lint_high.lint_added_proven_lines(diff, HIGH_LEDGER)
    assert len(violations) == 1


def test_cross_tenant_200_passes() -> None:
    diff = (
        '+ - **id:** scary-zone\n'
        '+ - [x] (proven) cross-tenant GET returned 200 with payload 2026-09-07\n'
    )
    violations = lint_high.lint_added_proven_lines(diff, HIGH_LEDGER)
    assert violations == []


def test_impact_low_override_passes() -> None:
    diff = (
        '+ - **id:** scary-zone\n'
        '+ - [x] (proven) vague row [impact:low] 2026-09-07\n'
    )
    violations = lint_high.lint_added_proven_lines(diff, HIGH_LEDGER)
    assert violations == []


def test_medium_zone_passes_without_tokens() -> None:
    diff = (
        '+ - **id:** calm-zone\n'
        '+ - [x] (proven) calm zone row 2026-09-07\n'
    )
    violations = lint_high.lint_added_proven_lines(diff, HIGH_LEDGER)
    assert violations == []


def test_empty_diff_passes() -> None:
    assert lint_high.lint_added_proven_lines("", HIGH_LEDGER) == []


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
