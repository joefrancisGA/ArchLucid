#!/usr/bin/env python3
"""Fixture tests for the azurerm catalog pin (ABQ-51). No network."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
_SPEC = importlib.util.spec_from_file_location(
    "azurerm_catalog",
    REPO_ROOT / "scripts/ci/assert_azurerm_resource_catalog.py",
)
catalog = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["azurerm_catalog"] = catalog
_SPEC.loader.exec_module(catalog)


def _header() -> str:
    return (
        "# hashicorp/terraform-provider-azurerm v5.6.0 "
        f"commit {catalog.PIN} count {catalog.EXPECTED_COUNT}\n"
    )


def test_duplicate_slug_fails() -> None:
    text = _header() + "aadb2c_directory\naadb2c_directory\n"
    _slugs, errors = catalog.parse_catalog_text(text)
    assert any("not unique" in error for error in errors)


def test_missing_sentinel_fails() -> None:
    slugs = ["storage_account"] * catalog.EXPECTED_COUNT
    text = _header() + "\n".join(slugs) + "\n"
    _parsed, errors = catalog.parse_catalog_text(text)
    assert any("missing sentinels" in error for error in errors)


def test_contains_chain_fails() -> None:
    errors = catalog.check_heuristics_text('return normalized.Contains("er", StringComparison.Ordinal);')
    assert errors


def test_catalog_member_passes_gate_check() -> None:
    errors = catalog.check_gate_text(
        "AgentTopologyProposalMergeGateLbTests.cs",
        'sourceId: "azurerm_lb.main"',
        {"lb", "linux_virtual_machine"},
        set(),
    )
    assert errors == []


def test_synthetic_token_fails_gate_check() -> None:
    errors = catalog.check_gate_text(
        "AgentTopologyProposalMergeGateFtyTests.cs",
        'sourceId: "azurerm_linux_virtual_machine.main"\nsourceId: "azurerm_fty.main"',
        {"linux_virtual_machine"},
        set(),
    )
    assert any("azurerm_fty" in error for error in errors)


def test_repo_scan_is_clean() -> None:
    errors = catalog.scan(REPO_ROOT, remote=False)
    assert errors == [], errors


def main() -> int:
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
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
