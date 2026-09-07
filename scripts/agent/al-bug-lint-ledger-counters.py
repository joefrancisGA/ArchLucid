#!/usr/bin/env python3
"""Fail when non-retired hunt zones claim bugs-found > hunts."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LEDGER_PATH = REPO_ROOT / "docs/library/AL_BUG_HUNT_LEDGER.md"

RETIRED_COUNTER_ALLOWLIST = frozenset(
    {
        "archlucid-core",
        "api-governance-tenancy-controllers",
    }
)

FIELD_HUNTS = re.compile(r"^\s*-\s+\*\*hunts:\*\*\s+(\d+)\s*$", re.MULTILINE)
FIELD_BUGS = re.compile(r"^\s*-\s+\*\*bugs-found:\*\*\s+(\d+)\s*$", re.MULTILINE)
FIELD_ID = re.compile(r"^\s*-\s+\*\*id:\*\*\s+(.+?)\s*$", re.MULTILINE)


@dataclass(frozen=True)
class ZoneCounters:
    zone_id: str
    hunts: int
    bugs_found: int

    @property
    def effective_bugs(self) -> int:
        if self.hunts <= 0:
            return 0

        return min(self.bugs_found, self.hunts)

    @property
    def invariant_violating(self) -> bool:
        return self.hunts > 0 and self.bugs_found > self.hunts


def parse_zone_counters(ledger_text: str) -> list[ZoneCounters]:
    zones: list[ZoneCounters] = []
    parts = re.split(r"(?m)^## Zone:", ledger_text)

    for part in parts:
        id_match = FIELD_ID.search(part)
        hunts_match = FIELD_HUNTS.search(part)
        bugs_match = FIELD_BUGS.search(part)

        if not id_match or not hunts_match or not bugs_match:
            continue

        zones.append(
            ZoneCounters(
                zone_id=id_match.group(1).strip(),
                hunts=int(hunts_match.group(1)),
                bugs_found=int(bugs_match.group(1)),
            )
        )

    return zones


def lint_ledger(ledger_text: str) -> tuple[list[ZoneCounters], list[ZoneCounters]]:
    violations: list[ZoneCounters] = []
    retired_violations: list[ZoneCounters] = []

    for zone in parse_zone_counters(ledger_text):
        if not zone.invariant_violating:
            continue

        if zone.zone_id in RETIRED_COUNTER_ALLOWLIST:
            retired_violations.append(zone)
        else:
            violations.append(zone)

    return violations, retired_violations


def print_report(zones: list[ZoneCounters], violations: list[ZoneCounters], retired: list[ZoneCounters]) -> None:
    total_hunts = sum(zone.hunts for zone in zones)
    total_bugs = sum(zone.bugs_found for zone in zones)
    total_effective = sum(zone.effective_bugs for zone in zones)
    violating_open = len(violations)

    print(
        f"zones={len(zones)} hunts={total_hunts} bugs-found={total_bugs} "
        f"effective-bugs={total_effective} invariant-violating-open={violating_open} "
        f"retired-footnotes={len(retired)}"
    )

    if retired:
        print("retired mega-zones (allowed historical inflation; do not rewrite bugs-found):")
        for zone in retired:
            print(f"  - {zone.zone_id}: hunts={zone.hunts} bugs-found={zone.bugs_found}")

    if violations:
        print("open zones with bugs-found > hunts:")
        for zone in sorted(violations, key=lambda z: z.bugs_found - z.hunts, reverse=True):
            print(
                f"  - {zone.zone_id}: hunts={zone.hunts} bugs-found={zone.bugs_found} "
                f"effective-bugs={zone.effective_bugs}"
            )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--ledger",
        type=Path,
        default=LEDGER_PATH,
        help="Path to AL_BUG_HUNT_LEDGER.md",
    )
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Print the report but exit 0 even when open zones violate the invariant.",
    )
    args = parser.parse_args()

    ledger_text = args.ledger.read_text(encoding="utf-8")
    zones = parse_zone_counters(ledger_text)
    violations, retired = lint_ledger(ledger_text)
    print_report(zones, violations, retired)

    if violations and not args.report_only:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
