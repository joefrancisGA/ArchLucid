#!/usr/bin/env python3
"""Audit canonical finding fields across two or more JSON surfaces."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

FIELDS = ("title", "severity", "category", "engineType", "policyRuleId")


def _index(payload: dict) -> dict[str, dict]:
    rows = payload.get("findings", payload if isinstance(payload, list) else [])
    if not isinstance(rows, list):
        raise ValueError("surface must be a list or an object with a findings array")
    return {
        str(row.get("findingId")): row
        for row in rows
        if isinstance(row, dict) and row.get("findingId")
    }


def audit(surfaces: list[tuple[str, dict]]) -> list[dict]:
    indexed = [(name, _index(payload)) for name, payload in surfaces]
    all_ids = sorted({finding_id for _, index in indexed for finding_id in index})
    issues: list[dict] = []

    for finding_id in all_ids:
        present = [(name, index[finding_id]) for name, index in indexed if finding_id in index]
        if len(present) != len(indexed):
            issues.append({
                "code": "MISSING_FROM_SURFACE",
                "findingId": finding_id,
                "presentOn": [name for name, _ in present],
            })
            continue

        for field in FIELDS:
            values = {json.dumps(row.get(field), sort_keys=True) for _, row in present}
            if len(values) > 1:
                issues.append({
                    "code": "FIELD_DISAGREEMENT",
                    "findingId": finding_id,
                    "field": field,
                    "values": {name: row.get(field) for name, row in present},
                })

    return issues


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("surfaces", nargs="+", type=Path)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    loaded = [(path.name, json.loads(path.read_text(encoding="utf-8"))) for path in args.surfaces]
    issues = audit(loaded)
    print(json.dumps({"schemaVersion": 1, "issueCount": len(issues), "issues": issues}, indent=2))
    return 1 if args.enforce and issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
