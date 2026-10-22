#!/usr/bin/env python3
"""Validate a captured private-beta spend-freeze configuration snapshot."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def _read_snapshot(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("snapshot root must be an object")

    return payload


def _nested_value(payload: dict[str, Any], *keys: str) -> Any:
    current: Any = payload

    for key in keys:
        if not isinstance(current, dict):
            return None

        current = current.get(key)

    return current


def validate_snapshot(payload: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    api_mode = _nested_value(payload, "api", "executionMode")
    worker_mode = _nested_value(payload, "worker", "executionMode")
    anonymous_execution = payload.get("anonymousExecutionEnabled")
    response_mode = _nested_value(payload, "controlledResponse", "mode")
    correlation_id = _nested_value(payload, "controlledResponse", "correlationId")

    if str(api_mode).lower() != "simulator":
        issues.append("api.executionMode must be Simulator")

    if str(worker_mode).lower() != "simulator":
        issues.append("worker.executionMode must be Simulator")

    if anonymous_execution is not False:
        issues.append("anonymousExecutionEnabled must be false")

    if str(response_mode).lower() != "simulator":
        issues.append("controlledResponse.mode must be Simulator")

    if not isinstance(correlation_id, str) or not correlation_id.strip():
        issues.append("controlledResponse.correlationId must be non-empty")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshot", type=Path)
    args = parser.parse_args()

    try:
        issues = validate_snapshot(_read_snapshot(args.snapshot))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"ERROR: unable to read spend-freeze snapshot: {error}", file=sys.stderr)
        return 1

    if issues:
        for issue in issues:
            print(f"ERROR: {issue}", file=sys.stderr)

        return 1

    print("Private-beta spend freeze: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
