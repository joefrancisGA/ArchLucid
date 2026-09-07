#!/usr/bin/env python3
"""Unit tests for escape log mapping and validation."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_escape_log import (  # noqa: E402
    compute_zone_escape_stats,
    read_escape_log,
    suggest_zone_for_paths,
    validate_escape_log,
)
from al_bug_ledger import map_paths_to_zone_ids  # noqa: E402

FIXTURE_LEDGER = """# fixture

## Zone: topology-proposal-merge

- **id:** topology-proposal-merge
- **paths:** ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs

## Zone: other-zone

- **id:** other-zone
- **paths:** ArchLucid.Core/Foo.cs
"""


def test_map_paths_to_zone() -> None:
    zones = map_paths_to_zone_ids(
        FIXTURE_LEDGER,
        ["ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs"],
    )
    assert zones == ["topology-proposal-merge"]


def test_unzoned_path() -> None:
    assert suggest_zone_for_paths(FIXTURE_LEDGER, ["nowhere/Unknown.cs"]) == "unzoned"


def test_validate_escape_log_unknown_zone() -> None:
    path = Path("/tmp/test_escape.jsonl")
    line = {
        "at": "2026-09-01T00:00:00Z",
        "source": "al-defect",
        "zoneId": "missing-zone",
        "paths": ["a.cs"],
        "ref": "PD-999",
        "huntedInPriorDays": -1,
    }
    path.write_text(json.dumps(line) + "\n", encoding="utf-8")
    errors = validate_escape_log(path, FIXTURE_LEDGER)
    assert any("unknown zoneId" in err for err in errors)


def test_escape_rate_computation() -> None:
    now = datetime(2026, 9, 7, tzinfo=timezone.utc)
    escapes = read_escape_log(Path("/dev/null"))
    escapes = [
        type(
            "E",
            (),
            {
                "zone_id": "topology-proposal-merge",
                "at": "2026-09-01T00:00:00Z",
            },
        )()
    ]
    from al_bug_escape_log import EscapeEntry

    escapes = [
        EscapeEntry(
            at="2026-09-01T00:00:00Z",
            source="ci",
            zone_id="topology-proposal-merge",
            paths=("a.cs",),
            ref="ci-run",
            hunted_in_prior_days=3,
        )
    ]
    hunts = [
        {"at": "2026-09-02T00:00:00Z", "zoneId": "topology-proposal-merge", "outcome": "hit"},
        {"at": "2026-09-03T00:00:00Z", "zoneId": "topology-proposal-merge", "outcome": "dry"},
    ]
    count, rate = compute_zone_escape_stats(escapes, hunts, "topology-proposal-merge", now)
    assert count == 1
    assert rate == 0.5


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
