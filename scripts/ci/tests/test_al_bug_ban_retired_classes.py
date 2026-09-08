#!/usr/bin/env python3
"""Unit tests for ABQ-32 retired-class CI bans."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
_SPEC = importlib.util.spec_from_file_location(
    "retired_bans",
    REPO_ROOT / "scripts/ci/al-bug-ban-retired-classes.py",
)
bans = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["retired_bans"] = bans
_SPEC.loader.exec_module(bans)


def test_new_tryparse_body_outside_allowlist_fails() -> None:
    text = """
public static class Copy
{
    public static bool TryParseBooleanString(string? raw, out bool value)
    {
        value = false;
        return false;
    }
}
"""
    assert bans.check_text_boolean_definition(text) is True


def test_call_site_is_not_a_definition() -> None:
    text = """
if (JsonBooleanStringReader.TryParseBooleanString(raw, out bool boolean))
{
    return boolean;
}
"""
    assert bans.check_text_boolean_definition(text) is False


def test_allowlisted_delegate_passes(tmp_path: Path | None = None) -> None:
    allowlist = {
        "ArchLucid.Core/Json/JsonBooleanStringReader.cs",
        "ArchLucid.Core/Explanation/RunExplanationAggregateJsonReader.TextTokens.cs",
        "ArchLucid.Core/Findings/Serialization/FindingJsonConverter.Primitives.cs",
        "ArchLucid.Core/Persistence/RunHeaderAnchorJsonComparer.cs",
        "ArchLucid.Core/AzureExtractor/AzureExtractorSensitivePropertyRedactor.cs",
        "ArchLucid.Core/Configuration/Summary/ConfigurationSensitiveConfigPathMatcher.cs",
    }
    errors = bans.find_boolean_coercion_violations(REPO_ROOT, allowlist)
    assert errors == []


def test_repo_scan_is_clean() -> None:
    allowlist = bans.load_allowlist(bans.DEFAULT_ALLOWLIST)
    errors = bans.scan(REPO_ROOT, allowlist)
    assert errors == [], errors


def test_pester3_should_be_detected() -> None:
    text = '$actual | Should Be $expected'
    assert bans.PESTER3_SHOULD_BE.search(text) is not None
    ok = '$actual | Should -Be $expected'
    assert bans.PESTER3_SHOULD_BE.search(ok) is None


def test_embedded_fragment_detected() -> None:
    text = "if (IsEmbeddedSensitiveFragment(token)) { }"
    assert bans.EMBEDDED_FRAGMENT.search(text) is not None


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
