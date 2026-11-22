#!/usr/bin/env python3
"""RC49 CI decision engine. Dry-run by default; never merges unverified PRs.

Run from a trusted GitHub Actions workflow with Actions:write permission.
An external scheduler/webhook must invoke this controller: workflows on RC49
cannot receive workflow_run or schedule events until installed on default branch.
"""
import argparse
import json
import os
import urllib.request
from urllib.error import HTTPError

API = "https://api.github.com"
def request(path, method="GET", payload=None):
    token = os.environ["GITHUB_TOKEN"]
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(API + path, data=data, method=method,
        headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
                 "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read()
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        raise RuntimeError(f"GitHub API {method} {path}: HTTP {exc.code}") from exc

def decide(runs, jobs, head_sha, ready_sha, threshold=4):
    """Pure policy: only cancel a failed run when a distinct corrected HEAD is ready."""
    active = [r for r in runs if r.get("status") in ("queued", "in_progress", "waiting", "pending")]
    running = [r for r in active if r.get("status") == "in_progress"]
    pending = [r for r in active if r.get("status") != "in_progress"]
    if len(running) > 1 or pending:
        return {"action": "wait", "reason": "multiple or pending full CI runs"}
    if running:
        run = running[0]
        failed = {j["id"] for j in jobs if j.get("conclusion") == "failure" and (j.get("run_id", run["id"]) == run["id"])}
        if len(failed) >= threshold and ready_sha == head_sha and head_sha != run.get("head_sha"):
            return {"action": "cancel", "run_id": run["id"], "failed_jobs": len(failed)}
        return {"action": "wait", "reason": "current run collecting evidence", "failed_jobs": len(failed)}
    if not ready_sha or ready_sha != head_sha:
        return {"action": "wait", "reason": "corrected commit not explicitly marked ready"}
    if any(r.get("head_sha") == head_sha and r.get("conclusion") == "success" for r in runs):
        return {"action": "wait", "reason": "head already passed"}
    if any(r.get("head_sha") == head_sha for r in runs):
        return {"action": "wait", "reason": "head already tested; explicit new approval required"}
    return {"action": "dispatch", "sha": head_sha}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default="joefrancisGA/ArchLucid")
    parser.add_argument("--ready-sha", default="", help="Reviewed corrected commit, not current run SHA")
    parser.add_argument("--apply", action="store_true", help="Permit cancellation/dispatch (default dry-run)")
    args = parser.parse_args()
    branch = request(f"/repos/{args.repo}/branches/RC49")
    head_sha = branch["commit"]["sha"]
    runs = request(f"/repos/{args.repo}/actions/workflows/ci.yml/runs?branch=RC49&event=workflow_dispatch&per_page=100").get("workflow_runs", [])
    active = next((r for r in runs if r.get("status") == "in_progress"), None)
    jobs = []
    if active:
        page = 1
        while True:
            chunk = request(f"/repos/{args.repo}/actions/runs/{active['id']}/jobs?per_page=100&page={page}").get("jobs", [])
            jobs.extend(chunk)
            if len(chunk) < 100: break
            page += 1
    result = decide(runs, jobs, head_sha, args.ready_sha)
    print(json.dumps(result, sort_keys=True))
    if not args.apply: return
    if result["action"] == "cancel":
        request(f"/repos/{args.repo}/actions/runs/{result['run_id']}/cancel", "POST")
        # Never dispatch until cancellation is observed on a later invocation.
    elif result["action"] == "dispatch":
        request(f"/repos/{args.repo}/actions/workflows/ci.yml/dispatches", "POST", {"ref": "RC49"})

if __name__ == "__main__":
    main()
