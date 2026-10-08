#!/usr/bin/env python3
"""Validate structured rate-limit observations from the private-beta smoke lane."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.private-beta-rate-limit-diagnostics.v1"


def _as_non_negative_number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    return number if number >= 0 else None


def evaluate_observations(observations: list[dict[str, Any]]) -> dict[str, Any]:
    issues: list[str] = []
    normalized: list[dict[str, Any]] = []

    for index, observation in enumerate(observations):
        status = observation.get("status")
        identity = str(observation.get("identity") or "").strip()
        retry_after = _as_non_negative_number(observation.get("retryAfterSeconds"))
        budget_remaining = _as_non_negative_number(observation.get("retryBudgetRemaining"))
        budget_limit = _as_non_negative_number(observation.get("retryBudgetLimit"))

        if not identity:
            issues.append(f"observation {index}: rate-limit identity is missing")

        if status == 429 and retry_after is None:
            issues.append(f"observation {index}: 429 response is missing Retry-After")

        if budget_limit is not None and budget_remaining is not None:

            if budget_remaining > budget_limit:
                issues.append(f"observation {index}: retry budget remaining exceeds its limit")

            if budget_remaining == 0:
                issues.append(f"observation {index}: retry budget is exhausted")

        normalized.append(
            {
                "status": status,
                "identity": identity or None,
                "retryAfterSeconds": retry_after,
                "retryBudgetRemaining": budget_remaining,
                "retryBudgetLimit": budget_limit,
            }
        )

    return {
        "schema": _SCHEMA,
        "observationCount": len(normalized),
        "rateLimitedCount": sum(1 for item in normalized if item["status"] == 429),
        "disposition": "PASS" if not issues else "HOLD",
        "issues": issues,
        "observations": normalized,
    }


def load_observations(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if isinstance(payload, list):
        raw_observations = payload
    elif isinstance(payload, dict) and isinstance(payload.get("observations"), list):
        raw_observations = payload["observations"]
    else:
        raise ValueError("input must be an array or an object with an observations array")

    if not all(isinstance(item, dict) for item in raw_observations):
        raise ValueError("every observation must be an object")

    return raw_observations


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observations-json", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    try:
        summary = evaluate_observations(load_observations(args.observations_json))
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"private-beta rate-limit diagnostics: {summary['disposition']}")
    return 0 if summary["disposition"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
