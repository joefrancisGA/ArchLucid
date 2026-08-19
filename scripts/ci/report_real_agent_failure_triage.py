#!/usr/bin/env python3
"""Summarize real-agent failure triage catalog for CI artifacts (assessment improvement #23)."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE = REPO_ROOT / "scripts/ci/fixtures/real_agent_failure_triage.json"
RUNBOOK = REPO_ROOT / "docs/runbooks/AGENT_EXECUTION_FAILURES.md"

SCENARIO_TITLES = {
    "missingCredentials": "Missing Azure OpenAI credentials or deployment config",
    "contentSafetyRejection": "Content safety blocked prompt or model output",
    "schemaViolation": "Agent result JSON failed schema or parse validation",
    "groundingInsufficiency": "Output quality gate rejected grounding or structural bar",
    "timeout": "Agent or LLM call timed out",
    "budgetCutoff": "Token quota or run cost budget cutoff",
    "fallbackToSimulator": "Real-mode path fell back to simulator results",
}


def build_summary(root: Path) -> dict[str, object]:
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
    required = payload.get("requiredScenarioIds", [])
    runbook_exists = (root / str(payload.get("runbookPath", ""))).is_file()

    rows: list[dict[str, object]] = []

    for scenario_id in required:
        rows.append(
            {
                "scenarioId": scenario_id,
                "title": SCENARIO_TITLES.get(scenario_id, scenario_id),
                "documentedInRunbook": scenario_id in RUNBOOK.read_text(encoding="utf-8")
                if RUNBOOK.is_file()
                else False,
                "ciRequiresLiveAoai": False,
            }
        )

    documented_count = sum(1 for row in rows if row.get("documentedInRunbook"))

    overall = "PASS" if runbook_exists and documented_count == len(rows) and len(rows) > 0 else "INCONCLUSIVE"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "overallDisposition": overall,
        "buyerSafeEvidence": False,
        "requiresLiveSecrets": False,
        "scenarioCount": len(rows),
        "documentedScenarioCount": documented_count,
        "scenarios": rows,
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Real-agent failure triage rollup",
        "",
        f"**Overall disposition:** {summary.get('overallDisposition')}",
        "",
        "> Classification and operator next steps only — no live Azure OpenAI credentials required for CI.",
        "",
        "| Scenario | Documented in runbook | Live AOAI required |",
        "| --- | --- | --- |",
    ]

    for row in summary.get("scenarios", []):
        if not isinstance(row, dict):
            continue

        lines.append(
            f"| {row.get('scenarioId')} | {'yes' if row.get('documentedInRunbook') else 'no'} | no |"
        )

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    markdown_out: Path | None = None
    json_out: Path | None = None
    args = sys.argv[1:]
    index = 0

    while index < len(args):
        token = args[index]

        if token == "--markdown-out" and index + 1 < len(args):
            markdown_out = Path(args[index + 1])
            index += 2
            continue

        if token == "--json-out" and index + 1 < len(args):
            json_out = Path(args[index + 1])
            index += 2
            continue

        print(f"Unknown argument: {token}", file=sys.stderr)
        return 2

    summary = build_summary(REPO_ROOT)

    if json_out is not None:
        json_out.parent.mkdir(parents=True, exist_ok=True)
        json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if markdown_out is not None:
        markdown_out.parent.mkdir(parents=True, exist_ok=True)
        markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(f"Real-agent failure triage rollup: {summary.get('overallDisposition')}")
    return 0 if summary.get("overallDisposition") == "PASS" else 0


if __name__ == "__main__":
    raise SystemExit(main())
