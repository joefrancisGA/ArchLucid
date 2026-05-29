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


def _load_pilot_deltas(path: Path | None) -> dict[str, object] | None:
    if path is None or not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    return payload if isinstance(payload, dict) else None


def _cost_per_committed_review(
    *,
    observability: dict[str, object] | None,
    pilot_deltas: dict[str, object] | None,
) -> dict[str, object]:
    llm_calls = None
    execution_mode = None
    if observability is not None:
        llm_calls = observability.get("llmCallCount")
        execution_mode = observability.get("llmExecutionMode")

    if pilot_deltas is not None:
        if llm_calls is None:
            llm_calls = pilot_deltas.get("llmCallCount")
        if execution_mode is None:
            execution_mode = pilot_deltas.get("llmExecutionMode")

    pressure = None
    if observability is not None:
        pressure = observability.get("llmEstimatedUsdPressure")
        budget = observability.get("llmBudgetStatus")
        if pressure is None and isinstance(budget, dict):
            pressure = budget.get("estimatedUsdPressure")

    per_review = None
    if isinstance(pressure, (int, float)) and isinstance(llm_calls, (int, float)) and llm_calls > 0:
        per_review = round(float(pressure) / float(llm_calls), 4)

    return {
        "llmCallsPerCommittedReview": llm_calls,
        "estimatedUsdPerCommittedReview": per_review,
        "executionMode": execution_mode,
        "simulatorDisclaimer": (
            "Simulator runs are labeled and do not imply hosted COGS or invoice-grade Azure spend."
            if str(execution_mode or "").lower() == "simulator"
            else None
        ),
    }


def build_summary(
    *,
    observability: dict[str, object] | None,
    budget_status: dict[str, object] | None,
    pilot_deltas: dict[str, object] | None = None,
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

    per_review = _cost_per_committed_review(
        observability=observability,
        pilot_deltas=pilot_deltas,
    )

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
        "costPerCommittedReview": per_review,
        "note": "Internal estimated USD — not invoiced Azure Cost Management truth.",
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
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
        "## Cost per committed review (operator estimate)",
        "",
    ]

    per_review = summary.get("costPerCommittedReview")
    if isinstance(per_review, dict):
        lines.extend(
            [
                "| Metric | Value |",
                "| --- | --- |",
                f"| LLM calls per committed review | {per_review.get('llmCallsPerCommittedReview') or 'n/a'} |",
                f"| Estimated LLM USD per committed review | {per_review.get('estimatedUsdPerCommittedReview') or 'n/a'} |",
                f"| Execution mode | {per_review.get('executionMode') or 'n/a'} |",
            ]
        )
        disclaimer = per_review.get("simulatorDisclaimer")
        if disclaimer:
            lines.append("")
            lines.append(f"> {disclaimer}")

    lines.extend(
        [
            "",
            str(summary.get("note")),
            "",
        ]
    )

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observability-json", type=Path, default=None)
    parser.add_argument("--budget-status-json", type=Path, default=None)
    parser.add_argument("--pilot-run-deltas-json", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args(argv)

    summary = build_summary(
        observability=_load_json(args.observability_json),
        budget_status=_load_json(args.budget_status_json),
        pilot_deltas=_load_pilot_deltas(args.pilot_run_deltas_json),
    )
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
