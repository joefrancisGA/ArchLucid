"""Minimal client for the Cursor Cloud Agents API (POST /v1/agents)."""

from __future__ import annotations

import base64
import json
import urllib.request
from dataclasses import dataclass
from typing import Any, Callable

from evergreen.launch_target import LaunchTarget

AGENTS_ENDPOINT = "https://api.cursor.com/v1/agents"

# Mirrors .cursor/rules/Model-Allowlist-Override.mdc: standard tiers only, never the fast variants.
ALLOWED_MODELS: frozenset[str] = frozenset({"composer-2.5", "cursor-grok-4.6-high"})
DEFAULT_MODEL = "cursor-grok-4.6-high"
# Only Composer exposes the fast/standard toggle as a model param; Grok tiers are separate slugs.
_MODELS_WITH_FAST_PARAM: frozenset[str] = frozenset({"composer-2.5"})

HttpPost = Callable[[str, bytes, dict[str, str]], dict[str, Any]]


@dataclass(frozen=True)
class LaunchedAgent:
    agent_id: str
    run_id: str
    url: str
    model: str

    def to_dict(self) -> dict[str, str]:
        return {"agent_id": self.agent_id, "run_id": self.run_id, "url": self.url, "model": self.model}


def post_json(url: str, body: bytes, headers: dict[str, str]) -> dict[str, Any]:
    request = urllib.request.Request(url, data=body, method="POST", headers=headers)

    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


class CloudAgentClient:
    """Build the create-agent payload and send it; the HTTP call is injectable for tests."""

    def __init__(self, api_key: str, repo_url: str, poster: HttpPost | None = None) -> None:
        if not api_key or not api_key.strip():
            raise ValueError("api_key is required (set CURSOR_API_KEY)")

        if not repo_url or not repo_url.startswith("https://"):
            raise ValueError("repo_url must be an https URL")

        self._api_key = api_key.strip()
        self._repo_url = repo_url.rstrip("/")
        self._poster = poster or post_json

    @staticmethod
    def validate_model(model: str) -> str:
        if model not in ALLOWED_MODELS:
            raise ValueError(f"model '{model}' is not allowlisted; choose one of {sorted(ALLOWED_MODELS)}")

        return model

    def build_payload(self, prompt_text: str, model: str, target: LaunchTarget) -> dict[str, Any]:
        validated: str = self.validate_model(model)
        params: list[dict[str, str]] = (
            [{"id": "fast", "value": "false"}] if validated in _MODELS_WITH_FAST_PARAM else []
        )
        return {
            "prompt": {"text": prompt_text},
            "model": {"id": validated, "params": params},
            "repos": [{"url": self._repo_url, "startingRef": target.starting_ref}],
            "autoCreatePR": target.auto_create_pr,
            "workOnCurrentBranch": target.work_on_current_branch,
        }

    def launch(self, prompt_text: str, model: str, target: LaunchTarget) -> LaunchedAgent:
        payload: dict[str, Any] = self.build_payload(prompt_text, model, target)
        body: bytes = json.dumps(payload).encode("utf-8")
        response: dict[str, Any] = self._poster(AGENTS_ENDPOINT, body, self._headers())
        return LaunchedAgent(
            agent_id=str(response["agent"]["id"]),
            run_id=str(response["run"]["id"]),
            url=str(response["agent"]["url"]),
            model=model,
        )

    def _headers(self) -> dict[str, str]:
        token: str = base64.b64encode(f"{self._api_key}:".encode("ascii")).decode("ascii")
        return {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Basic {token}",
        }
