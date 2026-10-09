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
    violations, retired, baselined = lint_ledger.lint_ledger(ledger)

    assert violations == []
    assert len(retired) == 1
    assert baselined == []


def test_lint_fails_open_zone_with_inflated_counters() -> None:
    ledger = """
## Zone: zone-open

- **id:** zone-open
- **hunts:** 5
- **bugs-found:** 9
"""
    violations, retired, baselined = lint_ledger.lint_ledger(ledger)

    assert len(violations) == 1
    assert violations[0].zone_id == "zone-open"
    assert retired == []
    assert baselined == []


def test_lint_allows_open_zone_within_historical_baseline() -> None:
    ledger = """
## Zone: ui-oidc

- **id:** ui-oidc
- **hunts:** 30
- **bugs-found:** 35
"""
    violations, retired, baselined = lint_ledger.lint_ledger(ledger)

    assert violations == []
    assert retired == []
    assert [zone.zone_id for zone in baselined] == ["ui-oidc"]


def test_lint_fails_open_zone_whose_excess_grew_past_baseline() -> None:
    ledger = """
## Zone: ui-oidc

- **id:** ui-oidc
- **hunts:** 30
- **bugs-found:** 36
"""
    violations, retired, baselined = lint_ledger.lint_ledger(ledger)

    assert [zone.zone_id for zone in violations] == ["ui-oidc"]
    assert baselined == []


def test_baseline_zone_without_excess_is_not_reported() -> None:
    ledger = """
## Zone: ui-oidc

- **id:** ui-oidc
- **hunts:** 30
- **bugs-found:** 30
"""
    violations, retired, baselined = lint_ledger.lint_ledger(ledger)

    assert violations == []
    assert baselined == []


def test_excess_is_never_negative() -> None:
    zone = lint_ledger.ZoneCounters("zone-a", hunts=10, bugs_found=3)

    assert zone.excess == 0
    assert not zone.within_historical_baseline


def test_duplicate_counter_fields_are_reported() -> None:
    ledger = """
## Zone: zone-open

- **id:** zone-open
- **hunts:** 5
- **bugs-found:** 1
- **hunts:** 6
"""
    assert lint_ledger.duplicate_counter_zone_ids(ledger) == ["zone-open"]


def test_repo_ledger_has_no_duplicate_counters() -> None:
    ledger = lint_ledger.LEDGER_PATH.read_text(encoding="utf-8")

    assert lint_ledger.duplicate_counter_zone_ids(ledger) == []


def test_repo_ledger_has_no_open_invariant_violations() -> None:
    ledger = lint_ledger.LEDGER_PATH.read_text(encoding="utf-8")
    violations, retired, baselined = lint_ledger.lint_ledger(ledger)

    assert violations == []
    assert {zone.zone_id for zone in retired} == set(lint_ledger.RETIRED_COUNTER_ALLOWLIST)
    assert {zone.zone_id for zone in baselined} <= set(lint_ledger.HISTORICAL_EXCESS_BASELINE)


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
