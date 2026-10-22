#!/usr/bin/env python3
"""Cancel GitHub Actions runs stuck in pending with zero jobs (queue relief)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from typing import Any

DEFAULT_WORKFLOW_NAMES = frozenset(
    {
        "CI",
        "UI typecheck on push",
        "Private-beta access on push",
    }
)


def gh_api(path: str) -> Any:
    output = subprocess.check_output(["gh", "api", path], text=True)
    return json.loads(output)


def resolve_workflow_names() -> frozenset[str]:
    raw = os.environ.get("WORKFLOW_NAMES", "").strip()

    if len(raw) == 0:
        return DEFAULT_WORKFLOW_NAMES

    return frozenset(name.strip() for name in raw.split(",") if name.strip())


def main() -> int:
    dry_run = os.environ.get("DRY_RUN", "false").lower() == "true"
    repo = os.environ["GITHUB_REPOSITORY"]
    workflow_names = resolve_workflow_names()
    listed = 0
    cancelled = 0

    for page in range(1, 11):
        data = gh_api(f"repos/{repo}/actions/runs?status=pending&per_page=100&page={page}")
        runs = data.get("workflow_runs", [])

        if not runs:
            break

        for run in runs:
            if run.get("name") not in workflow_names:
                continue

            run_id = run["id"]
            jobs = gh_api(f"repos/{repo}/actions/runs/{run_id}/jobs")

            if jobs.get("total_count", 0) != 0:
                continue

            listed += 1
            branch = run.get("head_branch", "")
            title = run.get("display_title", "")
            workflow_name = run.get("name", "")
            print(f"MATCH id={run_id} workflow={workflow_name} branch={branch} title={title}")

            if dry_run:
                continue

            subprocess.check_call(
                ["gh", "api", "--method", "POST", f"repos/{repo}/actions/runs/{run_id}/cancel"]
            )
            print(f"CANCELLED id={run_id}")
            cancelled += 1

    print(
        f"Done. workflows={','.join(sorted(workflow_names))} listed={listed} "
        f"cancelled={cancelled} dry_run={dry_run}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
