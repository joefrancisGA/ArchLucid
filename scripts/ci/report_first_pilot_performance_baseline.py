#!/usr/bin/env python3
"""Render buyer-safe first-pilot step latency baseline from staging-smoke timings JSON."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

STEP_ORDER: tuple[tuple[str, str], ...] = (
    ("health_live", "Health live probe"),
    ("health_ready", "Health ready probe"),
    ("version", "Version endpoint"),
    ("create_run", "Create architecture review"),
    ("poll_ready", "Execute and poll until ReadyForCommit"),
    ("commit", "Commit golden manifest"),
    ("get_manifest", "Fetch authority manifest"),
    ("list_artifacts", "List sponsor artifacts"),
    ("sponsor_export", "Sponsor export download"),
)


def _load_timings(path: Path | None) -> tuple[dict[str, int], dict[str, object]]:
    if path is None or not path.is_file():
        return {}, {}

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} is not a JSON object")

    timings = payload.get("timingsMs") or payload.get("timings") or {}

    if not isinstance(timings, dict):
        timings = {}

    normalized: dict[str, int] = {}

    for key, value in timings.items():
        if value is None:
            continue

        normalized[str(key)] = int(value)

    meta = {
        "baseUrl": payload.get("baseUrl"),
        "runId": payload.get("runId"),
        "sourcePath": path.as_posix(),
    }

    return normalized, meta


def build_summary(*, timings: dict[str, int], meta: dict[str, object]) -> dict[str, object]:
    rows: list[dict[str, object]] = []

    for step_key, step_label in STEP_ORDER:
        if step_key in timings:
            rows.append(
                {
                    "stepKey": step_key,
                    "stepLabel": step_label,
                    "status": "RUN",
                    "elapsedMs": timings[step_key],
                }
            )
            continue

        rows.append(
            {
                "stepKey": step_key,
                "stepLabel": step_label,
                "status": "NOT_RUN",
                "elapsedMs": None,
            }
        )

    run_rows = [row for row in rows if row["status"] == "RUN"]
    total_ms = sum(int(row["elapsedMs"]) for row in run_rows if row["elapsedMs"] is not None)

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "COLLECTED" if run_rows else "NOT_COLLECTED",
        "evidenceClass": "first-pilot-step-latency-not-load-test",
        "baseUrl": meta.get("baseUrl"),
        "runId": meta.get("runId"),
        "sourcePath": meta.get("sourcePath"),
        "totalElapsedMs": total_ms if run_rows else None,
        "steps": rows,
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# First-pilot performance baseline",
        "",
        "> **Not a load test.** Observed step latencies from a single happy-path smoke run. "
        "Do not cite as SLA, capacity, or production performance proof.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Disposition | **{summary.get('disposition')}** |",
        f"| Evidence class | {summary.get('evidenceClass')} |",
        f"| Base URL | {summary.get('baseUrl') or 'not recorded'} |",
        f"| Run id | {summary.get('runId') or 'not recorded'} |",
        f"| Total elapsed (run steps only) | {summary.get('totalElapsedMs') if summary.get('totalElapsedMs') is not None else 'not collected'} ms |",
        "",
        "## Step timings",
        "",
        "| Step | Status | Elapsed (ms) |",
        "| --- | --- | ---: |",
    ]

    for row in summary.get("steps", []):
        if not isinstance(row, dict):
            continue

        elapsed = row.get("elapsedMs")
        elapsed_label = "—" if elapsed is None else str(elapsed)
        lines.append(f"| {row.get('stepLabel')} | {row.get('status')} | {elapsed_label} |")

    lines.extend(
        [
            "",
            "## Source",
            "",
            f"- Timings JSON: `{summary.get('sourcePath') or 'not supplied'}`",
            "- Generate with `./scripts/staging-smoke.ps1` (writes `staging-smoke-results.json` by default).",
            "",
        ]
    )

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Report first-pilot performance baseline timings.")
    parser.add_argument("--timings-json", type=Path, default=None, help="staging-smoke-results.json or compatible payload")
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-summary-out", type=Path, default=None)
    args = parser.parse_args()

    timings_path = args.timings_json.expanduser().resolve() if args.timings_json is not None else None
    timings, meta = _load_timings(timings_path)
    summary = build_summary(timings=timings, meta=meta)

    markdown_path = args.markdown_out.expanduser().resolve()
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(render_markdown(summary), encoding="utf-8")

    if args.json_summary_out is not None:
        json_path = args.json_summary_out.expanduser().resolve()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(f"first-pilot performance baseline: {summary['disposition']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
