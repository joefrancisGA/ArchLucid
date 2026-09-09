#!/usr/bin/env python3
"""Live-e2e API start steps in Simulator mode must clear AzureOpenAI__* (defense-in-depth)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

_WORKFLOW_PATHS = (
    ".github/workflows/ci.yml",
    ".github/workflows/private-beta-access-on-push.yml",
)
_START_API_BLOCK = re.compile(
    r"      - name: Start ArchLucid\.Api[^\n]*\n.*?(?=\n      - name: |\Z)",
    re.DOTALL,
)
_SIMULATOR_MODE = "AgentExecution__Mode: Simulator"
_REQUIRED_EMPTY_VARS = (
    'AzureOpenAI__Endpoint: ""',
    'AzureOpenAI__ApiKey: ""',
    'AzureOpenAI__DeploymentName: ""',
    'AzureOpenAI__EmbeddingDeploymentName: ""',
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _check_workflow(rel_path: str, text: str, errors: list[str]) -> None:
    for block in _START_API_BLOCK.findall(text):
        if _SIMULATOR_MODE not in block:
            continue

        for required in _REQUIRED_EMPTY_VARS:
            if required not in block:
                errors.append(
                    f"{rel_path}: Start ArchLucid.Api Simulator step must set "
                    f"{required.split(':')[0]} to empty string "
                    "(empty AzureOpenAI__* is defense-in-depth so a JSON overlay cannot fail Simulator CI)",
                )


def _check_pilot_overlay(root: Path, errors: list[str]) -> None:
    rel_path = "ArchLucid.Api/appsettings.Pilot.json"
    path = root / rel_path

    if not path.is_file():
        errors.append(f"missing {rel_path}")
        return

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{rel_path}: invalid JSON ({exc})")
        return

    if not isinstance(data, dict):
        errors.append(f"{rel_path}: expected a JSON object")
        return

    agent_execution = data.get("AgentExecution")
    mode = agent_execution.get("Mode") if isinstance(agent_execution, dict) else None

    if isinstance(mode, str) and mode.strip().lower() == "real":
        errors.append(
            f"{rel_path} must not set AgentExecution.Mode=Real "
            "(local dotnet run would require Azure OpenAI; use appsettings.Real.sample.json)"
        )

    azure = data.get("AzureOpenAI") if isinstance(data.get("AzureOpenAI"), dict) else {}

    for key in ("Endpoint", "DeploymentName", "EmbeddingDeploymentName", "ApiKey"):
        value = azure.get(key)

        if isinstance(value, str) and value.strip():
            errors.append(
                f"{rel_path} must not set AzureOpenAI.{key} "
                "(partial Azure OpenAI fails Simulator startup)"
            )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []
    _check_pilot_overlay(root, errors)

    for rel_path in _WORKFLOW_PATHS:
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing {rel_path}")

            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        _check_workflow(rel_path, text, errors)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_live_e2e_simulator_azure_openai_env: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
