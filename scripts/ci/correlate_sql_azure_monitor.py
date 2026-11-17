#!/usr/bin/env python3
"""Validate Azure Monitor CPU observations against a matched SQL benchmark window.

No live Azure API calls. Operates on approved, manually exported monitoring data.
"""
import argparse
import datetime as dt
import json
import math
from pathlib import Path

def read_json(path):
    data = Path(path).read_bytes()
    if len(data) > 262144:
        raise ValueError("Artifact too large")
    return json.loads(data)

def utc(iso):
    value = dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    if value.utcoffset() != dt.timedelta(0):
        raise ValueError("UTC offset required")
    return value

def correlate(benchmark, monitor):
    backend = benchmark.get("backend")
    if backend not in ("SQL_SECURITY_EVIDENCE_PATH_REPOSITORY", "AZURE_SQL_TEMP_TABLE_TEST_ONLY"):
        raise ValueError("Unsupported benchmark backend")
    if backend == "AZURE_SQL_TEMP_TABLE_TEST_ONLY":
        identity = benchmark.get("azureSqlResourceId")
        if not isinstance(identity, str) or not identity.strip():
            raise ValueError("Azure SQL benchmark must include resource identity")
        if not isinstance(monitor.get("resourceId"), str) or identity.casefold() != monitor["resourceId"].casefold():
            raise ValueError("Azure SQL benchmark and monitor resource IDs differ")
    if monitor.get("schemaVersion") != 1 or monitor.get("metricName") not in ("cpu_percent", "cpu_usage_nano_cores"):
        raise ValueError("Unsupported monitor metric")
    if monitor.get("scope") != "SQL_SERVER_RESOURCE" or not monitor.get("resourceId"):
        raise ValueError("Azure Monitor SQL resource identity required")
    start, end = utc(monitor["startUtc"]), utc(monitor["endUtc"])
    b_start, b_end = utc(benchmark["measurementStartUtc"]), utc(benchmark["measurementEndUtc"])
    if start > b_start or end < b_end or b_start >= b_end:
        raise ValueError("Monitor window does not cover benchmark")
    points = monitor.get("observations", [])
    if not 2 <= len(points) <= 10000:
        raise ValueError("Insufficient samples")
    values = []
    timestamps = []
    for p in points:
        t, value = utc(p["timestampUtc"]), p["value"]
        if t < start or t > end or not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value) or value < 0:
            raise ValueError("Invalid metric point")
        timestamps.append(t)
        values.append(value)
    if any(later <= earlier for earlier, later in zip(timestamps, timestamps[1:])):
        raise ValueError("Monitor samples must be strictly time ordered")
    if backend == "AZURE_SQL_TEMP_TABLE_TEST_ONLY" and not any(b_start <= t <= b_end for t in timestamps):
        raise ValueError("No monitor sample inside benchmark window")
    return {
        "schemaVersion": 1,
        "status": "CORRELATED_NOT_QUERY_CPU_CALIBRATION",
        "benchmarkBackend": benchmark["backend"],
        "monitorMetric": monitor["metricName"],
        "sqlResourceId": monitor["resourceId"],
        "identityVerifiedByArtifact": backend == "AZURE_SQL_TEMP_TABLE_TEST_ONLY",
        "resourceIdentityVerification": "ARTIFACT_STRING_MATCH_ONLY_NOT_AZURE_ATTESTATION",
        "sampleCount": len(values),
        "averageObservedValue": sum(values) / len(values),
        "measurementWindow": {"startUtc": benchmark["measurementStartUtc"], "endUtc": benchmark["measurementEndUtc"]},
        "cachedSqlQueryWorkerCpuMillisecondsDelta": benchmark.get("serverCachedQueryWorkerCpuMillisecondsDelta"),
        "limitations": "Azure Monitor and cached-plan CPU have different units/semantics. Neither observation proves SQL query CPU attribution or worker sizing."
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--benchmark", required=True)
    ap.add_argument("--monitor", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()
    result = correlate(read_json(args.benchmark), read_json(args.monitor))
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
