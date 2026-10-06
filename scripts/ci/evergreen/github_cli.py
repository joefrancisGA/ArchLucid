"""Thin wrapper over the ``gh`` CLI so callers never shell out directly."""

from __future__ import annotations

import json
import subprocess
from typing import Any, Callable, Sequence

CommandRunner = Callable[[Sequence[str]], str]


def run_gh(args: Sequence[str]) -> str:
    """Run ``gh`` with ``args`` and return stdout; raises on a non-zero exit."""
    completed = subprocess.run(
        ["gh", *args],
        capture_output=True,
        text=True,
        check=False,
    )

    if completed.returncode != 0:
        raise RuntimeError(f"gh {' '.join(args)} failed ({completed.returncode}): {completed.stderr.strip()}")

    return completed.stdout


class GitHubCli:
    """Read-only GitHub access for the Evergreen launcher.

    The runner is injectable so unit tests can feed canned responses instead of
    calling the real CLI.
    """

    def __init__(self, repository: str, runner: CommandRunner | None = None) -> None:
        if not repository or "/" not in repository:
            raise ValueError("repository must be in 'owner/name' form")

        self._repository = repository
        self._runner = runner or run_gh

    @property
    def repository(self) -> str:
        return self._repository

    def api_json(self, path: str) -> Any:
        """GET a REST path (relative to the API root) and parse the JSON body."""
        return json.loads(self._runner(["api", path]))

    def api_text(self, path: str) -> str:
        """GET a REST path and return the raw body (used for job logs).

        Job logs carry ANSI colour codes; without the flag ``gh`` refuses to print them.
        """
        return self._runner(["api", "--allow-escape-sequences", path])

    def repo_path(self, suffix: str) -> str:
        """Build ``repos/{owner}/{name}/{suffix}``."""
        return f"repos/{self._repository}/{suffix.lstrip('/')}"
