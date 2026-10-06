"""Unit tests for evergreen.cloud_agent_client."""

from __future__ import annotations

import base64
import io
import json
import sys
import unittest
from pathlib import Path
from typing import Any
from unittest import mock

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.cloud_agent_client import AGENTS_ENDPOINT, CloudAgentClient, LaunchedAgent, post_json  # noqa: E402
from evergreen.launch_target import DeliveryMode, LaunchTarget  # noqa: E402

_PR_TARGET = LaunchTarget("master", DeliveryMode.PULL_REQUEST)
_PUSH_TARGET = LaunchTarget("bugsmash", DeliveryMode.PUSH_TO_BRANCH)


class _FakePoster:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, Any], dict[str, str]]] = []

    def __call__(self, url: str, body: bytes, headers: dict[str, str]) -> dict[str, Any]:
        self.calls.append((url, json.loads(body), headers))
        return {"agent": {"id": "bc_1", "url": "https://cursor.com/agents/bc_1"}, "run": {"id": "run_1"}}


class TestCloudAgentClient(unittest.TestCase):
    def test_constructor_validation(self) -> None:
        with self.assertRaises(ValueError):
            CloudAgentClient(api_key=" ", repo_url="https://github.com/o/r")

        with self.assertRaises(ValueError):
            CloudAgentClient(api_key="k", repo_url="git@github.com:o/r.git")

    def test_validate_model_enforces_allowlist(self) -> None:
        self.assertEqual(CloudAgentClient.validate_model("composer-2.5"), "composer-2.5")
        self.assertEqual(CloudAgentClient.validate_model("cursor-grok-4.6-high"), "cursor-grok-4.6-high")

        with self.assertRaisesRegex(ValueError, "not allowlisted"):
            CloudAgentClient.validate_model("cursor-grok-4.6-high-fast")

        with self.assertRaises(ValueError):
            CloudAgentClient.validate_model("composer-2.5-fast")

    def test_payload_for_grok_pull_request_mode(self) -> None:
        client = CloudAgentClient(api_key="k", repo_url="https://github.com/o/r/")

        payload = client.build_payload("do it", "cursor-grok-4.6-high", _PR_TARGET)

        self.assertEqual(
            payload,
            {
                "prompt": {"text": "do it"},
                "model": {"id": "cursor-grok-4.6-high", "params": []},
                "repos": [{"url": "https://github.com/o/r", "startingRef": "master"}],
                "autoCreatePR": True,
                "workOnCurrentBranch": False,
            },
        )

    def test_payload_for_composer_push_mode_sets_fast_false(self) -> None:
        client = CloudAgentClient(api_key="k", repo_url="https://github.com/o/r")

        payload = client.build_payload("do it", "composer-2.5", _PUSH_TARGET)

        self.assertEqual(payload["model"], {"id": "composer-2.5", "params": [{"id": "fast", "value": "false"}]})
        self.assertFalse(payload["autoCreatePR"])
        self.assertTrue(payload["workOnCurrentBranch"])
        self.assertEqual(payload["repos"][0]["startingRef"], "bugsmash")

    def test_launch_posts_with_basic_auth_and_parses_response(self) -> None:
        poster = _FakePoster()
        client = CloudAgentClient(api_key="secret", repo_url="https://github.com/o/r", poster=poster)

        launched = client.launch("prompt", "cursor-grok-4.6-high", _PR_TARGET)

        self.assertEqual(launched, LaunchedAgent("bc_1", "run_1", "https://cursor.com/agents/bc_1", "cursor-grok-4.6-high"))
        self.assertEqual(launched.to_dict()["agent_id"], "bc_1")
        url, body, headers = poster.calls[0]
        self.assertEqual(url, AGENTS_ENDPOINT)
        self.assertEqual(body["prompt"], {"text": "prompt"})
        expected_token = base64.b64encode(b"secret:").decode("ascii")
        self.assertEqual(headers["Authorization"], f"Basic {expected_token}")
        self.assertEqual(headers["Content-Type"], "application/json; charset=utf-8")


class TestPostJson(unittest.TestCase):
    def test_posts_and_parses(self) -> None:
        response = io.BytesIO(b'{"ok": true}')
        response.__enter__ = lambda s=response: s  # type: ignore[method-assign]
        response.__exit__ = lambda *args: None  # type: ignore[method-assign]

        with mock.patch("evergreen.cloud_agent_client.urllib.request.urlopen", return_value=response) as urlopen:
            result = post_json("https://example.test/x", b"{}", {"H": "v"})

        self.assertEqual(result, {"ok": True})
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://example.test/x")
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.data, b"{}")
        self.assertEqual(request.get_header("H"), "v")


if __name__ == "__main__":
    unittest.main()
