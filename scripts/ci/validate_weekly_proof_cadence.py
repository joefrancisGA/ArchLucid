#!/usr/bin/env python3
"""Validate weekly proof-cadence checklist JSON against the v1 schema."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_SCHEMA_PATH = Path(__file__).resolve().parent / "data" / "weekly_proof_cadence_schema.v1.json"
_PAYLOAD_SCHEMA = "archlucid.weekly-proof-cadence.v1"


def load_schema() -> dict[str, Any]:
    return json.loads(_SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_payload(payload: dict[str, Any], schema: dict[str, Any] | None = None) -> list[str]:
    schema = schema or load_schema()
    errors: list[str] = []

    if payload.get("schema") != _PAYLOAD_SCHEMA:
        errors.append(f"schema must be {_PAYLOAD_SCHEMA}")

    for field in schema.get("requiredFields") or []:
        if field not in payload:
            errors.append(f"missing required field: {field}")

    gates = payload.get("gates")

    if not isinstance(gates, dict):
        errors.append("gates must be an object")
    else:
        allowed_statuses = set(schema.get("allowedGateStatuses") or [])

        for gate_id in schema.get("gateIds") or []:
            row = gates.get(gate_id)

            if not isinstance(row, dict):
                errors.append(f"gates.{gate_id} must be an object")
                continue

            status = str(row.get("status") or "").upper()

            if status not in allowed_statuses:
                errors.append(f"gates.{gate_id}.status invalid: {status!r}")

            if not str(row.get("reason") or "").strip():
                errors.append(f"gates.{gate_id}.reason is required")

    overall = str(payload.get("overallDisposition") or "").upper()
    allowed_overall = set(schema.get("allowedOverallDispositions") or [])

    if overall not in allowed_overall:
        errors.append(f"overallDisposition invalid: {overall!r}")

    run_ids = payload.get("runIdsReferenced")

    if not isinstance(run_ids, list):
        errors.append("runIdsReferenced must be an array")

    mode_summary = payload.get("executionModeSummary")

    if not isinstance(mode_summary, dict):
        errors.append("executionModeSummary must be an object")

    freshness = payload.get("evidenceFreshness")

    if not isinstance(freshness, dict):
        errors.append("evidenceFreshness must be an object")

    if not isinstance(payload.get("missingRealModeEvidence"), bool):
        errors.append("missingRealModeEvidence must be boolean")

    stage1 = str(payload.get("stage1Readiness") or "").upper()
    allowed_stage1 = set(schema.get("allowedStage1Readiness") or [])

    if stage1 not in allowed_stage1:
        errors.append(f"stage1Readiness invalid: {stage1!r}")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cadence-json", type=Path, required=True)
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args(argv)

    payload = json.loads(args.cadence_json.read_text(encoding="utf-8"))
    errors = validate_payload(payload)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print(f"Weekly proof cadence valid: {args.cadence_json}")
    overall = str(payload.get("overallDisposition") or "").upper()

    if args.strict and overall in {"HOLD"}:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
