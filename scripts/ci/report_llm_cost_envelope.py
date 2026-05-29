#!/usr/bin/env python3
"""LLM cost envelope evidence for first-pilot proof (budget + run usage labels)."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def _load_json(path: Path | None) -> dict[str, object] | None:
    if path is None or not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    return payload if isinstance(payload, dict) else None


def build_summary(
    *,
    observability: dict[str, object] | None,
    budget_status: dict[str, object] | None,
) -> dict[str, object]:
    if observability is None and budget_status is None:
        return {
            "generatedUtc": datetime.now(timezone.utc).isoformat(),
            "disposition": "NOT_COLLECTED",
            "costBasisLabel": None,
            "budgetMonitoringActive": None,
            "llmCallCount": None,
            "estimatedUsdPressure": None,
            "note": "Internal estimated USD — not invoiced Azure Cost Management truth.",
        }

    budget = budget_status or observability.get("llmBudgetStatus") if observability else None

    if not isinstance(budget, dict) and observability is not None:
        budget = {
            "monthlyBudgetMonitoringActive": observability.get("llmBudgetMonitoringActive"),
            "blocksAdditionalLlmExecution": observability.get("llmBudgetBlocksExecution"),
            "estimatedUsdPressure": observability.get("llmEstimatedUsdPressure"),
        }

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "COLLECTED",
        "costBasisLabel": observability.get("llmCostBasisLabel") if observability else None,
        "llmCostEvidenceResolved": observability.get("llmCostEvidenceResolved") if observability else None,
        "budgetMonitoringActive": (budget or {}).get("monthlyBudgetMonitoringActive"),
        "blocksAdditionalLlmExecution": (budget or {}).get("blocksAdditionalLlmExecution"),
        "llmCallCount": observability.get("llmCallCount") if observability else None,
        "estimatedUsdPressure": (budget or {}).get("estimatedUsdPressure"),
        "effectiveHardCapUsd": (budget or {}).get("effectiveHardCapUsd"),
        "note": "Internal estimated USD — not invoiced Azure Cost Management truth.",
    }


def render_markdown(summary: dict[str, object]) -> str:
    return "\n".join(
        [
            "# LLM cost envelope (pilot proof)",
            "",
            f"**Disposition:** {summary.get('disposition')}",
            "",
            "| Field | Value |",
            "| --- | --- |",
            f"| Cost basis label | {summary.get('costBasisLabel') or 'n/a'} |",
            f"| Budget monitoring active | {summary.get('budgetMonitoringActive')} |",
            f"| Blocks additional LLM execution | {summary.get('blocksAdditionalLlmExecution')} |",
            f"| LLM call count (run) | {summary.get('llmCallCount') or 'n/a'} |",
            f"| Estimated USD pressure | {summary.get('estimatedUsdPressure') or 'n/a'} |",
            f"| Effective hard cap (USD) | {summary.get('effectiveHardCapUsd') or 'n/a'} |",
            "",
            str(summary.get("note")),
            "",
        ]
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observability-json", type=Path, default=None)
    parser.add_argument("--budget-status-json", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args(argv)

    summary = build_summary(
        observability=_load_json(args.observability_json),
        budget_status=_load_json(args.budget_status_json),
    )
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
