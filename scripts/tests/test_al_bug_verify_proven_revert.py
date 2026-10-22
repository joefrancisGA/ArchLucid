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


def test_new_unguarded_minus_baseline() -> None:
    baseline = {"zone-b|BarTests.Baz|def5678"}
    results = [
        verifier.RowVerification("zone-a", "row", "unguarded", test_name="FooTests.Bar", commit_sha="abc1234"),
        verifier.RowVerification("zone-b", "row2", "unguarded", test_name="BarTests.Baz", commit_sha="def5678"),
        verifier.RowVerification("zone-c", "row3", "could-not-run", test_name="SkipTests.X", commit_sha="aaa1111"),
    ]
    fresh = verifier.new_unguarded_keys(results, baseline)
    assert fresh == ["zone-a|FooTests.Bar|abc1234"]
    assert verifier.unguarded_key(results[1]) in baseline


def test_could_not_run_is_not_new_unguarded() -> None:
    results = [
        verifier.RowVerification("z", "t", "could-not-run", test_name="FooTests.Bar", commit_sha="abc1234"),
        verifier.RowVerification("z", "t", "no-test-cited"),
        verifier.RowVerification("z", "t", "no-commit-cited"),
    ]
    assert verifier.new_unguarded_keys(results, set()) == []


def test_fail_on_unguarded_still_detects_any() -> None:
    unguarded = verifier.RowVerification("z", "t", "unguarded", test_name="T", commit_sha="abc1234")
    assert any(item.classification == "unguarded" for item in [unguarded])


def test_uncheckable_key_in_baseline_exits_zero_logic() -> None:
    baseline = {"zone-a|no-test-cited||"}
    results = [verifier.RowVerification("zone-a", "row", "no-test-cited")]
    assert verifier.new_uncheckable_keys(results, baseline) == []


def test_extra_no_test_cited_is_new_uncheckable() -> None:
    results = [verifier.RowVerification("zone-a", "row", "no-test-cited")]
    assert verifier.new_uncheckable_keys(results, set()) == ["zone-a|no-test-cited||"]


def test_could_not_run_in_new_uncheckable() -> None:
    results = [
        verifier.RowVerification(
            "zone-a",
            "row",
            "could-not-run",
            test_name="FooTests.Bar",
            commit_sha="abc1234",
        )
    ]
    fresh = verifier.new_uncheckable_keys(results, set())
    assert fresh == ["zone-a|could-not-run|FooTests.Bar|abc1234"]


def test_unguarded_ratchet_ignores_uncheckable() -> None:
    results = [verifier.RowVerification("z", "t", "no-test-cited")]
    assert verifier.new_unguarded_keys(results, set()) == []


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
