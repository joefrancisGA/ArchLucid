#!/usr/bin/env python3
"""Live-e2e API start steps in Simulator mode must clear AzureOpenAI__* (Pilot overlay)."""

from __future__ import annotations

import argparse
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
                    "(appsettings.Pilot.json partial AzureOpenAI must not fail Simulator CI)",
                )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

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
