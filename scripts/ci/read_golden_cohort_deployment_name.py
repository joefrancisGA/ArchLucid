#!/usr/bin/env python3
"""Print the golden-cohort Azure OpenAI deployment label from budget.config.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

_DEFAULT = "archlucid-golden-cohort"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def read_deployment_name(*, config_path: Path | None = None) -> str:
    path = config_path or (repo_root() / "tests" / "golden-cohort" / "budget.config.json")

    if not path.is_file():
        return _DEFAULT

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return _DEFAULT

    if isinstance(payload, dict):
        deployment = payload.get("deploymentName")
        if isinstance(deployment, str) and deployment.strip():
            return deployment.strip()

    return _DEFAULT


def main() -> int:
    print(read_deployment_name())
    return 0


if __name__ == "__main__":
    sys.exit(main())
