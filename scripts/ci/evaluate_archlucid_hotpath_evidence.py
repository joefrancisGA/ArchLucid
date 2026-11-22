#!/usr/bin/env python3
"""Fail-closed validation of ArchLucid's k6 hot-path performance evidence.

No synthetic measurements are generated. A verdict is produced only from a
real k6 summary and explicit, non-secret workload metadata.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

REQUIRED_ENDPOINTS = (
    "create_run", "list_runs", "get_manifest",
    "list_comparisons", "retrieval_search",
)


def values(metrics: dict, name: str) -> dict:
    metric = metrics.get(name)
    if not isinstance(metric, dict):
        raise ValueError(f"[MISSING_EVIDENCE] metric {name} is absent")
    result = metric.get("values", metric)
    if not isinstance(result, dict):
        raise ValueError(f"[INVALID_EVIDENCE] metric {name} has invalid values")
    return result


def number(data: dict, key: str, label: str) -> float:
    value = data.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise ValueError(f"[INVALID_EVIDENCE] {label}.{key} must be a finite nonnegative number")
    return float(value)


def evaluate(summary: dict, metadata: dict) -> dict:
    metrics = summary.get("metrics")
    if not isinstance(metrics, dict):
        raise ValueError("[MISSING_EVIDENCE] k6 metrics absent")
    required_meta = ("gitSha", "environment", "workload", "databaseProfile", "runnerProfile")
    for key in required_meta:
        if not isinstance(metadata.get(key), str) or not metadata[key].strip():
            raise ValueError(f"[MISSING_EVIDENCE] metadata.{key} absent")
    if metadata["workload"] != "scripts/load/hotpaths.js":
        raise ValueError("[INVALID_EVIDENCE] wrong workload")
    if metadata["environment"].lower() in ("production", "prod"):
        raise ValueError("[INVALID_EVIDENCE] production execution is not approved by this evidence gate")
    vus = number(metadata, "vus", "metadata")
    duration = number(metadata, "durationSeconds", "metadata")
    if vus < 1 or duration < 1:
        raise ValueError("[INVALID_EVIDENCE] workload concurrency and duration must be positive")

    duration_metrics = values(metrics, "http_req_duration")
    p50 = number(duration_metrics, "med", "http_req_duration")
    p95 = number(duration_metrics, "p(95)", "http_req_duration")
    p99 = number(duration_metrics, "p(99)", "http_req_duration")
    if not p50 <= p95 <= p99:
        raise ValueError("[INVALID_EVIDENCE] latency percentiles are not monotonic")
    requests = values(metrics, "http_reqs")
    count = number(requests, "count", "http_reqs")
    rate = number(requests, "rate", "http_reqs")
    if count == 0 or rate == 0:
        raise ValueError("[MISSING_EVIDENCE] no completed HTTP requests")

    checks = values(metrics, "checks")
    pass_rate = number(checks, "rate", "checks")
    if pass_rate > 1:
        raise ValueError("[INVALID_EVIDENCE] checks.rate exceeds one")

    # k6 emits tagged submetrics when explicitly configured in options.thresholds.
    endpoints = {}
    for endpoint in REQUIRED_ENDPOINTS:
        key = f"http_req_duration{{name:{endpoint}}}"
        tagged = values(metrics, key)
        endpoint_p95 = number(tagged, "p(95)", key)
        if endpoint_p95 <= 0:
            raise ValueError(f"[MISSING_EVIDENCE] no measured latency for {endpoint}")
        endpoints[endpoint] = {"p95Ms": endpoint_p95}

    failures = []
    if pass_rate < 0.99:
        failures.append(f"[RELIABILITY_FAILURE] checks.rate={pass_rate:.4f} below 0.99")
    if p95 >= 2000:
        failures.append(f"[PERFORMANCE_REGRESSION] p95={p95:.2f}ms exceeds 2000ms")
    return {
        "schemaVersion": 1, "status": "fail" if failures else "pass",
        "source": "k6-summary-export", "metadata": metadata,
        "measurements": {"requests": count, "requestsPerSecond": rate,
                         "checksPassRate": pass_rate, "p50Ms": p50,
                         "p95Ms": p95, "p99Ms": p99, "endpointP95Ms": endpoints},
        "failures": failures,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--summary", type=Path, required=True)
    parser.add_argument("--metadata", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        verdict = evaluate(json.loads(args.summary.read_text()),
                           json.loads(args.metadata.read_text()))
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        verdict = {"schemaVersion": 1, "status": "invalid", "failures": [str(exc)]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(verdict, indent=2) + "\n")
    print(json.dumps({"status": verdict["status"], "failures": verdict["failures"]}))
    return 0 if verdict["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
