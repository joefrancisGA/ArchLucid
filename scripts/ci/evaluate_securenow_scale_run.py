#!/usr/bin/env python3
"""Classify a synthetic multi-tenant k6 result without claiming production scale."""

from __future__ import annotations

import argparse
import json
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
    elif requests <= 0 or failure_rate >= 0.01 or p95 >= 3000 or check_rate <= 0.99:
        errors.append("observed metrics exceed synthetic test thresholds")
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
