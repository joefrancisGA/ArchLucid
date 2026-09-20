#!/usr/bin/env python3
"""Risk-weighted bug-discovery and QA-zone saturation metrics."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

SEVERITY_WEIGHT = {"critical": 8, "high": 5, "medium": 3, "low": 1}


def summarize(records: list[dict]) -> dict:
    confirmed = [row for row in records if row.get("confirmed", True)]
    unique = [row for row in confirmed if not row.get("duplicateOf")]
    duplicates = len(confirmed) - len(unique)
    hours = sum(float(row.get("hours", 0)) for row in confirmed)
    cost = sum(float(row.get("costUsd", 0)) for row in confirmed)

    by_zone: dict[str, list[dict]] = defaultdict(list)
    for row in unique:
        by_zone[str(row.get("zone", "unclassified"))].append(row)

    zone_rows = []
    for zone, rows in sorted(by_zone.items()):
        weighted = sum(
            SEVERITY_WEIGHT.get(str(row.get("severity", "low")).lower(), 1)
            * (2 if row.get("credibilityDefect") else 1)
            for row in rows
        )
        zone_rows.append({
            "zone": zone,
            "uniqueDefects": len(rows),
            "credibilityDefects": sum(1 for row in rows if row.get("credibilityDefect")),
            "riskWeightedDefectPoints": weighted,
        })

    discoverers = Counter(str(row.get("discoveredBy", "unknown")) for row in unique)
    return {
        "schemaVersion": 1,
        "confirmedDefects": len(confirmed),
        "uniqueDefects": len(unique),
        "duplicateDefects": duplicates,
        "duplicateRate": round(duplicates / len(confirmed), 6) if confirmed else 0.0,
        "uniqueDefectsPerHour": round(len(unique) / hours, 6) if hours else None,
        "costPerUniqueDefectUsd": round(cost / len(unique), 6) if unique else None,
        "credibilityDefects": sum(1 for row in unique if row.get("credibilityDefect")),
        "discovererUniqueYield": dict(sorted(discoverers.items())),
        "zones": zone_rows,
        "saturatedZones": [
            row["zone"] for row in zone_rows
            if row["uniqueDefects"] == 0
        ],
        "note": "Zero recent defects is evidence only for the sampled hunt process; it is not proof of zero residual defects.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("ledger", type=Path)
    args = parser.parse_args(argv)
    payload = json.loads(args.ledger.read_text(encoding="utf-8"))
    records = payload.get("defects", payload if isinstance(payload, list) else [])
    print(json.dumps(summarize(records), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
