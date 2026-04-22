#!/usr/bin/env python3
"""
Month-to-date Azure spend probe for the dedicated golden-cohort Azure OpenAI resource.

Reads ``tests/golden-cohort/budget.config.json``, queries **Azure Cost Management** (management plane REST,
no Azure SDK) using ``requests``, and exits:

* **0** — month-to-date cost is **below** the kill threshold (default 90% of ``monthlyTokenBudgetUsd``).
* **1** — at or above the kill threshold but **below** 100% of the monthly cap (real-LLM cohort must not run).
* **2** — at or above **100%** of the cap (hard stop).
* **3** — probe could not run (missing credentials, missing resource id, HTTP/API error).

Credentials (in order):

1. Environment variable ``ARCHLUCID_ARM_ACCESS_TOKEN`` or ``AZURE_MANAGEMENT_ACCESS_TOKEN`` (Bearer token for ``https://management.azure.com/``).
2. Otherwise ``az account get-access-token --resource https://management.azure.com/`` (after ``az login`` or ``azure/login`` in CI).

Subscription: ``AZURE_SUBSCRIPTION_ID`` (or parsed from the resource id).

Resource scope: full ARM id of the **Cognitive Services** account hosting the golden-cohort deployment —
``ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID`` (required unless simulating).

Local smoke without Azure: set ``ARCHLUCID_GOLDEN_COHORT_BUDGET_PROBE_SIMULATE_MTD_USD`` to a decimal string.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from shutil import which
from typing import Any

try:
    import requests
except ImportError as exc:  # pragma: no cover - exercised when requests missing
    print("golden_cohort_budget_probe: install requests (pip install requests).", file=sys.stderr)
    raise SystemExit(3) from exc

COST_API_VERSION = "2023-11-01"
MANAGEMENT_SCOPE = "https://management.azure.com/"


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _load_config(path: Path) -> dict[str, Any]:
    if not path.is_file():
        print(f"golden_cohort_budget_probe: missing config file: {path}", file=sys.stderr)
        raise SystemExit(3)

    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def _subscription_id_from_resource(resource_id: str) -> str:
    parts = resource_id.split("/")
    try:
        idx = parts.index("subscriptions")
    except ValueError as exc:
        print(
            "golden_cohort_budget_probe: ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID must include /subscriptions/{guid}/...",
            file=sys.stderr,
        )
        raise SystemExit(3) from exc

    if idx + 1 >= len(parts):
        raise SystemExit(3)

    return parts[idx + 1]


def _get_management_token() -> str:
    for key in ("ARCHLUCID_ARM_ACCESS_TOKEN", "AZURE_MANAGEMENT_ACCESS_TOKEN"):
        token = os.environ.get(key, "").strip()
        if token:
            return token

    az_path = which("az")
    if az_path is None:
        print(
            "golden_cohort_budget_probe: no management token. Set ARCHLUCID_ARM_ACCESS_TOKEN, "
            "or install Azure CLI and run `az login`, or use `azure/login` in GitHub Actions before this script.",
            file=sys.stderr,
        )
        raise SystemExit(3)

    proc = subprocess.run(
        [az_path, "account", "get-access-token", "--resource", MANAGEMENT_SCOPE.rstrip("/"), "-o", "json"],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        print(proc.stderr or proc.stdout or "az get-access-token failed", file=sys.stderr)
        raise SystemExit(3)

    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError:
        print("golden_cohort_budget_probe: could not parse az token JSON.", file=sys.stderr)
        raise SystemExit(3)

    token = str(payload.get("accessToken", "")).strip()
    if not token:
        print("golden_cohort_budget_probe: az returned empty accessToken.", file=sys.stderr)
        raise SystemExit(3)

    return token


def _query_mtd_actual_cost_usd(subscription_id: str, resource_id: str, token: str) -> float:
    url = (
        f"https://management.azure.com/subscriptions/{subscription_id}"
        f"/providers/Microsoft.CostManagement/query?api-version={COST_API_VERSION}"
    )
    body: dict[str, Any] = {
        "type": "ActualCost",
        "timeframe": "MonthToDate",
        "dataset": {
            "granularity": "None",
            "aggregation": {
                "totalCost": {
                    "name": "Cost",
                    "function": "Sum",
                },
            },
            "filter": {
                "dimensions": {
                    "name": "ResourceId",
                    "operator": "In",
                    "values": [resource_id],
                },
            },
        },
    }

    response = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=body,
        timeout=120,
    )

    if response.status_code >= 400:
        print(
            f"golden_cohort_budget_probe: Cost Management query failed HTTP {response.status_code}: "
            f"{response.text[:800]}",
            file=sys.stderr,
        )
        raise SystemExit(3)

    data = response.json()
    return _parse_cost_usd_from_query_result(data)


def _parse_cost_usd_from_query_result(data: dict[str, Any]) -> float:
    props = data.get("properties") or {}
    columns = props.get("columns") or []
    rows = props.get("rows") or []
    if not columns or not rows:
        return 0.0

    cost_idx: int | None = None
    for i, col in enumerate(columns):
        if not isinstance(col, dict):
            continue
        name = str(col.get("name", "")).lower()
        if "cost" in name:
            cost_idx = i
            break

    if cost_idx is None:
        cost_idx = len(rows[0]) - 1 if rows and rows[0] else 0

    total = 0.0
    for row in rows:
        if not isinstance(row, (list, tuple)) or cost_idx >= len(row):
            continue
        cell = row[cost_idx]
        try:
            total += float(cell)
        except (TypeError, ValueError):
            continue

    return total


def _compute_exit_code(mtd_usd: float, monthly_budget_usd: float, kill_switch_percent: float) -> int:
    if mtd_usd >= monthly_budget_usd:
        return 2

    threshold_usd = monthly_budget_usd * (kill_switch_percent / 100.0)
    if mtd_usd >= threshold_usd:
        return 1

    return 0


def _emit_exports(mtd: float, budget: float, kill_pct: float, exit_code: int) -> None:
    threshold = budget * (kill_pct / 100.0)
    remaining = max(budget - mtd, 0.0)
    print(f"Month-to-date cost (USD): {mtd:.2f}")
    print(f"Monthly budget (USD): {budget:.2f}")
    print(f"Kill threshold at {kill_pct:g}%: {threshold:.2f}")
    print(f"Remaining to cap: {remaining:.2f}")
    print(f"EXPORT_MTD_USD={mtd:.4f}")
    print(f"EXPORT_BUDGET_USD={budget:.4f}")
    print(f"EXPORT_KILL_THRESHOLD_USD={threshold:.4f}")
    print(f"EXPORT_EXIT_CODE={exit_code}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Golden cohort Azure OpenAI MTD cost probe.")
    parser.add_argument(
        "--config",
        type=Path,
        default=_repo_root() / "tests" / "golden-cohort" / "budget.config.json",
        help="Path to budget.config.json",
    )
    args = parser.parse_args()

    cfg = _load_config(args.config)
    monthly_budget = float(cfg["monthlyTokenBudgetUsd"])
    kill_pct = float(cfg["killSwitchThresholdPercent"])

    simulate = os.environ.get("ARCHLUCID_GOLDEN_COHORT_BUDGET_PROBE_SIMULATE_MTD_USD", "").strip()
    if simulate:
        mtd = float(simulate)
        code = _compute_exit_code(mtd, monthly_budget, kill_pct)
        _emit_exports(mtd, monthly_budget, kill_pct, code)
        return code

    resource_id = os.environ.get("ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID", "").strip()
    if not resource_id:
        print(
            "golden_cohort_budget_probe: set ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID to the full ARM id of the "
            "Cognitive Services account (e.g. /subscriptions/.../resourceGroups/.../providers/Microsoft.CognitiveServices/accounts/...).",
            file=sys.stderr,
        )
        raise SystemExit(3)

    subscription_id = os.environ.get("AZURE_SUBSCRIPTION_ID", "").strip() or _subscription_id_from_resource(resource_id)
    if not subscription_id:
        print("golden_cohort_budget_probe: could not resolve subscription id.", file=sys.stderr)
        raise SystemExit(3)

    token = _get_management_token()
    mtd = _query_mtd_actual_cost_usd(subscription_id, resource_id, token)
    code = _compute_exit_code(mtd, monthly_budget, kill_pct)
    _emit_exports(mtd, monthly_budget, kill_pct, code)
    return code


if __name__ == "__main__":
    raise SystemExit(main())
