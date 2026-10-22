"""Minimal client for the Cursor Cloud Agents API (GET /v1/models, POST /v1/agents)."""

from __future__ import annotations

import base64
import json
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Callable

from evergreen.launch_target import LaunchTarget
from evergreen.model_catalog import ModelSelection, resolve_model

AGENTS_ENDPOINT = "https://api.cursor.com/v1/agents"
MODELS_ENDPOINT = "https://api.cursor.com/v1/models"

# Mirrors .cursor/rules/Model-Allowlist-Override.mdc: standard tiers only, never the fast variants.
ALLOWED_MODELS: frozenset[str] = frozenset({"composer-2.5", "cursor-grok-4.6-high"})
DEFAULT_MODEL = "cursor-grok-4.6-high"
_ERROR_BODY_LIMIT = 2000

HttpPost = Callable[[str, bytes, dict[str, str]], dict[str, Any]]
HttpGet = Callable[[str, dict[str, str]], dict[str, Any]]


@dataclass(frozen=True)
class LaunchedAgent:
    agent_id: str
    run_id: str
    url: str
    model: str
    model_id: str

    def to_dict(self) -> dict[str, str]:
        return {
            "agent_id": self.agent_id,
            "run_id": self.run_id,
            "url": self.url,
            "model": self.model,
            "model_id": self.model_id,
        }


def post_json(url: str, body: bytes, headers: dict[str, str]) -> dict[str, Any]:
    return _send(urllib.request.Request(url, data=body, method="POST", headers=headers))


def get_json(url: str, headers: dict[str, str]) -> dict[str, Any]:
    return _send(urllib.request.Request(url, method="GET", headers=headers))


def _send(request: urllib.request.Request) -> dict[str, Any]:
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # The API explains 4xx rejections in the body; without it a 400 is undiagnosable from the run log.
        detail: str = error.read().decode("utf-8", errors="replace")[:_ERROR_BODY_LIMIT]
        raise RuntimeError(f"HTTP {error.code} from {request.get_method()} {request.full_url}: {detail}") from error


class CloudAgentClient:
    """Resolve the model, build the create-agent payload and send it; HTTP calls are injectable for tests."""

    def __init__(
        self,
        api_key: str,
        repo_url: str,
        poster: HttpPost | None = None,
        getter: HttpGet | None = None,
    ) -> None:
        if not api_key or not api_key.strip():
            raise ValueError("api_key is required (set CURSOR_API_KEY)")

        if not repo_url or not repo_url.startswith("https://"):
            raise ValueError("repo_url must be an https URL")

        self._api_key = api_key.strip()
        self._repo_url = repo_url.rstrip("/")
        self._poster = poster or post_json
        self._getter = getter or get_json

    @staticmethod
    def validate_model(model: str) -> str:
        if model not in ALLOWED_MODELS:
            raise ValueError(f"model '{model}' is not allowlisted; choose one of {sorted(ALLOWED_MODELS)}")

        return model

    def resolve(self, model: str) -> ModelSelection:
        validated: str = self.validate_model(model)
        catalog: dict[str, Any] = self._getter(MODELS_ENDPOINT, self._headers())
        return resolve_model(validated, catalog)

    def build_payload(self, prompt_text: str, selection: ModelSelection, target: LaunchTarget) -> dict[str, Any]:
        return {
            "prompt": {"text": prompt_text},
            "model": selection.to_payload(),
            "repos": [{"url": self._repo_url, "startingRef": target.starting_ref}],
            "autoCreatePR": target.auto_create_pr,
            "workOnCurrentBranch": target.work_on_current_branch,
        }

    def launch(self, prompt_text: str, model: str, target: LaunchTarget) -> LaunchedAgent:
        selection: ModelSelection = self.resolve(model)
        payload: dict[str, Any] = self.build_payload(prompt_text, selection, target)
        body: bytes = json.dumps(payload).encode("utf-8")
        response: dict[str, Any] = self._poster(AGENTS_ENDPOINT, body, self._headers())
        return LaunchedAgent(
            agent_id=str(response["agent"]["id"]),
            run_id=str(response["run"]["id"]),
            url=str(response["agent"]["url"]),
            model=model,
            model_id=selection.id,
        )

    def _headers(self) -> dict[str, str]:
        token: str = base64.b64encode(f"{self._api_key}:".encode("ascii")).decode("ascii")
        return {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Basic {token}",
        }
