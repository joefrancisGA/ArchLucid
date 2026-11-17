#!/usr/bin/env python3
"""Compare bounded, same-cohort SQL repository benchmark runs. Advisory latency only."""
import argparse
import json
import math
from pathlib import Path

BACKEND = "SQL_SECURITY_EVIDENCE_PATH_REPOSITORY"

def load(path):
    raw = Path(path).read_bytes()
    if len(raw) > 65536:
        raise ValueError("Benchmark artifact exceeds 64 KiB")
    row = json.loads(raw)
    required = ("schemaVersion", "backend", "pathCount", "hopsPerPath", "concurrency",
                "queries", "p50Milliseconds", "p95Milliseconds")
    if not isinstance(row, dict) or any(k not in row for k in required):
        raise ValueError("Incomplete benchmark artifact")
    if row["schemaVersion"] != 1 or row["backend"] != BACKEND:
        raise ValueError("Unsupported benchmark schema/backend")
    for field in ("pathCount", "hopsPerPath", "concurrency", "queries"):
        if type(row[field]) is not int or not 1 <= row[field] <= 100000:
            raise ValueError("Invalid workload dimension")
    for field in ("p50Milliseconds", "p95Milliseconds"):
        x = row[field]
        if type(x) not in (int, float) or not math.isfinite(x) or x < 0:
            raise ValueError("Invalid latency sample")
    if row["p95Milliseconds"] < row["p50Milliseconds"]:
        raise ValueError("Invalid latency percentile ordering")
    return row

def compare(base, current, base_revision, current_revision):
    if not base_revision.strip() or not current_revision.strip():
        raise ValueError("Release revisions are required")
    dims = ("backend", "pathCount", "hopsPerPath", "concurrency", "queries")
    if any(base[k] != current[k] for k in dims):
        raise ValueError("Workload cohorts are not comparable")
    metrics = {}
    for field in ("p50Milliseconds", "p95Milliseconds"):
        before, after = base[field], current[field]
        metrics[field] = {"baseline": before, "observed": after,
                          "absoluteChangeMs": round(after - before, 6),
                          "percentChange": None if before == 0 else round(100 * (after - before) / before, 6)}
    return {"schemaVersion": 1, "evidenceStatus": "ADVISORY_SQL_REPOSITORY_LATENCY_ONLY",
            "baselineRevision": base_revision, "currentRevision": current_revision,
            "cohort": {k: base[k] for k in dims}, "metrics": metrics,
            "cpuMemoryCalibrationAvailable": False,
            "limitations": "CI-hosted SQL test catalog; no isolated CPU, SQL server resource usage or representative production network measurements."}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True)
    parser.add_argument("--current", required=True)
    parser.add_argument("--baseline-revision", required=True)
    parser.add_argument("--current-revision", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    report = compare(load(args.baseline), load(args.current),
                     args.baseline_revision, args.current_revision)
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("Wrote advisory SQL repository cohort comparison")
if __name__ == "__main__":
    main()
