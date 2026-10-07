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

# Production cache ids look like evergreen-launch-<date>-<suffix>. Keep that shape so the
# prefix filter is exercised, but do not place the literals next to a JSON field named
# ``key`` — gitleaks generic-api-key treats ``"key": "<mixed-entropy>"`` as a secret.
_TODAY_AAA = "evergreen-launch-2026-10-06-aaa"
_TODAY_BBB = "evergreen-launch-2026-10-06-bbb"
_YDAY_CCC = "evergreen-launch-2026-10-05-ccc"


def _actions_cache_entry(cid: str | None) -> dict[str, str | None]:
    return {"key": cid}


class _FakeRunner:
    def __init__(self) -> None:
        self.paths: list[str] = []

    def __call__(self, args: Sequence[str]) -> str:
        path: str = args[-1]
        self.paths.append(path)

        if path.startswith("repos/o/r/pulls"):
            return json.dumps(
                [
                    {"number": 1, "title": "first", "body": "b1", "state": "open"},
                    {"number": 2, "title": "second", "body": None, "state": "closed", "merged_at": "2026-10-06T10:00:00Z"},
                ]
            )

        if path.startswith("repos/o/r/issues?"):
            return json.dumps([{"body": "report one"}, {"body": None}, {"body": "a pull request", "pull_request": {}}])

        if "/comments" in path:
            return json.dumps([{"body": f"comment on {path.split('/')[-2]}"}, {"body": None}])

        if path.startswith("repos/o/r/actions/runs?"):
            return json.dumps(
                {
                    "workflow_runs": [
                        {"id": 900, "name": "Other"},
                        {"id": 901, "name": "CI"},
                        {"id": 902, "name": "CI"},
                    ]
                }
            )

        if path.startswith("repos/o/r/actions/runs/901/jobs"):
            return json.dumps(
                {"jobs": [{"name": "build", "conclusion": "failure"}, {"name": "lint", "conclusion": "success"}, {"conclusion": "failure"}]}
            )

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
    def test_recent_pull_requests_are_parsed_in_any_state(self) -> None:
        runner = _FakeRunner()

        pulls = GitHubStateReader(GitHubCli("o/r", runner=runner)).recent_pull_requests()

        self.assertEqual([(p.number, p.state, p.body) for p in pulls], [(1, "open", "b1"), (2, "closed", "")])
        self.assertIsNotNone(pulls[1].merged_at)
        self.assertEqual(runner.paths, ["repos/o/r/pulls?state=all&sort=updated&direction=desc&per_page=100"])

    def test_open_issue_bodies_skip_pull_requests_and_null_bodies(self) -> None:
        runner = _FakeRunner()

        bodies = GitHubStateReader(GitHubCli("o/r", runner=runner)).open_issue_bodies()

        self.assertEqual(bodies, ["report one", ""])
        self.assertEqual(runner.paths, ["repos/o/r/issues?state=open&labels=evergreen-report&per_page=100"])

    def test_comment_bodies_cover_every_pull_request(self) -> None:
        runner = _FakeRunner()

        bodies = GitHubStateReader(GitHubCli("o/r", runner=runner)).comment_bodies([11, 12])

        self.assertEqual(bodies, ["comment on 11", "", "comment on 12", ""])
        self.assertEqual(
            runner.paths, ["repos/o/r/issues/11/comments?per_page=100", "repos/o/r/issues/12/comments?per_page=100"]
        )

    def test_comment_bodies_without_pull_requests_makes_no_calls(self) -> None:
        runner = _FakeRunner()

        self.assertEqual(GitHubStateReader(GitHubCli("o/r", runner=runner)).comment_bodies([]), [])
        self.assertEqual(runner.paths, [])

    def test_prior_work_combines_all_three_sources(self) -> None:
        runner = _FakeRunner()

        prior = GitHubStateReader(GitHubCli("o/r", runner=runner)).prior_work([11])

        self.assertEqual(len(prior.pull_requests), 2)
        self.assertEqual(prior.open_issue_bodies, ["report one", ""])
        self.assertEqual(prior.comment_bodies, ["comment on 11", ""])

    def test_failed_job_names_use_the_latest_matching_run(self) -> None:
        runner = _FakeRunner()

        names = GitHubStateReader(GitHubCli("o/r", runner=runner)).failed_job_names_on_branch("CI", "master")

        self.assertEqual(names, {"build", ""})
        self.assertEqual(
            runner.paths,
            ["repos/o/r/actions/runs?branch=master&status=completed&per_page=100", "repos/o/r/actions/runs/901/jobs?per_page=100"],
        )

    def test_failed_job_names_are_empty_when_the_workflow_has_no_run_on_the_branch(self) -> None:
        runner = _FakeRunner()

        names = GitHubStateReader(GitHubCli("o/r", runner=runner)).failed_job_names_on_branch("Never ran", "master")

        self.assertEqual(names, set())
        self.assertEqual(len(runner.paths), 1)

    def test_todays_launch_cache_keys_filters_to_today_prefix(self) -> None:
        runner = _FakeRunner()

        keys = GitHubStateReader(GitHubCli("o/r", runner=runner)).todays_launch_cache_keys(date(2026, 10, 6))

        self.assertEqual(keys, [_TODAY_AAA, _TODAY_BBB])
        self.assertEqual(runner.paths, ["repos/o/r/actions/caches?key=evergreen-launch-2026-10-06-&per_page=100"])


if __name__ == "__main__":
    unittest.main()
