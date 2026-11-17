#!/usr/bin/env python3
"""Cancel only old, superseded GitHub Actions push runs with no jobs.

Pending with zero jobs can be a legitimate GitHub queue state, not evidence that
an exact-HEAD release-candidate build is stale. Fail closed on missing metadata.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote

DEFAULT_WORKFLOW_NAMES = frozenset(
    {
        "CI",
        "UI typecheck on push",
        "Private-beta access on push",
    }
)
MIN_PENDING_AGE = timedelta(minutes=90)


def gh_api(path: str) -> Any:
    output = subprocess.check_output(["gh", "api", path], text=True)
    return json.loads(output)


def resolve_workflow_names() -> frozenset[str]:
    raw = os.environ.get("WORKFLOW_NAMES", "").strip()

    if len(raw) == 0:
        return DEFAULT_WORKFLOW_NAMES

    return frozenset(name.strip() for name in raw.split(",") if name.strip())


def current_branch_sha(repo: str, branch: str) -> str | None:
    """On API failures, return None so no cancellation is authorized."""
    if not branch:
        return None
    try:
        payload = gh_api(f"repos/{repo}/branches/{quote(branch, safe='')}")
        return payload.get("commit", {}).get("sha")
    except (subprocess.CalledProcessError, OSError, ValueError, AttributeError) as exc:
        print(f"SKIP unresolved branch={branch!r}: {exc}")
        return None


def is_superseded_old_push(run: dict[str, Any], branch_sha: str | None, now: datetime) -> bool:
    """Never delete the current exact-HEAD push or a fresh/uncertain run."""
    if run.get("event") != "push" or run.get("status") != "pending":
        return False
    head_sha = run.get("head_sha")
    if not head_sha or not branch_sha or head_sha == branch_sha:
        return False
    created_at = run.get("created_at")
    if not isinstance(created_at, str):
        return False
    try:
        created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except ValueError:
        return False
    if created.tzinfo is None:
        return False
    return now - created >= MIN_PENDING_AGE


def main() -> int:
    dry_run = os.environ.get("DRY_RUN", "false").lower() == "true"
    repo = os.environ["GITHUB_REPOSITORY"]
    workflow_names = resolve_workflow_names()
    now = datetime.now(timezone.utc)
    listed = 0
    cancelled = 0
    candidates: list[dict[str, Any]] = []

    # Collect first: cancelling during paginated reads shifts the page boundaries.
    for page in range(1, 11):
        data = gh_api(f"repos/{repo}/actions/runs?status=pending&per_page=100&page={page}")
        runs = data.get("workflow_runs", [])
        if not runs:
            break
        candidates.extend(run for run in runs if run.get("name") in workflow_names)

    seen_ids: set[int] = set()
    for run in candidates:
        run_id = run["id"]
        if run_id in seen_ids:
            continue
        seen_ids.add(run_id)
        branch = run.get("head_branch", "")
        branch_sha = current_branch_sha(repo, branch)
        if not is_superseded_old_push(run, branch_sha, now):
            continue

        jobs = gh_api(f"repos/{repo}/actions/runs/{run_id}/jobs")
        if jobs.get("total_count", 0) != 0:
            continue

        listed += 1
        print(f"MATCH id={run_id} workflow={run.get('name')} branch={branch} title={run.get('display_title', '')}")
        if dry_run:
            continue

        # Revalidate the run state, branch HEAD and job count immediately before deletion.
        # GitHub runners can materialize jobs between the initial listing and this point.
        try:
            latest = gh_api(f"repos/{repo}/actions/runs/{run_id}")
            latest_sha = current_branch_sha(repo, branch)
            if not is_superseded_old_push(latest, latest_sha, datetime.now(timezone.utc)):
                print(f"SKIP changed run id={run_id}")
                continue
            if gh_api(f"repos/{repo}/actions/runs/{run_id}/jobs").get("total_count", 0) != 0:
                print(f"SKIP jobs registered id={run_id}")
                continue
        except (subprocess.CalledProcessError, OSError, ValueError, AttributeError) as exc:
            print(f"SKIP failed revalidation id={run_id}: {exc}")
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
