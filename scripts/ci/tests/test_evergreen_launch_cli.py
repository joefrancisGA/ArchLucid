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
    path: str = args[-1]

    if path.endswith("/jobs?per_page=100"):
        return json.dumps(_JOBS)

    if path.endswith("/logs"):
        return (
            "2026-10-05T17:24:54.0026397Z RuleID:      generic-api-key\n"
            "2026-10-05T17:25:08.0449771Z ##[warning]GitLeaks encountered leaks\n"
        )

    if "/pulls?" in path:
        return json.dumps([{"body": "nothing"}])

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
        self.assertEqual(outputs["fingerprint"], decision["fingerprint"])
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
        launch = json.loads(self.launch_path.read_text(encoding="utf-8"))
        self.assertEqual(launch["agent_id"], "bc_9")
        self.assertEqual(launch["cache_key"], decision["cache_key"])
        self.assertEqual(self._github_output()["agent_url"], "https://cursor.com/agents/bc_9")

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
