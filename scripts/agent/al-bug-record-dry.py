#!/usr/bin/env python3
"""Mechanical dry-hunt recorder for /al-bug sequential runs when no open hypotheses remain."""

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


def run_pwsh(args: list[str]) -> str:
    result = subprocess.run(
        ["pwsh", "-NoProfile", "-File", str(args[0]), *args[1:]],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def pick_zone() -> dict:
    output = run_pwsh([PICKER, "-Preview"])
    line = output.strip().splitlines()[-1]
    return json.loads(line)


def rolling_stats() -> dict:
    output = run_pwsh([STATS, "-Rolling24h"])
    line = output.strip().splitlines()[-1]
    return json.loads(line)


def record_outcome(zone_id: str, outcome: str) -> dict:
    output = run_pwsh(
        [
            STATS,
            "-RecordHunt",
            "-HuntZoneId",
            zone_id,
            "-HuntOutcome",
            outcome,
            "-Rolling24h",
        ]
    )
    line = output.strip().splitlines()[-1]
    return json.loads(line)


def complete_sequential(zone_id: str, outcome: str, max_hunts: int) -> dict:
    output = run_pwsh(
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
    for line in output.strip().splitlines():
        if line.startswith("{") and "bugsFound24h" in line:
            return json.loads(line)
    return rolling_stats()


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


def update_ledger_hit(zone_id: str, bug_summary: str) -> None:
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
    updated = bump("bugs-found", updated)
    updated = re.sub(
        r"- \*\*consecutive-dry-hunts:\*\* \d+",
        "- **consecutive-dry-hunts:** 0",
        updated,
        count=1,
    )
    updated = re.sub(
        r"- \*\*last-hunt:\*\* .*",
        f"- **last-hunt:** {today}",
        updated,
        count=1,
    )
    updated = re.sub(
        r"- \*\*last-bug:\*\* .*",
        f"- **last-bug:** {today} — {bug_summary}",
        updated,
        count=1,
    )

    text = text[: match.start(1)] + updated + text[match.end(1) :]
    LEDGER.write_text(text, encoding="utf-8")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: al-bug-record-dry.py dry <zoneId> | stats", file=sys.stderr)
        return 1

    command = sys.argv[1]

    if command == "stats":
        stats = rolling_stats()
        print(json.dumps(stats))
        return 0

    if command == "dry" and len(sys.argv) >= 3:
        zone_id = sys.argv[2]
        update_ledger_dry(zone_id)
        stats = record_outcome(zone_id, "dry")
        print(json.dumps(stats))
        return 0

    if command == "pick":
        zone = pick_zone()
        print(json.dumps(zone))
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
