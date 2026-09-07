#!/usr/bin/env python3
"""Unit tests for al-bug-verify-proven-revert.py (no real git/dotnet)."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

_SPEC = importlib.util.spec_from_file_location(
    "verifier",
    _AGENT_DIR / "al-bug-verify-proven-revert.py",
)
verifier = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["verifier"] = verifier
_SPEC.loader.exec_module(verifier)

import al_bug_ledger  # noqa: E402


def test_extract_test_citation_from_backticks() -> None:
    text = "`FindingJsonConverterTests.Reads_schema_version` — boolean coercion abcdef1"
    assert verifier.extract_test_citation(text) == "FindingJsonConverterTests.Reads_schema_version"


def test_extract_commit_sha() -> None:
    assert verifier.extract_commit_sha("merged in deadbeef1 2026-09-01") == "deadbeef1"


def test_is_excluded_revert_path() -> None:
    assert verifier.is_excluded_revert_path("ArchLucid.Core.Tests/FooTests.cs")
    assert verifier.is_excluded_revert_path("docs/library/AL_BUG_HUNT_LEDGER.md")
    assert not verifier.is_excluded_revert_path("ArchLucid.Core/Json/StrictSchemaVersionReader.cs")


def test_classify_after_test_run() -> None:
    assert verifier.classify_after_test_run(True) == "guarded"
    assert verifier.classify_after_test_run(False) == "unguarded"


def test_render_report_fixture() -> None:
    results = [
        verifier.RowVerification("zone-a", "row", "guarded", test_name="FooTests.Bar", commit_sha="abc1234"),
        verifier.RowVerification("zone-b", "row2", "unguarded", test_name="BarTests.Baz", commit_sha="def5678"),
    ]
    report = verifier.render_report(results)
    assert "Unguarded rows" in report
    assert "zone-b" in report


def test_fail_on_unguarded_exit_code() -> None:
    unguarded = verifier.RowVerification("z", "t", "unguarded")
    guarded = verifier.RowVerification("z", "t", "guarded")
    assert any(item.classification == "unguarded" for item in [unguarded])
    assert not any(item.classification == "unguarded" for item in [guarded])


def test_select_rows_since_filter() -> None:
    from datetime import datetime, timezone

    rows = [
        al_bug_ledger.ProvenRow("z", "old row 2020-01-01"),
        al_bug_ledger.ProvenRow("z", "new row 2026-09-05"),
    ]
    since = datetime(2026, 9, 1, tzinfo=timezone.utc)
    selected = verifier.select_rows(rows, None, since, 10)
    assert len(selected) == 1
    assert "2026-09-05" in selected[0].text


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
