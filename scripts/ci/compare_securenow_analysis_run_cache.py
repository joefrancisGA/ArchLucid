#!/usr/bin/env python3
"""Fail-closed comparison of SecureNow analysis-run snapshot-cache process artifacts.

Synthetic repositories stand in for SQL; this never reports measured SQL throughput.
"""
import argparse
import json
import math
import statistics
from pathlib import Path

KIND = "SECURENOW_ANALYSIS_RUN_CACHE_COMPARISON"
ENGINES = ("serialized-baseline", "bounded-singleflight")
METRICS = (
    "repositoryReadCalls",
    "reuseAvoidedRepositoryReads",
    "maxConcurrentRepositoryCalls",
    "p50RequestLatencyMs",
    "p95RequestLatencyMs",
    "wallMilliseconds",
    "managedAllocatedBytes",
    "maxSampledWorkingSetBytes",
    "maxSampledManagedHeapBytes",
    "gcGen0Collections",
    "gcGen1Collections",
    "gcGen2Collections",
)
IDENTITY = (
    "scenario", "rowsPerSnapshot", "distinctSnapshots", "requests",
    "validatedRowsReturned", "simulatedRepositoryDelayMs", "runtime",
    "processorCount",
)
NONNEGATIVE = METRICS + ("workingSetBeforeBytes", "workingSetAfterBytes",
                        "sampledWorkingSetObservations")
INTEGER_FIELDS = (
    "schemaVersion", "rowsPerSnapshot", "distinctSnapshots", "repetition",
    "requests", "repositoryReadCalls", "reuseAvoidedRepositoryReads",
    "maxConcurrentRepositoryCalls", "validatedRowsReturned",
    "simulatedRepositoryDelayMs", "managedAllocatedBytes",
    "maxSampledWorkingSetBytes", "maxSampledManagedHeapBytes",
    "workingSetBeforeBytes", "workingSetAfterBytes",
    "sampledWorkingSetObservations", "gcGen0Collections",
    "gcGen1Collections", "gcGen2Collections",
)


def load_artifact(path):
    if path.stat().st_size > 131072:
        raise ValueError("Oversized cache benchmark artifact")
    item = json.loads(path.read_text(encoding="utf-8"))
    if item.get("benchmarkKind") != KIND or item.get("schemaVersion") != 1:
        raise ValueError("Unsupported benchmark kind or schema")
    if item.get("engine") not in ENGINES:
        raise ValueError("Unknown cache engine")
    if item.get("scenario") not in ("fanout", "retention-pressure"):
        raise ValueError("Unexpected benchmark scenario")
    for key in INTEGER_FIELDS:
        if type(item.get(key)) is not int or item[key] < 0:
            raise ValueError("Missing or invalid integer " + key)
    for key in NONNEGATIVE:
        if type(item.get(key)) not in (int, float) or not math.isfinite(item[key]) or item[key] < 0:
            raise ValueError("Invalid metric " + key)
    if item["repetition"] not in range(1, 21) or item["requests"] != 24:
        raise ValueError("Unexpected repetition or request count")
    if item["validatedRowsReturned"] != item["requests"] * item["rowsPerSnapshot"]:
        raise ValueError("Invalid semantic row total")
    if item["repositoryReadCalls"] > item["requests"] or (
        item["reuseAvoidedRepositoryReads"] != item["requests"] - item["repositoryReadCalls"]
    ):
        raise ValueError("Repository reuse counter mismatch")
    if item["sampledWorkingSetObservations"] < 2:
        raise ValueError("Missing RSS observations")
    if item.get("measurementStatus") != "SYNTHETIC_REPOSITORY_NOT_SQL_PROCESS_SAMPLED_RSS":
        raise ValueError("Unrecognized measurement provenance")
    if not isinstance(item.get("runtime"), str) or not item["runtime"]:
        raise ValueError("Missing runtime identity")
    return item


def analyze(directory, expected_scenarios=None):
    files = sorted(Path(directory).glob("cache-*.json"))
    if not files or len(files) > 200:
        raise ValueError("No cache comparison measurements or excessive artifacts")

    groups = {}
    for path in files:
        item = load_artifact(path)
        key = (item["scenario"], item["rowsPerSnapshot"], item["distinctSnapshots"])
        by_engine = groups.setdefault(key, {engine: {} for engine in ENGINES})
        reps = by_engine[item["engine"]]
        if item["repetition"] in reps:
            raise ValueError("Duplicate cache engine repetition")
        reps[item["repetition"]] = item

    summaries = []
    for key, by_engine in sorted(groups.items()):
        original, optimized = (by_engine[engine] for engine in ENGINES)
        if len(original) < 3 or set(original) != set(optimized):
            raise ValueError("Missing >= 3 matched repetitions for each cache engine")
        for rep in original:
            before, after = original[rep], optimized[rep]
            if any(before[field] != after[field] for field in IDENTITY):
                raise ValueError("Fixture or semantic mismatch across cache engines")
        metric_summary = {}
        for field in METRICS:
            old = statistics.median(v[field] for v in original.values())
            new = statistics.median(v[field] for v in optimized.values())
            metric_summary[field] = {
                "baselineMedian": old,
                "optimizedMedian": new,
                "delta": new - old,
                "percentChange": None if old == 0 else round(100 * (new - old) / old, 3),
            }
        summaries.append({
            "scenario": key[0],
            "rowsPerSnapshot": key[1],
            "distinctSnapshots": key[2],
            "matchedRepetitions": len(original),
            "semanticRowsVerified": original[min(original)]["validatedRowsReturned"],
            "metrics": metric_summary,
        })
    if expected_scenarios is not None and len(summaries) != expected_scenarios:
        raise ValueError("Incomplete analysis-run cache comparison matrix")

    return {
        "schemaVersion": 1,
        "evidenceStatus": "MATCHED_SYNTHETIC_REPOSITORY_BENCHMARK_NOT_SQL",
        "scenarioCount": len(summaries),
        "results": summaries,
        "limitations": (
            "Counts are simulated repository calls, NOT SQL queries. p95 values are "
            "per-process request latencies summarized by median across repeats. "
            "Managed allocation and GC are process-wide, RSS/heap sampled rather than "
            "true peaks. Three CI repetitions and artificial 25ms reads cannot establish "
            "production speedup, SQL load reduction or capacity-safe memory budgets."
        ),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--expected-scenarios", type=int)
    args = parser.parse_args()
    report = analyze(args.directory, args.expected_scenarios)
    dest = Path(args.output)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Verified {report['scenarioCount']} matched synthetic cache scenarios")


if __name__ == "__main__":
    main()
