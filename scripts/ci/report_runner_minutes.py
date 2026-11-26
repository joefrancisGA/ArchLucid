#!/usr/bin/env python3
"""Report elapsed runner minutes from GitHub Actions jobs (not billed minutes)."""
import argparse
import collections
import datetime as dt
import json
import math
import subprocess

def timestamp(value):
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))

def summarize(jobs):
    totals = collections.defaultdict(lambda: {"jobs": 0, "elapsed_minutes": 0.0, "rounded_minutes": 0, "canceled": 0, "unknown_duration": 0})
    for job in jobs:
        labels = job.get("labels") or []
        runner = next((label for label in labels if label.startswith(("ubuntu-", "windows-", "macos-"))), "unknown")
        if "self-hosted" in labels:
            runner = "self-hosted"
        row = totals[runner]
        row["jobs"] += 1
        row["canceled"] += int(job.get("conclusion") == "cancelled")
        start, end = job.get("started_at"), job.get("completed_at")
        if not start or not end or job.get("status") != "completed" or job.get("conclusion") == "skipped":
            row["unknown_duration"] += 1
            continue
        seconds = max(0, (timestamp(end) - timestamp(start)).total_seconds())
        row["elapsed_minutes"] += seconds / 60
        row["rounded_minutes"] += math.ceil(seconds / 60)
    return dict(totals)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--json-out")
    args = parser.parse_args()
    result = subprocess.run(["gh", "api", "--paginate", "--slurp",
        f"repos/{args.repo}/actions/runs/{args.run_id}/jobs?filter=all&per_page=100"],
        check=True, capture_output=True, text=True)
    jobs = [job for page in json.loads(result.stdout) for job in page["jobs"]]
    report = {"run_id": args.run_id, "runner_minutes_by_label": summarize(jobs),
              "note": "Elapsed and rounded estimates only; not billed usage. Running jobs excluded from duration."}
    rendered = json.dumps(report, indent=2)
    print(rendered)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as output:
            output.write(rendered + "\n")

if __name__ == "__main__":
    main()
