#!/usr/bin/env python3
"""Shared Azure CLI Log Analytics query helper for CI report scripts."""

from __future__ import annotations

import json
import os
import subprocess
from typing import Any


def resolve_workspace_id(explicit: str | None = None) -> str:
    value = (explicit or os.environ.get("ARCHLUCID_LOG_ANALYTICS_WORKSPACE_ID", "")).strip()

    if not value:
        raise SystemExit(
            "Log Analytics workspace id required: --workspace-id or ARCHLUCID_LOG_ANALYTICS_WORKSPACE_ID"
        )

    return value


def run_log_analytics_query(workspace_id: str, query: str) -> Any:
    completed = subprocess.run(
        [
            "az",
            "monitor",
            "log-analytics",
            "query",
            "--workspace",
            workspace_id,
            "--analytics-query",
            query,
            "-o",
            "json",
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    if completed.returncode != 0:
        raise SystemExit(
            "Log Analytics query failed.\n"
            f"query={query}\n"
            f"stderr={completed.stderr.strip()}\n"
            f"stdout={completed.stdout.strip()}"
        )

    return json.loads(completed.stdout)
