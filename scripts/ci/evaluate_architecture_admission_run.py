#!/usr/bin/env python3
"""Classify a bounded, synthetic architecture create-admission load run."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def evaluate(summary: dict, *, git_sha: str) -> dict:
    metrics = summary.get("metrics") or {}

    def value(name: str, key: str):
        return ((metrics.get(name) or {}).get("values") or {}).get(key)

    requests = value("http_reqs", "count")
    failures = value("http_req_failed", "rate")
    p95 = value("http_req_duration", "p(95)")
    checks = value("checks", "rate")
    dropped = value("dropped_iterations", "count") or 0
    errors = []
    if not git_sha:
        errors.append("git SHA missing")
    if not isinstance(requests, (int, float)) or not math.isfinite(requests) or requests < 2:
        errors.append("fewer than two completed HTTP requests")
    if not isinstance(failures, (int, float)) or not math.isfinite(failures) or not 0 <= failures <= 0.05:
        errors.append("failure rate missing or above 5%")
    if not isinstance(p95, (int, float)) or not math.isfinite(p95) or not 0 < p95 <= 30000:
        errors.append("p95 missing or above 30 seconds")
    if not isinstance(checks, (int, float)) or not math.isfinite(checks) or checks != 1:
        errors.append("202 admission and Location checks missing or incomplete")
    if not isinstance(dropped, (int, float)) or not math.isfinite(dropped) or dropped != 0:
        errors.append("arrival-rate iterations dropped")
    return {
        "schema": "archlucid.architecture-admission-run.v1",
        "status": "PASS" if not errors else "HOLD",
        "evidenceClass": "synthetic-async-admission" if not errors else "unverified",
        "gitSha": git_sha,
        "tenantCount": 2,
        "requests": requests,
        "failureRate": failures,
        "p95Milliseconds": p95,
        "checkRate": checks,
        "droppedIterations": dropped,
        "errors": errors,
        "limitations": "202 enqueue acceptance only; does not prove worker completion, architecture generation, or production throughput.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--k6-summary", type=Path, required=True)
    parser.add_argument("--git-sha", required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()
    report = evaluate(json.loads(args.k6_summary.read_text()), git_sha=args.git_sha)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Architecture async admission: {report['status']}")
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
