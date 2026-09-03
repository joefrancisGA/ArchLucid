#!/usr/bin/env python3
"""Validate ship-gate-evidence JSON artifacts produced by `archlucid pilot ship-gate-evidence`."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ALLOWED_VERDICTS = frozenset({"Pass", "Fail", "Unknown"})
REQUIRED_TOP_LEVEL_KEYS = frozenset(
    {
        "baseUrl",
        "runId",
        "generatedUtc",
        "gates",
    },
)
REQUIRED_GATE_KEYS = frozenset({"gateNumber", "name", "verdict", "evidence"})


def _is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and value.strip() != ""


def validate_ship_gate_evidence_document(document: dict[str, Any]) -> list[str]:
    issues: list[str] = []

    missing = REQUIRED_TOP_LEVEL_KEYS - set(document.keys())

    if missing:
        issues.append(f"Missing required keys: {sorted(missing)}")

    if not _is_non_empty_string(document.get("runId")):
        issues.append("runId must be a non-empty string.")

    gates = document.get("gates")

    if not isinstance(gates, list) or len(gates) == 0:
        issues.append("gates must be a non-empty array.")

        return issues

    for index, gate in enumerate(gates):
        if not isinstance(gate, dict):
            issues.append(f"gates[{index}] must be an object.")

            continue

        gate_missing = REQUIRED_GATE_KEYS - set(gate.keys())

        if gate_missing:
            issues.append(f"gates[{index}] missing keys: {sorted(gate_missing)}")

        verdict = gate.get("verdict")

        if verdict not in ALLOWED_VERDICTS:
            issues.append(f"gates[{index}].verdict must be one of {sorted(ALLOWED_VERDICTS)}.")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate ship-gate-evidence JSON schema.")
    parser.add_argument("path", type=Path, help="Path to ship-gate-evidence.json")
    args = parser.parse_args()

    try:
        document = json.loads(args.path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"Unable to read JSON: {error}", file=sys.stderr)

        return 1

    if not isinstance(document, dict):
        print("Root document must be a JSON object.", file=sys.stderr)

        return 1

    issues = validate_ship_gate_evidence_document(document)

    if issues:
        for issue in issues:
            print(issue, file=sys.stderr)

        return 1

    print(f"OK: {args.path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
