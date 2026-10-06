"""Unit tests for evergreen.github_state."""

from __future__ import annotations

import json
import sys
import unittest
from datetime import date
from pathlib import Path
from typing import Sequence

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.github_cli import GitHubCli  # noqa: E402
from evergreen.github_state import GitHubStateReader  # noqa: E402


class _FakeRunner:
    def __init__(self) -> None:
        self.paths: list[str] = []

    def __call__(self, args: Sequence[str]) -> str:
        path: str = args[-1]
        self.paths.append(path)

        if path.startswith("repos/o/r/pulls"):
            return json.dumps([{"body": "first"}, {"body": None}, {"body": "Evergreen-Fingerprint: x"}])

        return json.dumps(
            {
                "actions_caches": [
                    {"key": "evergreen-launch-2026-10-06-aaa"},
                    {"key": "evergreen-launch-2026-10-06-bbb"},
                    {"key": "evergreen-launch-2026-10-05-ccc"},
                    {"key": None},
                ]
            }
        )


class TestGitHubStateReader(unittest.TestCase):
    def test_open_pull_request_bodies_normalises_null_bodies(self) -> None:
        runner = _FakeRunner()

        bodies = GitHubStateReader(GitHubCli("o/r", runner=runner)).open_pull_request_bodies()

        self.assertEqual(bodies, ["first", "", "Evergreen-Fingerprint: x"])
        self.assertEqual(runner.paths, ["repos/o/r/pulls?state=open&per_page=100"])

    def test_todays_launch_cache_keys_filters_to_today_prefix(self) -> None:
        runner = _FakeRunner()

        keys = GitHubStateReader(GitHubCli("o/r", runner=runner)).todays_launch_cache_keys(date(2026, 10, 6))

        self.assertEqual(keys, ["evergreen-launch-2026-10-06-aaa", "evergreen-launch-2026-10-06-bbb"])
        self.assertEqual(runner.paths, ["repos/o/r/actions/caches?key=evergreen-launch-2026-10-06-&per_page=100"])


if __name__ == "__main__":
    unittest.main()
