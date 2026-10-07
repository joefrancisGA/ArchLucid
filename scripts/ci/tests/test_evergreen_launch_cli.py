"""Unit tests for scripts/ci/evergreen_launch.py (CLI wiring)."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any, Sequence
from unittest import mock

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import evergreen_launch  # noqa: E402

_RUN = {
    "id": 42,
    "name": "UI typecheck on push",
    "html_url": "https://github.com/o/r/actions/runs/42",
    "event": "push",
    "conclusion": "failure",
    "head_branch": "master",
    "head_sha": "abc",
    "pull_requests": [],
}
_JOBS = {
    "jobs": [
        {
            "id": 1,
            "name": "Security: gitleaks (secret scan)",
            "conclusion": "failure",
            "html_url": "j1",
            "steps": [{"name": "Run gitleaks", "conclusion": "failure"}],
        }
    ]
}


def _fake_gh(args: Sequence[str]) -> str:
    if args[:3] == ["api", "--method", "POST"]:
        return json.dumps({"html_url": f"https://github.com/o/r/posted/{args[3].rsplit('/', 1)[-1]}"})

    path: str = args[-1]

    if path.endswith("/jobs?per_page=100"):
        return json.dumps(_JOBS)

    if path.endswith("/logs"):
        return (
            "2026-10-05T17:24:54.0026397Z RuleID:      generic-api-key\n"
            "2026-10-05T17:25:08.0449771Z ##[warning]GitLeaks encountered leaks\n"
        )

    if "/pulls?" in path:
        return json.dumps([{"number": 1, "title": "unrelated", "body": "nothing", "state": "open"}])

    if "/issues?" in path or "/comments" in path:
        return json.dumps([])

    if "/actions/runs?" in path:
        return json.dumps({"workflow_runs": [{"id": 500, "name": "CI"}]})

    if path.endswith("/runs/500/jobs?per_page=100"):
        return json.dumps({"jobs": [{"name": "Security: gitleaks (secret scan)", "conclusion": "failure"}]})

    if args[:3] == ["api", "--method", "POST"]:
        return json.dumps({"html_url": f"https://github.com/o/r/posted/{path.rsplit('/', 1)[-1]}"})

    if "/actions/caches?" in path:
        return json.dumps({"actions_caches": []})

    return json.dumps(_RUN)


class TestEvergreenLaunchCli(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.digest_path = self.root / "digest.json"
        self.decision_path = self.root / "decision.json"
        self.launch_path = self.root / "launch.json"
        self.output_path = self.root / "github_output.txt"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _run(self, argv: list[str], env: dict[str, str] | None = None) -> int:
        full_env = {"GITHUB_OUTPUT": str(self.output_path), **(env or {})}

        with mock.patch.dict(os.environ, full_env, clear=False):
            with mock.patch("evergreen.github_cli.run_gh", side_effect=_fake_gh):
                return evergreen_launch.main(argv)

    def _github_output(self) -> dict[str, str]:
        if not self.output_path.exists():
            return {}

        lines = self.output_path.read_text(encoding="utf-8").splitlines()
        return dict(line.split("=", 1) for line in lines)

    def test_digest_then_decide_then_launch(self) -> None:
        self.assertEqual(self._run(["--repository", "o/r", "digest", "--run-id", "42", "--output", str(self.digest_path)]), 0)
        digest = json.loads(self.digest_path.read_text(encoding="utf-8"))
        self.assertEqual(digest["failed_jobs"][0]["error_lines"], ["RuleID:      generic-api-key", "##[warning]GitLeaks encountered leaks"])

        self.assertEqual(
            self._run(["--repository", "o/r", "decide", "--digest", str(self.digest_path), "--output", str(self.decision_path)]),
            0,
        )
        decision = json.loads(self.decision_path.read_text(encoding="utf-8"))
        self.assertTrue(decision["launch"])
        self.assertEqual(decision["delivery_mode"], "pull_request")
        outputs = self._github_output()
        self.assertEqual(outputs["launch"], "true")
        self.assertEqual(outputs["report"], "false")
        self.assertEqual(outputs["lane"], "trunk_gate")
        self.assertEqual(outputs["delivery_mode"], "pull_request")
        self.assertEqual(outputs["fingerprint"], decision["fingerprint"])
        self.assertEqual(len(decision["family"]), 12)
        self.assertTrue(outputs["cache_key"].startswith("evergreen-launch-"))

        captured: dict[str, Any] = {}

        def fake_post(url: str, body: bytes, headers: dict[str, str]) -> dict[str, Any]:
            captured["payload"] = json.loads(body)
            return {"agent": {"id": "bc_9", "url": "https://cursor.com/agents/bc_9"}, "run": {"id": "run_9"}}

        catalog: dict[str, Any] = {"items": [{"id": "grok-4.6-high"}]}

        with (
            mock.patch("evergreen.cloud_agent_client.post_json", side_effect=fake_post),
            mock.patch("evergreen.cloud_agent_client.get_json", return_value=catalog),
        ):
            code = self._run(
                [
                    "--repository",
                    "o/r",
                    "launch",
                    "--digest",
                    str(self.digest_path),
                    "--decision",
                    str(self.decision_path),
                    "--model",
                    "cursor-grok-4.6-high",
                    "--output",
                    str(self.launch_path),
                ],
                env={"CURSOR_API_KEY": "k"},
            )

        self.assertEqual(code, 0)
        payload = captured["payload"]
        self.assertEqual(payload["model"], {"id": "grok-4.6-high", "params": []})
        self.assertEqual(payload["repos"], [{"url": "https://github.com/o/r", "startingRef": "master"}])
        self.assertTrue(payload["autoCreatePR"])
        self.assertIn(f"Evergreen-Fingerprint: {decision['fingerprint']}", payload["prompt"]["text"])
        self.assertIn(f"Evergreen-Family: {decision['family']}", payload["prompt"]["text"])
        launch = json.loads(self.launch_path.read_text(encoding="utf-8"))
        self.assertEqual(launch["agent_id"], "bc_9")
        self.assertEqual(launch["cache_key"], decision["cache_key"])
        self.assertEqual(self._github_output()["agent_url"], "https://cursor.com/agents/bc_9")

    def _write_digest(self, **overrides: Any) -> None:
        digest = {
            **_RUN,
            "repository": "o/r",
            "workflow_name": "CI",
            "run_id": 1,
            "run_url": "https://github.com/o/r/actions/runs/1",
            "head_branch": "master",
            "head_sha": "s",
            "pull_request_numbers": [],
            "failed_jobs": [{"name": "Security: gitleaks (secret scan)", "failed_steps": [], "error_lines": [], "url": "j"}],
            **overrides,
        }
        self.digest_path.write_text(json.dumps(digest), encoding="utf-8")

    def _decide(self, *extra: str) -> dict[str, Any]:
        code = self._run(
            ["--repository", "o/r", "decide", "--digest", str(self.digest_path), "--output", str(self.decision_path), *extra]
        )
        self.assertEqual(code, 0)
        return json.loads(self.decision_path.read_text(encoding="utf-8"))

    def test_decide_reports_a_report_only_workflow(self) -> None:
        self._write_digest(workflow_name="Stryker (scheduled)", event="schedule")

        decision = self._decide()

        self.assertFalse(decision["launch"])
        self.assertTrue(decision["report"])
        outputs = self._github_output()
        self.assertEqual(outputs["report"], "true")
        self.assertEqual(outputs["launch"], "false")
        self.assertEqual(outputs["lane"], "scheduled")

    def test_decide_honours_the_disabled_lanes_switch(self) -> None:
        self._write_digest(head_branch="dependabot/npm/x")

        decision = self._decide("--disabled-lanes", "dependabot")

        self.assertFalse(decision["launch"])
        self.assertIn("disabled", decision["reason"])

    def test_decide_rejects_an_unknown_lane_name(self) -> None:
        self._write_digest()

        with self.assertRaisesRegex(SystemExit, "unknown lane"):
            self._decide("--disabled-lanes", "nonsense")

    def test_decide_launches_dependabot_when_trunk_is_green_and_skips_when_it_is_red(self) -> None:
        self._write_digest(head_branch="dependabot/npm/x", failed_jobs=[{"name": "other job", "failed_steps": [], "error_lines": [], "url": "j"}])
        self.assertTrue(self._decide()["launch"])
        self.assertEqual(self._github_output()["delivery_mode"], "push_to_branch")

        self._write_digest(head_branch="dependabot/npm/x")
        skipped = self._decide()

        self.assertFalse(skipped["launch"])
        self.assertIn("already failing on trunk", skipped["reason"])

    def test_report_opens_an_issue_and_exposes_its_url(self) -> None:
        self._write_digest(workflow_name="Stryker (scheduled)", event="schedule")
        self._decide()

        code = self._run(
            ["--repository", "o/r", "report", "--digest", str(self.digest_path), "--decision", str(self.decision_path), "--output", str(self.launch_path)]
        )

        self.assertEqual(code, 0)
        self.assertEqual(self._github_output()["issue_url"], "https://github.com/o/r/posted/issues")
        self.assertEqual(json.loads(self.launch_path.read_text(encoding="utf-8"))["issue_url"], "https://github.com/o/r/posted/issues")

    def test_report_refuses_when_decision_is_not_a_report(self) -> None:
        self._write_digest()
        self._decide()

        with self.assertRaisesRegex(SystemExit, "do not report"):
            self._run(
                ["--repository", "o/r", "report", "--digest", str(self.digest_path), "--decision", str(self.decision_path), "--output", str(self.launch_path)]
            )

    def test_announce_comments_on_the_pull_request(self) -> None:
        self._write_digest(head_branch="dependabot/npm/x", pull_request_numbers=[77])
        self._decide()
        self.launch_path.write_text(json.dumps({"url": "https://cursor.com/agents/bc_1"}), encoding="utf-8")

        with mock.patch("evergreen.github_cli.run_gh", side_effect=_fake_gh) as gh:
            with mock.patch.dict(os.environ, {"GITHUB_OUTPUT": str(self.output_path)}, clear=False):
                code = evergreen_launch.main(
                    ["--repository", "o/r", "announce", "--digest", str(self.digest_path), "--decision", str(self.decision_path), "--launch", str(self.launch_path)]
                )

        self.assertEqual(code, 0)
        posted = [call.args[0] for call in gh.call_args_list if call.args[0][:3] == ["api", "--method", "POST"]]
        self.assertEqual([args[3] for args in posted], ["repos/o/r/issues/77/comments"])
        self.assertTrue(any("Evergreen-Fingerprint:" in arg for arg in posted[0]))

    def test_launch_refuses_when_decision_is_skip(self) -> None:
        self.digest_path.write_text(json.dumps({**_RUN, "repository": "o/r", "workflow_name": "W", "run_id": 1, "run_url": "u", "head_branch": "master", "head_sha": "s"}), encoding="utf-8")
        self.decision_path.write_text(
            json.dumps({"launch": False, "reason": "daily cap reached (6/6)", "fingerprint": "f", "cache_key": "k"}),
            encoding="utf-8",
        )

        with self.assertRaisesRegex(SystemExit, "daily cap reached"):
            self._run(["--repository", "o/r", "launch", "--digest", str(self.digest_path), "--decision", str(self.decision_path), "--output", str(self.launch_path)])

    def test_repository_falls_back_to_environment_and_errors_when_absent(self) -> None:
        with mock.patch.dict(os.environ, {"GITHUB_REPOSITORY": "o/r"}, clear=False):
            with mock.patch("evergreen.github_cli.run_gh", side_effect=_fake_gh):
                self.assertEqual(evergreen_launch.main(["digest", "--run-id", "42", "--output", str(self.digest_path)]), 0)

        with mock.patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(SystemExit, "GITHUB_REPOSITORY"):
                evergreen_launch.main(["digest", "--run-id", "42", "--output", str(self.digest_path)])

    def test_github_output_is_optional(self) -> None:
        with mock.patch.dict(os.environ, {}, clear=True):
            evergreen_launch._append_github_output({"a": "b"})

        self.assertFalse(self.output_path.exists())


if __name__ == "__main__":
    unittest.main()
