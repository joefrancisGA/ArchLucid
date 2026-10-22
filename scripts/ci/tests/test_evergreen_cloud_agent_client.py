"""Unit tests for evergreen.cloud_agent_client."""

from __future__ import annotations

import base64
import io
import json
import sys
import unittest
import urllib.error
from pathlib import Path
from typing import Any
from unittest import mock

_CI_ROOT = Path(__file__).resolve().parent.parent
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

from evergreen.cloud_agent_client import (  # noqa: E402
    AGENTS_ENDPOINT,
    MODELS_ENDPOINT,
    CloudAgentClient,
    LaunchedAgent,
    get_json,
    post_json,
)
from evergreen.launch_target import DeliveryMode, LaunchTarget  # noqa: E402
from evergreen.model_catalog import ModelSelection  # noqa: E402

_PR_TARGET = LaunchTarget("master", DeliveryMode.PULL_REQUEST)
_PUSH_TARGET = LaunchTarget("bugsmash", DeliveryMode.PUSH_TO_BRANCH)
_CATALOG: dict[str, Any] = {
    "items": [
        {"id": "composer-2.5", "parameters": [{"id": "fast", "values": [{"value": "false"}, {"value": "true"}]}]},
        {"id": "grok-4.6", "parameters": [{"id": "reasoning", "values": [{"value": "high"}]}]},
    ]
}


class _FakePoster:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, Any], dict[str, str]]] = []

    def __call__(self, url: str, body: bytes, headers: dict[str, str]) -> dict[str, Any]:
        self.calls.append((url, json.loads(body), headers))
        return {"agent": {"id": "bc_1", "url": "https://cursor.com/agents/bc_1"}, "run": {"id": "run_1"}}


class _FakeGetter:
    def __init__(self) -> None:
        self.calls: list[str] = []

    def __call__(self, url: str, headers: dict[str, str]) -> dict[str, Any]:
        self.calls.append(url)
        return _CATALOG


def _response(payload: bytes) -> io.BytesIO:
    response = io.BytesIO(payload)
    response.__enter__ = lambda s=response: s  # type: ignore[method-assign]
    response.__exit__ = lambda *args: None  # type: ignore[method-assign]
    return response


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

    def test_resolve_rejects_non_allowlisted_before_fetching_catalog(self) -> None:
        getter = _FakeGetter()
        client = CloudAgentClient(api_key="k", repo_url="https://github.com/o/r", getter=getter)

        with self.assertRaisesRegex(ValueError, "not allowlisted"):
            client.resolve("composer-2.5-fast")

        self.assertEqual(getter.calls, [])

    def test_resolve_maps_grok_slug_onto_catalog(self) -> None:
        getter = _FakeGetter()
        client = CloudAgentClient(api_key="k", repo_url="https://github.com/o/r", getter=getter)

        selection = client.resolve("cursor-grok-4.6-high")

        self.assertEqual(selection, ModelSelection("grok-4.6", [{"id": "reasoning", "value": "high"}]))
        self.assertEqual(getter.calls, [MODELS_ENDPOINT])

    def test_payload_for_pull_request_mode(self) -> None:
        client = CloudAgentClient(api_key="k", repo_url="https://github.com/o/r/")

        payload = client.build_payload("do it", ModelSelection("grok-4.6", []), _PR_TARGET)

        self.assertEqual(
            payload,
            {
                "prompt": {"text": "do it"},
                "model": {"id": "grok-4.6", "params": []},
                "repos": [{"url": "https://github.com/o/r", "startingRef": "master"}],
                "autoCreatePR": True,
                "workOnCurrentBranch": False,
            },
        )

    def test_payload_for_push_mode(self) -> None:
        client = CloudAgentClient(api_key="k", repo_url="https://github.com/o/r")

        payload = client.build_payload("do it", ModelSelection("composer-2.5", [{"id": "fast", "value": "false"}]), _PUSH_TARGET)

        self.assertEqual(payload["model"], {"id": "composer-2.5", "params": [{"id": "fast", "value": "false"}]})
        self.assertFalse(payload["autoCreatePR"])
        self.assertTrue(payload["workOnCurrentBranch"])
        self.assertEqual(payload["repos"][0]["startingRef"], "bugsmash")

    def test_launch_resolves_posts_with_basic_auth_and_parses_response(self) -> None:
        poster = _FakePoster()
        client = CloudAgentClient(api_key="secret", repo_url="https://github.com/o/r", poster=poster, getter=_FakeGetter())

        launched = client.launch("prompt", "composer-2.5", _PR_TARGET)

        self.assertEqual(
            launched, LaunchedAgent("bc_1", "run_1", "https://cursor.com/agents/bc_1", "composer-2.5", "composer-2.5")
        )
        self.assertEqual(launched.to_dict()["model_id"], "composer-2.5")
        url, body, headers = poster.calls[0]
        self.assertEqual(url, AGENTS_ENDPOINT)
        self.assertEqual(body["prompt"], {"text": "prompt"})
        self.assertEqual(body["model"], {"id": "composer-2.5", "params": [{"id": "fast", "value": "false"}]})
        expected_token = base64.b64encode(b"secret:").decode("ascii")
        self.assertEqual(headers["Authorization"], f"Basic {expected_token}")
        self.assertEqual(headers["Content-Type"], "application/json; charset=utf-8")


class TestHttpHelpers(unittest.TestCase):
    def test_post_json_posts_and_parses(self) -> None:
        with mock.patch("evergreen.cloud_agent_client.urllib.request.urlopen", return_value=_response(b'{"ok": true}')) as urlopen:
            result = post_json("https://example.test/x", b"{}", {"H": "v"})

        self.assertEqual(result, {"ok": True})
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://example.test/x")
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.data, b"{}")
        self.assertEqual(request.get_header("H"), "v")

    def test_get_json_gets_and_parses(self) -> None:
        with mock.patch("evergreen.cloud_agent_client.urllib.request.urlopen", return_value=_response(b'{"items": []}')) as urlopen:
            result = get_json("https://example.test/m", {"H": "v"})

        self.assertEqual(result, {"items": []})
        self.assertEqual(urlopen.call_args.args[0].get_method(), "GET")

    def test_http_error_includes_response_body(self) -> None:
        error = urllib.error.HTTPError(
            "https://example.test/x", 400, "Bad Request", {}, io.BytesIO(b'{"error":"invalid model"}')  # type: ignore[arg-type]
        )

        with mock.patch("evergreen.cloud_agent_client.urllib.request.urlopen", side_effect=error):
            with self.assertRaisesRegex(RuntimeError, r'HTTP 400 from POST https://example.test/x: \{"error":"invalid model"\}'):
                post_json("https://example.test/x", b"{}", {})


if __name__ == "__main__":
    unittest.main()
