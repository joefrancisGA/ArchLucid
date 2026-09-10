from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "lint_ledger",
    Path(__file__).resolve().parents[1] / "agent" / "al-bug-lint-ledger-counters.py",
)
lint_ledger = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules["lint_ledger"] = lint_ledger
SPEC.loader.exec_module(lint_ledger)


def test_effective_bugs_caps_at_hunts() -> None:
    zone = lint_ledger.ZoneCounters("zone-a", hunts=10, bugs_found=100)

    assert zone.effective_bugs == 10
    assert zone.invariant_violating


def test_lint_allows_retired_mega_zone() -> None:
    ledger = """
## Zone: archlucid-core

- **id:** archlucid-core
- **hunts:** 377
- **bugs-found:** 2802
"""
    violations, retired = lint_ledger.lint_ledger(ledger)

    assert violations == []
    assert len(retired) == 1


def test_lint_fails_open_zone_with_inflated_counters() -> None:
    ledger = """
## Zone: zone-open

- **id:** zone-open
- **hunts:** 5
- **bugs-found:** 9
"""
    violations, retired = lint_ledger.lint_ledger(ledger)

    assert len(violations) == 1
    assert violations[0].zone_id == "zone-open"
    assert retired == []


if __name__ == "__main__":
    failures = 0

    for name, func in list(globals().items()):
        if name.startswith("test_") and callable(func):
            try:
                func()
                print(f"PASS {name}")
            except AssertionError as exc:
                failures += 1
                print(f"FAIL {name}: {exc}")

    raise SystemExit(failures)
