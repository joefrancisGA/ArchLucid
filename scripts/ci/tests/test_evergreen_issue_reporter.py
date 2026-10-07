"""Unit tests for evergreen.issue_reporter and evergreen.launch_announcer."""

from __future__ import annotations

import sys
import unittest
import json
from typing import Sequence
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.failure_digest import FailedJob, FailureDigest  # noqa: E402
from evergreen.github_cli import GitHubCli  # noqa: E402
from evergreen.issue_reporter import REPORT_LABEL, IssueReporter  # noqa: E402
from evergreen.launch_announcer import LaunchAnnouncer  # noqa: E402
from evergreen.launch_policy import LaunchDecision  # noqa: E402

_DIGEST = FailureDigest(
    repository="o/r",
    workflow_name="Stryker (scheduled)",
    run_id=5,
    run_url="https://github.com/o/r/actions/runs/5",
    event="schedule",
    conclusion="failure",
    head_branch="master",
    head_sha="abc1234",
    pull_request_numbers=[11, 12],
    failed_jobs=[FailedJob("mutation", ["Run stryker"], ["Mutation score 40 is below break 50"], "https://job")],
)
_DECISION = LaunchDecision(launch=False, reason="r", fingerprint="fp01", cache_key="k", report=True, family="fam01")


class _Recorder:
    def __init__(self) -> None:
        self.calls: list[list[str]] = []

    def __call__(self, args: Sequence[str]) -> str:
        self.calls.append(list(args))
        return json.dumps({"html_url": f"https://github.com/o/r/issues/{len(self.calls)}"})


class TestIssueReporter(unittest.TestCase):
    def test_title_names_workflow_and_branch(self) -> None:
        self.assertEqual(IssueReporter.title(_DIGEST), "Evergreen report: Stryker (scheduled) failed on master")

    def test_body_has_run_excerpt_and_both_markers(self) -> None:
        body = IssueReporter.body(_DIGEST, _DECISION)

        self.assertIn("https://github.com/o/r/actions/runs/5", body)
        self.assertIn("Mutation score 40 is below break 50", body)
        self.assertIn("report-only", body)
        self.assertIn("Evergreen-Fingerprint: fp01", body)
        self.assertIn("Evergreen-Family: fam01", body)

    def test_body_stays_under_the_github_limit_for_many_large_jobs(self) -> None:
        jobs = [FailedJob(f"job{i}", ["s"], ["x" * 400] * 40, "u") for i in range(10)]
        digest = FailureDigest(**{**_DIGEST.to_dict(), "failed_jobs": jobs})

        body = IssueReporter.body(digest, _DECISION)

        self.assertLess(len(body), 65_536)
        self.assertIn("more failed job(s) omitted", body)
        self.assertIn("Evergreen-Fingerprint: fp01", body, "markers survive truncation")

    def test_publish_creates_a_labelled_issue_and_returns_its_url(self) -> None:
        recorder = _Recorder()

        url = IssueReporter(GitHubCli("o/r", runner=recorder)).publish(_DIGEST, _DECISION)

        self.assertEqual(url, "https://github.com/o/r/issues/1")
        args = recorder.calls[0]
        self.assertEqual(args[:4], ["api", "--method", "POST", "repos/o/r/issues"])
        self.assertIn(f"labels[]={REPORT_LABEL}", args)
        self.assertIn("title=Evergreen report: Stryker (scheduled) failed on master", args)


class TestLaunchAnnouncer(unittest.TestCase):
    def test_body_has_agent_url_and_markers(self) -> None:
        body = LaunchAnnouncer.body(_DECISION, "https://cursor.com/agents/bc-1")

        self.assertIn("https://cursor.com/agents/bc-1", body)
        self.assertIn("Evergreen-Fingerprint: fp01", body)
        self.assertIn("Evergreen-Family: fam01", body)

    def test_announce_comments_on_every_pull_request(self) -> None:
        recorder = _Recorder()

        urls = LaunchAnnouncer(GitHubCli("o/r", runner=recorder)).announce([11, 12], _DECISION, "https://a")

        self.assertEqual(len(urls), 2)
        self.assertEqual([call[3] for call in recorder.calls], ["repos/o/r/issues/11/comments", "repos/o/r/issues/12/comments"])

    def test_announce_with_no_pull_requests_is_a_no_op(self) -> None:
        recorder = _Recorder()

        self.assertEqual(LaunchAnnouncer(GitHubCli("o/r", runner=recorder)).announce([], _DECISION, "https://a"), [])
        self.assertEqual(recorder.calls, [])


if __name__ == "__main__":
    unittest.main()
