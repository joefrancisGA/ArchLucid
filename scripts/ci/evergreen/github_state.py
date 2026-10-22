"""Read the GitHub-side state the launch policy needs (prior PRs, issues, comments, launch markers)."""

from __future__ import annotations

from datetime import date
from typing import Any

from evergreen.github_cli import GitHubCli
from evergreen.launch_policy import LaunchPolicy
from evergreen.prior_work import PriorWork
from evergreen.pull_request_record import PullRequestRecord

_PAGE_SIZE = 100


class GitHubStateReader:
    """Dedupe state lives in GitHub, not in a repo file, so agents never race on a ledger.

    - PR bodies carry ``Evergreen-Fingerprint: <fp>`` (and ``Evergreen-Family:``) once an agent has delivered.
    - PR comments carry the same marker when an agent was launched onto an existing PR (push mode).
    - Actions cache entries ``evergreen-launch-<date>-<fp>`` record launches made today,
      covering the window before the agent has opened its PR.
    """

    def __init__(self, github: GitHubCli) -> None:
        self._github = github

    def recent_pull_requests(self) -> list[PullRequestRecord]:
        """The most recently updated PRs in any state; the dedupe windows are days, so one page is enough."""
        pulls: list[dict[str, Any]] = self._github.api_json(
            self._github.repo_path(f"pulls?state=all&sort=updated&direction=desc&per_page={_PAGE_SIZE}")
        )
        return [PullRequestRecord.from_api(pull) for pull in pulls]

    def open_issue_bodies(self) -> list[str]:
        issues: list[dict[str, Any]] = self._github.api_json(
            self._github.repo_path(f"issues?state=open&labels=evergreen-report&per_page={_PAGE_SIZE}")
        )
        # The issues endpoint also lists pull requests; they carry a "pull_request" key.
        return [str(issue.get("body") or "") for issue in issues if "pull_request" not in issue]

    def comment_bodies(self, pull_request_numbers: list[int]) -> list[str]:
        bodies: list[str] = []

        for number in pull_request_numbers:
            comments: list[dict[str, Any]] = self._github.api_json(
                self._github.repo_path(f"issues/{number}/comments?per_page={_PAGE_SIZE}")
            )
            bodies.extend(str(comment.get("body") or "") for comment in comments)

        return bodies

    def prior_work(self, pull_request_numbers: list[int]) -> PriorWork:
        return PriorWork(
            pull_requests=self.recent_pull_requests(),
            open_issue_bodies=self.open_issue_bodies(),
            comment_bodies=self.comment_bodies(pull_request_numbers),
        )

    def failed_job_names_on_branch(self, workflow_name: str, branch: str) -> set[str]:
        """Failed job names of the latest completed run of ``workflow_name`` on ``branch`` (empty if none)."""
        runs_payload: dict[str, Any] = self._github.api_json(
            self._github.repo_path(f"actions/runs?branch={branch}&status=completed&per_page={_PAGE_SIZE}")
        )
        latest: dict[str, Any] | None = next(
            (run for run in runs_payload.get("workflow_runs", []) if run.get("name") == workflow_name), None
        )

        if latest is None:
            return set()

        jobs_payload: dict[str, Any] = self._github.api_json(
            self._github.repo_path(f"actions/runs/{latest['id']}/jobs?per_page={_PAGE_SIZE}")
        )
        return {str(job.get("name") or "") for job in jobs_payload.get("jobs", []) if job.get("conclusion") == "failure"}

    def todays_launch_cache_keys(self, today: date) -> list[str]:
        prefix: str = LaunchPolicy.cache_key_prefix(today)
        payload: dict[str, Any] = self._github.api_json(
            self._github.repo_path(f"actions/caches?key={prefix}&per_page={_PAGE_SIZE}")
        )
        # The ``key`` filter is a prefix match server-side; re-check locally so a looser match cannot inflate the count.
        return [
            str(entry.get("key") or "")
            for entry in payload.get("actions_caches", [])
            if str(entry.get("key") or "").startswith(prefix)
        ]
