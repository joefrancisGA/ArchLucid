#!/usr/bin/env python3
"""Compare old HashSet-copying and new DFS traversal from isolated-process artifacts."""
import argparse
import json
import math
import statistics
from pathlib import Path

KIND = "SECURENOW_TOPOLOGY_ALGORITHM_COMPARISON"
ENGINES = ("copying-baseline", "optimized-dfs")
METRICS = {
    "managedAllocatedBytes": ("profile", "ManagedAllocatedBytes"),
    "elapsedMilliseconds": ("profile", "ElapsedMilliseconds"),
    "processCpuMilliseconds": ("profile", "ProcessCpuMillisecondsDelta"),
    "maxSampledWorkingSetBytes": ("profile", "MaximumSampledWorkingSetBytes"),
    "maxSampledManagedHeapBytes": ("profile", "MaximumSampledManagedHeapBytes"),
    "gen0Collections": (None, "gcGen0Collections"),
    "gen1Collections": (None, "gcGen1Collections"),
    "gen2Collections": (None, "gcGen2Collections"),
}
SEMANTICS = ("PrefixCount", "TraversedEdges", "VisitedNodes", "Truncated", "EvidenceStatus")
DIMENSIONS = ("cohort", "nodes", "edgeCount", "depth", "maxPrefixes", "framework", "processorCount")

def _number(value):
    return (type(value) in (int, float) and math.isfinite(value) and value >= 0)

def _read(path):
    if path.stat().st_size > 128 * 1024:
        raise ValueError("Oversized benchmark artifact")
    item = json.loads(path.read_text(encoding="utf-8"))
    if item.get("schemaVersion") != 1 or item.get("benchmarkKind") != KIND:
        raise ValueError("Unexpected benchmark schema or kind")
    if item.get("engine") not in ENGINES or type(item.get("repetition")) is not int:
        raise ValueError("Invalid engine or repetition")
    if item["repetition"] < 1 or item["repetition"] > 20:
        raise ValueError("Invalid repetition number")
    if not isinstance(item.get("profile"), dict):
        raise ValueError("Missing profiler output")
    for key in DIMENSIONS:
        if key not in item:
            raise ValueError("Missing dimension " + key)
    for path_parts in METRICS.values():
        node = item["profile"] if path_parts[0] == "profile" else item
        if not _number(node.get(path_parts[1])):
            raise ValueError("Missing or invalid measurement " + path_parts[1])
    for k in SEMANTICS:
        if k not in item["profile"]:
            raise ValueError("Missing semantic output " + k)
    return item

def _metric(item, parts):
    return item["profile"][parts[1]] if parts[0] else item[parts[1]]

def analyze(directory, expected_cohorts=None):
    files = sorted(Path(directory).glob("comparison-*.json"))
    if not files or len(files) > 200:
        raise ValueError("Missing or excessive comparison artifacts")
    groups = {}
    for file in files:
        item = _read(file)
        key = (item["cohort"], item["nodes"], item["depth"])
        engines = groups.setdefault(key, {e: {} for e in ENGINES})
        repetitions = engines[item["engine"]]
        if item["repetition"] in repetitions:
            raise ValueError("Duplicate engine/repetition")
        repetitions[item["repetition"]] = item

    results = []
    for key, engines in sorted(groups.items()):
        baseline, optimized = (engines[e] for e in ENGINES)
        if len(baseline) < 3 or set(baseline) != set(optimized):
            raise ValueError("Must have >= 3 matched independent process repetitions")
        for repetition in sorted(baseline):
            a, b = baseline[repetition], optimized[repetition]
            if any(a[k] != b[k] for k in DIMENSIONS):
                raise ValueError("Benchmark fixture or runtime mismatch")
            if any(a["profile"][s] != b["profile"][s] for s in SEMANTICS):
                raise ValueError("Counting, truncation or edge semantics regressed")
        representative = baseline[min(baseline)]
        summary = {}
        for name, field in METRICS.items():
            old = statistics.median(_metric(row, field) for row in baseline.values())
            new = statistics.median(_metric(row, field) for row in optimized.values())
            summary[name] = {
                "baselineMedian": old,
                "optimizedMedian": new,
                "absoluteChange": new - old,
                "percentChange": None if old == 0 else round(100 * (new - old) / old, 3),
            }
        results.append({
            "cohort": key[0], "nodes": key[1], "depth": key[2],
            "repetitions": len(baseline),
            "edgeCount": representative["edgeCount"],
            "pathCount": representative["profile"]["PrefixCount"],
            "truncated": representative["profile"]["Truncated"],
            "semanticEquivalenceVerified": True,
            "metrics": summary,
        })
    if expected_cohorts is not None and len(results) != expected_cohorts:
        raise ValueError("Incomplete topology/size comparison matrix")

    return {
        "schemaVersion": 1,
        "status": "MATCHED_DEDICATED_PROCESS_COMPARISON_NOT_PRODUCTION",
        "comparisonCount": len(results),
        "results": results,
        "limitations": "Medians from independent synthetic process runs, not statistically significant. Managed allocations/GC are process-wide; RSS and heap are sampled, not verified peaks. No production security-path semantics, memory savings or cost savings asserted before actual runs.",
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--expected-cohorts", type=int)
    args = parser.parse_args()
    report = analyze(args.directory, args.expected_cohorts)
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("Verified matched counts and wrote advisory traversal comparison for", report["comparisonCount"], "cohorts")

if __name__ == "__main__":
    main()
