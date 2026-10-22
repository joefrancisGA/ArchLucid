#!/usr/bin/env python3
"""Render buyer-safe LLM budget posture for first-pilot proof artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def _load_payload(path: Path | None) -> dict[str, object] | None:
    if path is None or not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} is not a JSON object")

    budget = payload.get("llmBudgetStatus")

    if isinstance(budget, dict):
        return budget

    if "monthlyBudgetMonitoringActive" in payload:
        return payload

    return None


def build_summary(*, budget: dict[str, object] | None, llm_mode: str, source_path: str | None) -> dict[str, object]:
    if budget is None:
        return {
            "generatedUtc": datetime.now(timezone.utc).isoformat(),
            "disposition": "NOT_COLLECTED",
            "llmExecutionMode": llm_mode,
            "sourcePath": source_path,
            "monthlyBudgetMonitoringActive": None,
            "blocksAdditionalLlmExecution": None,
            "warnFraction": None,
            "hardCapUtilizationFraction": None,
            "utcMonth": None,
        }

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "COLLECTED",
        "llmExecutionMode": llm_mode,
        "sourcePath": source_path,
        "monthlyBudgetMonitoringActive": budget.get("monthlyBudgetMonitoringActive"),
        "blocksAdditionalLlmExecution": budget.get("blocksAdditionalLlmExecution"),
        "warnFraction": budget.get("warnFraction"),
        "hardCapUtilizationFraction": budget.get("hardCapUtilizationFraction"),
        "utcMonth": budget.get("utcMonth"),
        "effectiveHardCapUsd": budget.get("effectiveHardCapUsd"),
        "estimatedUsdPressure": budget.get("estimatedUsdPressure"),
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# LLM budget status (pilot proof)",
        "",
        "> Buyer-safe UTC-month LLM dollar budget posture. No API keys, prompts, or completion text.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Disposition | **{summary.get('disposition')}** |",
        f"| LLM execution mode (run) | **{summary.get('llmExecutionMode')}** |",
        f"| Monthly budget monitoring active | {summary.get('monthlyBudgetMonitoringActive')} |",
        f"| Blocks additional LLM execution | {summary.get('blocksAdditionalLlmExecution')} |",
        f"| UTC month | {summary.get('utcMonth') or 'n/a'} |",
        f"| Warn fraction | {summary.get('warnFraction') or 'n/a'} |",
        f"| Hard-cap utilization fraction | {summary.get('hardCapUtilizationFraction') or 'n/a'} |",
        f"| Effective hard cap (USD) | {summary.get('effectiveHardCapUsd') or 'n/a'} |",
        f"| Estimated USD pressure | {summary.get('estimatedUsdPressure') or 'n/a'} |",
        "",
        "## Interpretation",
        "",
        "- **simulator/demo-derived:** budget enforcement may be inactive or non-representative of hosted COGS.",
        "- **real/estimated:** monitor `blocksAdditionalLlmExecution` before scheduling additional execute cycles.",
        "- Missing status means the collector lacked ExecuteAuthority or budget tables are unavailable — not a product defect.",
        "",
        f"Source: `{summary.get('sourcePath') or 'not supplied'}`",
        "",
    ]

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Report LLM budget proof status.")
    parser.add_argument("--status-json", type=Path, default=None, help="llm-budget-status.json or pilot-observability-summary.json")
    parser.add_argument("--llm-mode", default="unknown")
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-summary-out", type=Path, default=None)
    args = parser.parse_args()

    status_path = args.status_json.expanduser().resolve() if args.status_json is not None else None
    budget = _load_payload(status_path)
    summary = build_summary(
        budget=budget,
        llm_mode=args.llm_mode.strip() or "unknown",
        source_path=status_path.as_posix() if status_path is not None else None,
    )

    markdown_path = args.markdown_out.expanduser().resolve()
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(render_markdown(summary), encoding="utf-8")

    if args.json_summary_out is not None:
        json_path = args.json_summary_out.expanduser().resolve()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(f"llm budget proof status: {summary['disposition']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
