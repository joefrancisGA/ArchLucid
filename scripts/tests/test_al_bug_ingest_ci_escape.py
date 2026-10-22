#!/usr/bin/env python3
"""Unit tests for ABQ-30 CI escape ingest."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_escape_log import EscapeEntry, validate_escape_log  # noqa: E402
import importlib.util

_SPEC = importlib.util.spec_from_file_location("ingest", _AGENT_DIR / "al-bug-ingest-ci-escape.py")
ingest = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["ingest"] = ingest
_SPEC.loader.exec_module(ingest)

FIXTURE_LEDGER = """# fixture

## Zone: topology-proposal-merge

- **id:** topology-proposal-merge
- **paths:** ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs

## Zone: other-zone

- **id:** other-zone
- **paths:** ArchLucid.Core/Foo.cs
"""


def test_path_under_topology_zone() -> None:
    now = datetime(2026, 9, 7, tzinfo=timezone.utc)
    hunts = [{"at": "2026-09-01T00:00:00Z", "zoneId": "topology-proposal-merge", "outcome": "hit"}]
    payloads = ingest.build_escape_payloads(
        ledger_text=FIXTURE_LEDGER,
        paths=["ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs"],
        check_name="dotnet-fast-core",
        run_url="https://example.invalid/runs/1",
        hunt_entries=hunts,
        now_utc=now,
    )
    assert len(payloads) == 1
    assert payloads[0]["zoneId"] == "topology-proposal-merge"
    assert payloads[0]["source"] == "ci"
    assert payloads[0]["huntedInPriorDays"] == 6


def test_unknown_path_skips() -> None:
    payloads = ingest.build_escape_payloads(
        ledger_text=FIXTURE_LEDGER,
        paths=["nowhere/Unknown.cs"],
        check_name="x",
        run_url="https://example.invalid/runs/1",
        hunt_entries=[],
        now_utc=datetime(2026, 9, 7, tzinfo=timezone.utc),
    )
    assert payloads == []


def test_dry_run_does_not_write(tmp_path: Path | None = None) -> None:
    target = Path("/tmp/al-bug-ingest-dry-run.jsonl")
    if target.exists():
        target.unlink()
    payloads = [
        {
            "at": "2026-09-07T00:00:00Z",
            "source": "ci",
            "zoneId": "topology-proposal-merge",
            "paths": ["a.cs"],
            "ref": "https://example.invalid/runs/1 x",
            "huntedInPriorDays": -1,
        }
    ]
    written = ingest.append_or_print(payloads, target, dry_run=True)
    assert len(written) == 1
    assert not target.exists()


def test_duplicate_ref_zone_day_not_rewritten() -> None:
    target = Path("/tmp/al-bug-ingest-dup.jsonl")
    line = {
        "at": "2026-09-07T01:00:00Z",
        "source": "ci",
        "zoneId": "topology-proposal-merge",
        "paths": ["a.cs"],
        "ref": "https://example.invalid/runs/1 x",
        "huntedInPriorDays": -1,
    }
    target.write_text(json.dumps(line) + "\n", encoding="utf-8")
    written = ingest.append_or_print([line], target, dry_run=False)
    assert written == []
    assert target.read_text(encoding="utf-8").count("\n") == 1


def test_malformed_jsonl_still_fails_lint() -> None:
    path = Path("/tmp/al-bug-ingest-bad.jsonl")
    path.write_text("{not json\n", encoding="utf-8")
    errors = validate_escape_log(path, FIXTURE_LEDGER)
    assert any("invalid JSON" in err for err in errors)


def test_cli_dry_run_unknown_job_exits_zero(tmp_path_factory=None) -> None:
    code = ingest.main(
        [
            "--check-name",
            "unknown-job",
            "--run-url",
            "https://example.invalid/runs/9",
            "--job-map",
            str(_AGENT_DIR / "al-bug-ci-test-to-paths.json"),
            "--ledger",
            "/dev/null",
            "--dry-run",
        ]
    )
    # /dev/null ledger would fail read — use skip path before ledger when no paths
    assert code == 0


def test_newly_mapped_openapi_job_recovers_api_path() -> None:
    paths = ingest.resolve_paths(
        [],
        [".NET: OpenAPI v1 contract snapshot (fail-fast)"],
        *ingest.load_job_map(_AGENT_DIR / "al-bug-ci-test-to-paths.json"),
    )
    assert "ArchLucid.Api/" in paths


def test_azure_extractor_pester_not_mapped() -> None:
    job_map, prefix_map = ingest.load_job_map(_AGENT_DIR / "al-bug-ci-test-to-paths.json")
    assert "Azure extractor: Get-ArchLucidAzurePackage Pester (mock ARM)" not in job_map
    paths = ingest.resolve_paths(
        [],
        ["Azure extractor: Get-ArchLucidAzurePackage Pester (mock ARM)"],
        job_map,
        prefix_map,
    )
    assert paths == []


def test_paste_helper_does_not_write_escape_log() -> None:
    target = Path("/tmp/al-bug-ingest-paste.jsonl")
    if target.exists():
        target.unlink()
    code = ingest.main(
        [
            "--check-name",
            "dotnet-fast-core",
            "--run-url",
            "https://example.invalid/runs/2",
            "--paths",
            "ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs",
            "--ledger",
            str(_AGENT_DIR.parents[1] / "docs/library/AL_BUG_HUNT_LEDGER.md"),
            "--escape-log",
            str(target),
            "--paste",
            "--dry-run",
        ]
    )
    assert code == 0
    assert not target.exists()


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
        except Exception as exc:
            failures += 1
            print(f"ERROR {name}: {exc}")
    print(f"\n{failures} failure(s)")
    raise SystemExit(1 if failures else 0)
