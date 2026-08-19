#!/usr/bin/env python3
"""Compare BenchmarkDotNet *-report-full-compressed.json means to ci/benchmark-baseline.json."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def load_means(results_dir: Path) -> dict[str, float]:
    means: dict[str, float] = {}
    for path in sorted(results_dir.glob("*-report-full-compressed.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        for bench in payload.get("Benchmarks", []):
            full_name = bench.get("FullName")
            stats = bench.get("Statistics") or {}
            mean = stats.get("Mean")
            if full_name is None or mean is None:
                continue
            means[str(full_name)] = float(mean)
    return means


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--results", required=True, type=Path)
    args = parser.parse_args()

    baseline = json.loads(args.baseline.read_text(encoding="utf-8"))
    expected = {str(x["fullName"]): float(x["maxMeanNs"]) for x in baseline["benchmarks"]}
    actual = load_means(args.results)

    failures: list[str] = []
    for full_name, max_mean in expected.items():
        got = actual.get(full_name)
        if got is None:
            failures.append(f"missing benchmark result: {full_name}")
            continue
        if got > max_mean:
            failures.append(
                f"{full_name}: mean {got:.2f} ns exceeds baseline max {max_mean:.2f} ns"
            )

    if failures:
        print("Benchmark regression check failed:", file=sys.stderr)
        for line in failures:
            print(f"  {line}", file=sys.stderr)
        return 1

    print("Benchmark regression check passed for", len(expected), "benchmark(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
