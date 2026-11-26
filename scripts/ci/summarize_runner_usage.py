#!/usr/bin/env python3
"""Aggregate per-workflow runner usage reports without treating them as bills."""
import argparse
import collections
import json
from pathlib import Path

def aggregate(reports):
    totals = collections.defaultdict(lambda: collections.Counter())
    seen = set()
    for report in reports:
        run_id = report["run_id"]
        if run_id in seen:
            raise ValueError(f"duplicate run: {run_id}")
        seen.add(run_id)
        for runner, values in report["runner_minutes_by_label"].items():
            totals[runner].update(values)
    return len(seen), dict(totals)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    reports = [json.loads(path.read_text(encoding="utf-8")) for path in sorted(args.directory.glob("*.json"))]
    count, totals = aggregate(reports)
    print("## Runner usage — completed workflow runs created in the last 24 hours")
    print()
    print(f"Workflow runs: {count}. Includes reported attempts for each run; not a billing-period calculation.")
    print()
    print("| Runner label | Jobs | Elapsed minutes | Rounded job minutes | Canceled jobs | Unknown duration |")
    print("|---|---:|---:|---:|---:|---:|")
    for label, row in sorted(totals.items()):
        print(f"| {label} | {row['jobs']} | {row['elapsed_minutes']:.2f} | {row['rounded_minutes']} | {row['canceled']} | {row['unknown_duration']} |")
    print()
    print("Estimates exclude unfinished jobs and jobs without usable timestamps. Not billed usage or a dollar estimate.")

if __name__ == "__main__":
    main()
