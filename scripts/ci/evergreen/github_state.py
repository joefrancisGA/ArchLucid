"""Read the GitHub-side state the launch policy needs (open PRs, today's launch markers)."""

from __future__ import annotations

from datetime import date
from typing import Any

from evergreen.github_cli import GitHubCli
from evergreen.launch_policy import LaunchPolicy


class GitHubStateReader:
    """Dedupe state lives in GitHub, not in a repo file, so agents never race on a ledger.

    - Open PR bodies carry ``Evergreen-Fingerprint: <fp>`` once an agent has delivered.
    - Actions cache entries ``evergreen-launch-<date>-<fp>`` record launches made today,
      covering the window before the agent has opened its PR.
    """

    def __init__(self, github: GitHubCli) -> None:
        self._github = github

    def open_pull_request_bodies(self) -> list[str]:
        pulls: list[dict[str, Any]] = self._github.api_json(
            self._github.repo_path("pulls?state=open&per_page=100")
        )
        return [str(pull.get("body") or "") for pull in pulls]

    def todays_launch_cache_keys(self, today: date) -> list[str]:
        prefix: str = LaunchPolicy.cache_key_prefix(today)
        payload: dict[str, Any] = self._github.api_json(
            self._github.repo_path(f"actions/caches?key={prefix}&per_page=100")
        )
        # The ``key`` filter is a prefix match server-side; re-check locally so a looser match cannot inflate the count.
        return [
            str(entry.get("key") or "")
            for entry in payload.get("actions_caches", [])
            if str(entry.get("key") or "").startswith(prefix)
        ]
