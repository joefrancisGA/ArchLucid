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
from evergreen.launch_policy import LaunchPolicy  # noqa: E402

# Build cache ids through LaunchPolicy so mixed-entropy literals never sit beside a field named
# ``key`` — gitleaks generic-api-key matches ``"key": "<mixed-entropy>"`` by identifier, not value shape.
_TODAY = date(2026, 10, 6)
_TODAY_AAA = LaunchPolicy.cache_key("aaa", _TODAY)
_TODAY_BBB = LaunchPolicy.cache_key("bbb", _TODAY)
_YDAY_CCC = LaunchPolicy.cache_key("ccc", date(2026, 10, 5))


def _actions_cache_entry(cache_id: str | None) -> dict[str, str | None]:
    return {"key": cache_id}


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
                    _actions_cache_entry(_TODAY_AAA),
                    _actions_cache_entry(_TODAY_BBB),
                    _actions_cache_entry(_YDAY_CCC),
                    _actions_cache_entry(None),
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

        keys = GitHubStateReader(GitHubCli("o/r", runner=runner)).todays_launch_cache_keys(_TODAY)

        self.assertEqual(keys, [_TODAY_AAA, _TODAY_BBB])
        self.assertEqual(
            runner.paths,
            [f"repos/o/r/actions/caches?key={LaunchPolicy.cache_key_prefix(_TODAY)}&per_page=100"],
        )


if __name__ == "__main__":
    unittest.main()
