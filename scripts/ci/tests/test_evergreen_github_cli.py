"""Unit tests for evergreen.github_cli."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path
from typing import Sequence
from unittest import mock

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.github_cli import GitHubCli, run_gh  # noqa: E402


class TestGitHubCli(unittest.TestCase):
    def test_requires_owner_slash_name(self) -> None:
        with self.assertRaises(ValueError):
            GitHubCli("nope")

        with self.assertRaises(ValueError):
            GitHubCli("")

    def test_api_json_parses_runner_output(self) -> None:
        calls: list[Sequence[str]] = []

        def runner(args: Sequence[str]) -> str:
            calls.append(list(args))
            return '{"id": 7}'

        cli = GitHubCli("o/r", runner=runner)

        self.assertEqual(cli.api_json("repos/o/r/actions/runs/7"), {"id": 7})
        self.assertEqual(calls, [["api", "repos/o/r/actions/runs/7"]])

    def test_api_text_allows_escape_sequences(self) -> None:
        calls: list[Sequence[str]] = []

        def runner(args: Sequence[str]) -> str:
            calls.append(list(args))
            return "raw log"

        cli = GitHubCli("o/r", runner=runner)

        self.assertEqual(cli.api_text("repos/o/r/actions/jobs/1/logs"), "raw log")
        self.assertEqual(calls, [["api", "--allow-escape-sequences", "repos/o/r/actions/jobs/1/logs"]])

    def test_repo_path_and_repository(self) -> None:
        cli = GitHubCli("o/r", runner=lambda args: "")

        self.assertEqual(cli.repository, "o/r")
        self.assertEqual(cli.repo_path("/pulls"), "repos/o/r/pulls")
        self.assertEqual(cli.repo_path("pulls"), "repos/o/r/pulls")


class TestRunGh(unittest.TestCase):
    def test_returns_stdout_on_success(self) -> None:
        completed = subprocess.CompletedProcess(args=["gh"], returncode=0, stdout="ok", stderr="")

        with mock.patch("evergreen.github_cli.subprocess.run", return_value=completed) as run:
            self.assertEqual(run_gh(["api", "x"]), "ok")

        self.assertEqual(run.call_args.args[0], ["gh", "api", "x"])

    def test_raises_with_stderr_on_failure(self) -> None:
        completed = subprocess.CompletedProcess(args=["gh"], returncode=1, stdout="", stderr="boom\n")

        with mock.patch("evergreen.github_cli.subprocess.run", return_value=completed):
            with self.assertRaisesRegex(RuntimeError, "gh api x failed \\(1\\): boom"):
                run_gh(["api", "x"])


if __name__ == "__main__":
    unittest.main()
