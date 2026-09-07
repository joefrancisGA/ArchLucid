#!/usr/bin/env python3
"""Unit tests for ABQ-31 flake log."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_flake_log import (  # noqa: E402
    FlakeEntry,
    seed_candidates,
    validate_flake_log,
)

FIXTURE_LEDGER = """# fixture

## Zone: application-commit

- **id:** application-commit
- **paths:** ArchLucid.Application/Runs/
"""


def _entry(at: str, test: str = "FooTests.Race") -> FlakeEntry:
    return FlakeEntry(
        at=at,
        test=test,
        job="CI",
        ref="https://example.invalid/1",
        paths=("ArchLucid.Application/Runs/CommitRunIdempotencyCoordinator.cs",),
        zone_id="application-commit",
        attempts=2,
    )


def test_three_events_in_30d_become_candidate() -> None:
    now = datetime(2026, 9, 7, tzinfo=timezone.utc)
    entries = [
        _entry("2026-08-20T00:00:00Z"),
        _entry("2026-08-25T00:00:00Z"),
        _entry("2026-09-01T00:00:00Z"),
    ]
    lines = seed_candidates(entries, now)
    assert len(lines) == 1
    assert "FooTests.Race" in lines[0]
    assert "state-machine-gap" in lines[0]


def test_two_events_are_not_candidates() -> None:
    now = datetime(2026, 9, 7, tzinfo=timezone.utc)
    entries = [_entry("2026-08-20T00:00:00Z"), _entry("2026-09-01T00:00:00Z")]
    assert seed_candidates(entries, now) == []


def test_event_31_days_ago_dropped() -> None:
    now = datetime(2026, 9, 7, tzinfo=timezone.utc)
    entries = [
        _entry("2026-08-06T00:00:00Z"),
        _entry("2026-08-25T00:00:00Z"),
        _entry("2026-09-01T00:00:00Z"),
    ]
    assert seed_candidates(entries, now) == []


def test_empty_log_valid(tmp_path: Path | None = None) -> None:
    path = Path("/tmp/al-bug-empty-flake.jsonl")
    path.write_text("", encoding="utf-8")
    assert validate_flake_log(path, FIXTURE_LEDGER) == []
    missing = Path("/tmp/al-bug-missing-flake.jsonl")
    if missing.exists():
        missing.unlink()
    assert validate_flake_log(missing, FIXTURE_LEDGER) == []


def test_unknown_zone_lint_error() -> None:
    path = Path("/tmp/al-bug-bad-zone-flake.jsonl")
    line = {
        "at": "2026-09-01T00:00:00Z",
        "test": "T",
        "job": "CI",
        "ref": "r",
        "paths": [],
        "zoneId": "missing-zone",
        "attempts": 2,
    }
    path.write_text(json.dumps(line) + "\n", encoding="utf-8")
    errors = validate_flake_log(path, FIXTURE_LEDGER)
    assert any("unknown zoneId" in err for err in errors)


def test_unzoned_is_allowed() -> None:
    path = Path("/tmp/al-bug-unzoned-flake.jsonl")
    line = {
        "at": "2026-09-01T00:00:00Z",
        "test": "T",
        "job": "CI",
        "ref": "r",
        "paths": [],
        "zoneId": "unzoned",
        "attempts": 2,
    }
    path.write_text(json.dumps(line) + "\n", encoding="utf-8")
    assert validate_flake_log(path, FIXTURE_LEDGER) == []


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
