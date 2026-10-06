"""Unit tests for evergreen.failure_digest."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from typing import Sequence

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.failure_digest import FailedJob, FailureDigest, FailureDigestBuilder  # noqa: E402
from evergreen.github_cli import GitHubCli  # noqa: E402

_RUN = {
    "id": 42,
    "name": "UI typecheck on push",
    "html_url": "https://github.com/o/r/actions/runs/42",
    "event": "push",
    "conclusion": "failure",
    "head_branch": "master",
    "head_sha": "abc123",
    "pull_requests": [{"number": 9}],
}

_JOBS = {
    "jobs": [
        {
            "id": 1,
            "name": "Security: gitleaks (secret scan)",
            "conclusion": "failure",
            "html_url": "https://github.com/o/r/actions/runs/42/job/1",
            "steps": [
                {"name": "Checkout", "conclusion": "success"},
                {"name": "Run gitleaks", "conclusion": "failure"},
            ],
        },
        {"id": 2, "name": "Operator UI: typecheck", "conclusion": "skipped", "steps": []},
        {"id": 3, "name": "Cancelled job", "conclusion": "cancelled", "steps": []},
        {"id": 4, "name": "Pending job", "conclusion": None, "steps": None},
    ]
}


class _FakeRunner:
    def __init__(self, log_text: str | None = "2026-10-05T17:24:35.2901796Z ##[error]boom\n") -> None:
        self.calls: list[list[str]] = []
        self._log_text = log_text

    def __call__(self, args: Sequence[str]) -> str:
        self.calls.append(list(args))
        path: str = args[-1]

        if path.endswith("/jobs?per_page=100"):
            return json.dumps(_JOBS)

        if path.endswith("/logs"):
            if self._log_text is None:
                raise RuntimeError("log expired")

            return self._log_text

        return json.dumps(_RUN)


class TestFailureDigestBuilder(unittest.TestCase):
    def test_builds_digest_with_only_failed_jobs_and_steps(self) -> None:
        runner = _FakeRunner()

        digest = FailureDigestBuilder(GitHubCli("o/r", runner=runner)).build(42)

        self.assertEqual(digest.repository, "o/r")
        self.assertEqual(digest.workflow_name, "UI typecheck on push")
        self.assertEqual(digest.run_id, 42)
        self.assertEqual(digest.run_url, "https://github.com/o/r/actions/runs/42")
        self.assertEqual(digest.event, "push")
        self.assertEqual(digest.conclusion, "failure")
        self.assertEqual(digest.head_branch, "master")
        self.assertEqual(digest.head_sha, "abc123")
        self.assertEqual(digest.pull_request_numbers, [9])
        self.assertEqual(
            digest.failed_jobs,
            [
                FailedJob(
                    name="Security: gitleaks (secret scan)",
                    failed_steps=["Run gitleaks"],
                    error_lines=["##[error]boom"],
                    url="https://github.com/o/r/actions/runs/42/job/1",
                )
            ],
        )
        self.assertIn(["api", "--allow-escape-sequences", "repos/o/r/actions/jobs/1/logs"], runner.calls)

    def test_missing_log_yields_empty_error_lines(self) -> None:
        digest = FailureDigestBuilder(GitHubCli("o/r", runner=_FakeRunner(log_text=None))).build(42)

        self.assertEqual(digest.failed_jobs[0].error_lines, [])

    def test_round_trips_through_dict(self) -> None:
        digest = FailureDigestBuilder(GitHubCli("o/r", runner=_FakeRunner())).build(42)

        restored = FailureDigest.from_dict(json.loads(json.dumps(digest.to_dict())))

        self.assertEqual(restored, digest)

    def test_from_dict_tolerates_missing_optional_lists(self) -> None:
        restored = FailureDigest.from_dict(
            {
                "repository": "o/r",
                "workflow_name": "CI",
                "run_id": "5",
                "run_url": "u",
                "event": "pull_request",
                "conclusion": "failure",
                "head_branch": "bugsmash",
                "head_sha": "s",
            }
        )

        self.assertEqual(restored.run_id, 5)
        self.assertEqual(restored.pull_request_numbers, [])
        self.assertEqual(restored.failed_jobs, [])


if __name__ == "__main__":
    unittest.main()
