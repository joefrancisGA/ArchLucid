#!/usr/bin/env python3
"""Evaluate first-pilot step latencies against owner soft/hard performance budgets."""

from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

EXECUTION_BUDGETS: dict[str, dict[str, int]] = {
    "Simulator": {"softP95Seconds": 300, "hardP95Seconds": 480},
    "Real": {"softP95Seconds": 900, "hardP95Seconds": 1500},
}

READINESS_NOTE = (
    "Readiness check only — not an SLA, capacity proof, or production availability claim."
)


def _percentile(values: list[float], percentile: float) -> float:
    if not values:
        return 0.0

    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, math.ceil(percentile * len(ordered)) - 1))
    return ordered[index]


def _load_timings_ms(path: Path | None) -> tuple[dict[str, int], dict[str, Any]]:
    if path is None or not path.is_file():
        return {}, {}

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} is not a JSON object")

    raw = payload.get("timingsMs") or payload.get("timings") or {}

    if not isinstance(raw, dict):
        raw = {}

    timings: dict[str, int] = {}

    for key, value in raw.items():
        if value is None:
            continue

        timings[str(key)] = int(value)

    meta = {
        "baseUrl": payload.get("baseUrl"),
        "runId": payload.get("runId"),
        "executionModeLabel": payload.get("executionMode") or payload.get("executionModeLabel"),
        "sourcePath": path.as_posix(),
    }

    return timings, meta


def _step_rows(timings_ms: dict[str, int]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for step_key, elapsed_ms in timings_ms.items():
        elapsed_seconds = round(elapsed_ms / 1000.0, 2)
        rows.append(
            {
                "stepKey": step_key,
                "elapsedMs": elapsed_ms,
                "elapsedSeconds": elapsed_seconds,
            },
        )

    return rows


def _disposition_for_p95(
    p95_seconds: float,
    *,
    soft_p95_seconds: int,
    hard_p95_seconds: int,
) -> str:
    if p95_seconds > hard_p95_seconds:
        return "HOLD"

    if p95_seconds > soft_p95_seconds:
        return "WARN"

    return "PASS"


def evaluate_performance_budget(
    *,
    timings_ms: dict[str, int],
    execution_mode: str,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    budgets = EXECUTION_BUDGETS.get(execution_mode)

    if budgets is None:
        raise ValueError(f"Unsupported execution mode: {execution_mode}")

    step_rows = _step_rows(timings_ms)
    elapsed_seconds = [row["elapsedSeconds"] for row in step_rows]
    p95_seconds = round(_percentile(elapsed_seconds, 0.95), 2) if elapsed_seconds else 0.0
    max_seconds = round(max(elapsed_seconds), 2) if elapsed_seconds else 0.0

    soft_p95_seconds = budgets["softP95Seconds"]
    hard_p95_seconds = budgets["hardP95Seconds"]
    overall_disposition = _disposition_for_p95(
        p95_seconds,
        soft_p95_seconds=soft_p95_seconds,
        hard_p95_seconds=hard_p95_seconds,
    )

    for row in step_rows:
        row["disposition"] = _disposition_for_p95(
            row["elapsedSeconds"],
            soft_p95_seconds=soft_p95_seconds,
            hard_p95_seconds=hard_p95_seconds,
        )

    return {
        "schemaVersion": 1,
        "improvementNumber": 10,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "executionMode": execution_mode,
        "environmentLabel": meta.get("executionModeLabel") if meta else None,
        "softBudgetP95Seconds": soft_p95_seconds,
        "hardBudgetP95Seconds": hard_p95_seconds,
        "observedP95Seconds": p95_seconds,
        "observedMaxStepSeconds": max_seconds,
        "overallDisposition": overall_disposition,
        "readinessNote": READINESS_NOTE,
        "steps": step_rows,
        "meta": meta or {},
    }


def format_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# First-pilot performance budget smoke",
        "",
        READINESS_NOTE,
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Execution mode | {summary['executionMode']} |",
        f"| Soft p95 budget (s) | {summary['softBudgetP95Seconds']} |",
        f"| Hard p95 budget (s) | {summary['hardBudgetP95Seconds']} |",
        f"| Observed p95 (s) | {summary['observedP95Seconds']} |",
        f"| Observed max step (s) | {summary['observedMaxStepSeconds']} |",
        f"| Overall disposition | **{summary['overallDisposition']}** |",
        "",
        "## Steps",
        "",
    ]

    steps = summary.get("steps") or []

    if not steps:
        lines.append("- No step timings supplied.")
    else:
        for row in steps:
            lines.append(
                f"- **{row['stepKey']}**: {row['elapsedSeconds']}s → {row['disposition']}",
            )

    lines.append("")
    lines.append("JSON artifact: `performance-budget-smoke.json`")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate first-pilot performance budget smoke.")
    parser.add_argument("--timings-json", type=Path, default=None)
    parser.add_argument("--execution-mode", choices=sorted(EXECUTION_BUDGETS.keys()), default="Simulator")
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    timings_path = args.timings_json.expanduser().resolve() if args.timings_json is not None else None
    timings_ms, meta = _load_timings_ms(timings_path)
    summary = evaluate_performance_budget(
        timings_ms=timings_ms,
        execution_mode=args.execution_mode,
        meta=meta,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(format_markdown(summary), encoding="utf-8")

    print(f"first-pilot performance budget smoke: {summary['overallDisposition']}")

    if summary["overallDisposition"] == "HOLD":
        return 2

    if summary["overallDisposition"] == "WARN":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
