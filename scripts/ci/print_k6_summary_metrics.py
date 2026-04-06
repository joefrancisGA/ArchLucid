#!/usr/bin/env python3
"""Read k6 --summary-export JSON and append a short markdown table to GITHUB_STEP_SUMMARY."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def _trend_values(payload: dict, metric_name: str) -> dict:
    metrics = payload.get("metrics")
    if not isinstance(metrics, dict):
        return {}

    block = metrics.get(metric_name)
    if not isinstance(block, dict):
        return {}

    values = block.get("values")
    return values if isinstance(values, dict) else {}


def _num(values: dict, *keys: str) -> str:
    for key in keys:
        if key in values and values[key] is not None:
            return str(values[key])
    return "n/a"


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: print_k6_summary_metrics.py <summary.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"missing file: {path}", file=sys.stderr)
        return 2

    payload = json.loads(path.read_text(encoding="utf-8"))
    dur = _trend_values(payload, "http_req_duration")
    reqs = _trend_values(payload, "http_reqs")
    iters = _trend_values(payload, "iterations")

    p50 = _num(dur, "med", "p(50)")
    p95 = _num(dur, "p(95)")
    p99 = _num(dur, "p(99)")
    rate = _num(reqs, "rate")
    iter_count = _num(iters, "count")

    lines = [
        "## k6 summary (http_req_duration)",
        "",
        "| Metric | Value |",
        "| --- | --- |",
        f"| p50 (med) | {p50} ms |",
        f"| p95 | {p95} ms |",
        f"| p99 | {p99} ms |",
        f"| http_reqs rate | {rate} |",
        f"| iterations (count) | {iter_count} |",
        "",
        "Copy p50/p95/p99 into `docs/LOAD_TEST_BASELINE.md` after a formal baseline run.",
        "",
    ]
    md = "\n".join(lines)

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as f:
            f.write(md)

    print(md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
