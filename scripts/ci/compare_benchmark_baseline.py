#!/usr/bin/env python3
"""Compare BenchmarkDotNet *-report-full-compressed.json means to ci/benchmark-baseline.json."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path


def load_means(results_dir: Path) -> dict[str, float]:
    means: dict[str, float] = {}
    if not results_dir.is_dir():
        raise ValueError(f"benchmark results directory does not exist: {results_dir}")
    result_files = sorted(results_dir.glob("*-report-full-compressed.json"))
    if not result_files:
        raise ValueError(f"no benchmark result files in {results_dir}")
    for path in result_files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(payload, dict) or not isinstance(payload.get("Benchmarks"), list):
            raise ValueError(f"malformed benchmark report: {path}")
        for bench in payload["Benchmarks"]:
            full_name = bench.get("FullName")
            stats = bench.get("Statistics") or {}
            mean = stats.get("Mean")
            if full_name is None or mean is None:
                continue
            try:
                value = float(mean)
            except (TypeError, ValueError, OverflowError) as ex:
                raise ValueError(f"invalid benchmark mean for {full_name}: {mean!r}") from ex
            if not math.isfinite(value) or value < 0:
                raise ValueError(f"invalid benchmark mean for {full_name}: {mean!r}")
            if str(full_name) in means:
                raise ValueError(f"duplicate benchmark result: {full_name}")
            means[str(full_name)] = value
    return means


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--results", required=True, type=Path)
    args = parser.parse_args()

    baseline = json.loads(args.baseline.read_text(encoding="utf-8"))
    expected = {str(x["fullName"]): float(x["maxMeanNs"]) for x in baseline["benchmarks"]}
    if len(expected) != len(baseline["benchmarks"]):
        raise ValueError("duplicate benchmark baseline name")
    for full_name, limit in expected.items():
        if not math.isfinite(limit) or limit <= 0:
            raise ValueError(f"invalid benchmark baseline for {full_name}: {limit!r}")
    actual = load_means(args.results)
    unexpected = sorted(set(actual) - set(expected))
    if unexpected:
        print(f"Benchmark evidence notice: {len(unexpected)} unbaselined result(s):", file=sys.stderr)
        for name in unexpected:
            print(f"  {name}", file=sys.stderr)

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
