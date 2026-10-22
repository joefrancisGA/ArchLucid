#!/usr/bin/env python3
"""Run sequential /al-bug dry hunts when zones have no open hypotheses."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEDGER = REPO_ROOT / "docs/library/AL_BUG_HUNT_LEDGER.md"
PICKER = REPO_ROOT / "scripts/agent/al-bug-pick-zone.ps1"
STATS = REPO_ROOT / "scripts/agent/al-bug-rolling-stats.ps1"
SEQUENTIAL = REPO_ROOT / "scripts/agent/al-bug-sequential-run.ps1"
STATE = REPO_ROOT / "scripts/agent/.al-bug-sequential-state.json"


def run_pwsh(args: list[str]) -> str:
    result = subprocess.run(
        ["pwsh", "-NoProfile", "-File", str(args[0]), *args[1:]],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def read_state() -> dict:
    if not STATE.exists():
        return {"attempt": 0, "maxHunts": 100}
    return json.loads(STATE.read_text(encoding="utf-8"))


def extract_json(stdout: str) -> dict:
    for line in reversed(stdout.strip().splitlines()):
        stripped = line.strip()
        if stripped.startswith("{") and stripped.endswith("}"):
            return json.loads(stripped)

    start = stdout.rfind("{")
    if start >= 0:
        return json.loads(stdout[start:])

    raise ValueError(f"No JSON object in output: {stdout[:200]}")


def pick_zone() -> dict:
    output = run_pwsh([PICKER, "-Preview"])
    return extract_json(output)


def update_ledger_dry(zone_id: str) -> None:
    text = LEDGER.read_text(encoding="utf-8")
    pattern = rf"(## Zone: {re.escape(zone_id)}\n.*?)(?=\n## Zone: |\Z)"
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        raise ValueError(f"Zone {zone_id} not found in ledger")

    section = match.group(1)
    today = date.today().isoformat()

    def bump(field: str, section_text: str) -> str:
        field_pattern = rf"(- \*\*{field}:\*\* )(\d+)"
        field_match = re.search(field_pattern, section_text)
        if not field_match:
            raise ValueError(f"Field {field} missing in zone {zone_id}")
        value = int(field_match.group(2)) + 1
        return re.sub(field_pattern, rf"\g<1>{value}", section_text, count=1)

    updated = bump("hunts", section)
    updated = bump("consecutive-dry-hunts", updated)
    updated = re.sub(
        r"- \*\*last-hunt:\*\* .*",
        f"- **last-hunt:** {today}",
        updated,
        count=1,
    )

    text = text[: match.start(1)] + updated + text[match.end(1) :]
    LEDGER.write_text(text, encoding="utf-8")


def rolling_stats() -> dict:
    output = run_pwsh([STATS, "-Rolling24h"])
    return extract_json(output)


def complete_hunt(zone_id: str, outcome: str, max_hunts: int) -> dict:
    run_pwsh(
        [
            SEQUENTIAL,
            "-CompleteHunt",
            "-HuntZoneId",
            zone_id,
            "-HuntOutcome",
            outcome,
            "-MaxHunts",
            str(max_hunts),
        ]
    )
    return rolling_stats()


def paths_exist(zone: dict) -> bool:
    for rel in zone.get("paths", []):
        path = REPO_ROOT / rel.replace("/", "/")
        if not path.exists():
            return False
    return True


def run_dry_hunt(max_hunts: int) -> dict:
    state = read_state()
    if state.get("attempt", 0) >= max_hunts:
        return {"done": True, "attempt": state.get("attempt", 0)}

    zone = pick_zone()
    zone_id = zone["zoneId"]

    if zone.get("exhaustedAll"):
        return {"done": True, "exhaustedAll": True}

    if zone.get("seedHunt"):
        return {"skipped": True, "reason": "seed hunt requires agent", "zoneId": zone_id}

    open_h = zone.get("openHypotheses") or []
    hunt_ready = zone.get("huntReadyHypotheses") or []

    if len(open_h) > 0 or len(hunt_ready) > 0:
        return {"skipped": True, "reason": "open hypotheses require agent", "zoneId": zone_id}

    if not paths_exist(zone):
        return {"skipped": True, "reason": "paths missing", "zoneId": zone_id}

    update_ledger_dry(zone_id)
    stats = complete_hunt(zone_id, "dry", max_hunts)
    state = read_state()

    return {
        "attempt": state.get("attempt", 0),
        "zoneId": zone_id,
        "outcome": "dry",
        "bugsFound24h": stats.get("bugsFound24h"),
        "dryRuns24h": stats.get("dryRuns24h"),
    }


def main() -> int:
    max_hunts = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    remaining = int(sys.argv[2]) if len(sys.argv) > 2 else 1

    for _ in range(remaining):
        result = run_dry_hunt(max_hunts)
        print(json.dumps(result))
        if result.get("done") or result.get("skipped"):
            if result.get("skipped"):
                return 2
            return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
