#!/usr/bin/env python3
"""Classify a synthetic multi-tenant k6 result without claiming production scale."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def evaluate(summary: dict, run: dict) -> dict:
    metrics = summary.get("metrics") or {}
    errors: list[str] = []
    if run.get("profile") != "synthetic-multitenant" or int(run.get("tenantCount") or 0) < 2:
        errors.append("run metadata must identify at least two synthetic tenants")
    if int(run.get("seededPathsPerTenant") or 0) < 1:
        errors.append("run metadata must identify a nonempty path corpus per tenant")
    if not run.get("gitSha") or not run.get("environment"):
        errors.append("run metadata needs gitSha and environment")
    if run.get("workload") != "scripts/load/securenow-multitenant-read.js":
        errors.append("unexpected workload")
    values = {name: (metrics.get(name) or {}).get("values") or {}
              for name in ("http_req_failed", "http_req_duration", "checks", "http_reqs")}
    failure_rate = values["http_req_failed"].get("rate")
    p95 = values["http_req_duration"].get("p(95)")
    check_rate = values["checks"].get("rate")
    requests = values["http_reqs"].get("count")
    if any(value is None for value in (failure_rate, p95, check_rate, requests)):
        errors.append("required k6 metrics missing")
    elif all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in (requests, failure_rate, p95, check_rate)) and (requests <= 0 or failure_rate >= 0.01 or p95 >= 3000 or check_rate <= 0.99):
        errors.append("observed metrics exceed synthetic test thresholds")
    # The two measured read endpoints must both have observed latency and
    # passing k6 thresholds. Preflight is excluded from the measured workload.
    for endpoint in ("snapshot_list", "ranked_paths"):
        key = f"http_req_duration{{name:{endpoint}}}"
        tagged = metrics.get(key) or {}
        tagged_values = tagged.get("values") or {}
        endpoint_p95 = tagged_values.get("p(95)")
        if (isinstance(endpoint_p95, bool)
                or not isinstance(endpoint_p95, (int, float))
                or not math.isfinite(endpoint_p95) or endpoint_p95 <= 0):
            errors.append(f"missing or invalid endpoint p95: {endpoint}")
        elif endpoint_p95 >= 3000:
            errors.append(f"endpoint p95 exceeds 3000ms: {endpoint}")
        endpoint_thresholds = tagged.get("thresholds") or {}
        if not endpoint_thresholds or any(
                not isinstance(item, dict) or item.get("ok") is not True
                for item in endpoint_thresholds.values()):
            errors.append(f"missing or failed endpoint threshold: {endpoint}")
    for name, value in (("failure rate", failure_rate), ("p95", p95),
                        ("check rate", check_rate), ("request count", requests)):
        if (isinstance(value, bool) or not isinstance(value, (int, float))
                or not math.isfinite(value) or value < 0):
            errors.append(f"invalid numeric metric: {name}")
    if isinstance(check_rate, (int, float)) and check_rate > 1:
        errors.append("invalid check rate above one")
    if isinstance(failure_rate, (int, float)) and failure_rate > 1:
        errors.append("invalid failure rate above one")
    for name in ("http_req_failed", "http_req_duration", "checks"):
        thresholds = (metrics.get(name) or {}).get("thresholds") or {}
        if not thresholds or any(item.get("ok") is not True for item in thresholds.values()):
            errors.append(f"missing or failed k6 threshold: {name}")
    return {"schema": "archlucid.securenow-scale-run.v1", "status": "PASS" if not errors else "HOLD",
            "evidenceClass": "synthetic-multitenant" if not errors else "unverified",
            "gitSha": run.get("gitSha"), "environment": run.get("environment"),
            "tenantCount": run.get("tenantCount"), "requests": requests,
            "failureRate": failure_rate, "p95Milliseconds": p95, "checkRate": check_rate,
            "errors": errors, "limitations": "Synthetic read workload; does not prove production ingestion, writes, or SLA."}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--k6-summary", type=Path, required=True)
    parser.add_argument("--run-metadata", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()
    report = evaluate(json.loads(args.k6_summary.read_text()), json.loads(args.run_metadata.read_text()))
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"SecureNow synthetic multi-tenant scale: {report['status']}")
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
