#!/usr/bin/env python3
"""Unit tests for al_bug_seed_preview_merge.py."""

from __future__ import annotations

import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_seed_preview_merge import (  # noqa: E402
    CandidateRow,
    SourcePriority,
    merge_candidates,
    parse_candidate_lines,
)


def test_same_path_line_deduped() -> None:
    mutant = CandidateRow(
        line="(candidate) mutant #1: X at ArchLucid.Application/Foo.cs:10 survived [class:other]",
        source=SourcePriority.MUTANT,
        dedup_key="ArchLucid.Application/Foo.cs:10",
    )
    analyzer = CandidateRow(
        line="(candidate) analyzer CA1000 at ArchLucid.Application/Foo.cs:10 — msg [class:other]",
        source=SourcePriority.ANALYZER,
        dedup_key="ArchLucid.Application/Foo.cs:10",
    )
    merged = merge_candidates([[mutant], [analyzer]])
    assert len(merged) == 1
    assert merged[0].startswith("(candidate) mutant")


def test_cap_fifteen() -> None:
    rows = [
        CandidateRow(
            line=f"(candidate) analyzer R at ArchLucid.Core/F{i}.cs:1 — m [class:other]",
            source=SourcePriority.ANALYZER,
            dedup_key=f"ArchLucid.Core/F{i}.cs:1",
        )
        for i in range(20)
    ]
    merged = merge_candidates([rows])
    assert len(merged) == 15


def test_empty_inputs() -> None:
    assert merge_candidates([]) == []


def test_parse_markdown_checkbox_lines() -> None:
    text = "- [ ] (candidate) flake FooTests.Bar (≥3/30d) — locus [class:other]\n"
    rows = parse_candidate_lines(text)
    assert len(rows) == 1
    assert rows[0].source == SourcePriority.FLAKE


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
