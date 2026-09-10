#!/usr/bin/env python3
"""Unit tests for ABQ-35 severity calibration audit."""

from __future__ import annotations

import importlib.util
import sys
from datetime import datetime, timezone
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
_SPEC = importlib.util.spec_from_file_location(
    "severity_audit",
    _AGENT_DIR / "al-bug-audit-severity-calibration.py",
)
audit = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["severity_audit"] = audit
_SPEC.loader.exec_module(audit)

from al_bug_ledger import ProvenRow  # noqa: E402


def test_cross_tenant_200_is_harm_named() -> None:
    assert audit.classify_row("cross-tenant GET returned 200 2026-09-01") == "harm-named"


def test_allowlist_disagreement_is_uncalibrated() -> None:
    assert audit.classify_row("test disagreed with allowlist 2026-09-01") == "uncalibrated"


def test_sample_caps_population() -> None:
    impacts = {"z": "high"}
    rows = [ProvenRow("z", f"row {i} 2026-09-0{(i % 9) + 1}") for i in range(40)]
    sampled = audit.select_high_impact_rows(rows, impacts, None, 25)
    assert len(sampled) == 25


def test_empty_sample_report() -> None:
    report = audit.render_report([], [])
    assert "Empty sample" in report
    assert "not a SOC 2" in report


def test_audit_does_not_touch_validity_audit_heuristics() -> None:
    validity = Path(_AGENT_DIR / "al-bug-audit-proven-rows.py").read_text(encoding="utf-8")
    assert "names_user_visible_harm" not in validity


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
