#!/usr/bin/env python3
"""Buyer-safe AI model and prompt-pack provenance summary for pilot proof."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_observability(path: Path | None) -> dict[str, object] | None:
    if path is None or not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    return payload if isinstance(payload, dict) else None


def build_summary(*, observability: dict[str, object] | None) -> dict[str, object]:
    if observability is None:
        return {
            "generatedUtc": datetime.now(timezone.utc).isoformat(),
            "disposition": "NOT_COLLECTED",
            "llmExecutionMode": "unknown",
            "qualityGateMode": None,
            "modelDeploymentName": None,
            "promptPackVersion": None,
            "schemaValidationMode": None,
            "rawPromptIncluded": False,
            "rawCompletionIncluded": False,
        }

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "COLLECTED",
        "llmExecutionMode": observability.get("llmExecutionMode"),
        "qualityGateMode": observability.get("qualityGateMode"),
        "modelDeploymentName": observability.get("azureOpenAiDeploymentName")
        or observability.get("modelDeploymentName"),
        "promptPackVersion": observability.get("promptPackVersion")
        or observability.get("agentPromptPackVersion"),
        "schemaValidationMode": observability.get("schemaValidationMode")
        or observability.get("structuredOutputValidationMode"),
        "pilotStrictMinFaithfulnessRatio": observability.get(
            "pilotStrictMinAgentResultFaithfulnessSupportRatio"
        ),
        "rawPromptIncluded": observability.get("rawPromptIncluded") is True,
        "rawCompletionIncluded": observability.get("rawCompletionIncluded") is True,
    }


def render_markdown(summary: dict[str, object]) -> str:
    return "\n".join(
        [
            "# AI model and prompt provenance (pilot proof)",
            "",
            "> No raw prompts, completions, or secrets.",
            "",
            "| Field | Value |",
            "| --- | --- |",
            f"| Disposition | **{summary.get('disposition')}** |",
            f"| LLM execution mode | {summary.get('llmExecutionMode')} |",
            f"| Quality gate mode | {summary.get('qualityGateMode')} |",
            f"| Model deployment | {summary.get('modelDeploymentName') or 'n/a'} |",
            f"| Prompt pack version | {summary.get('promptPackVersion') or 'n/a'} |",
            f"| Schema validation | {summary.get('schemaValidationMode') or 'n/a'} |",
            "",
        ]
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observability-json", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args(argv)

    summary = build_summary(observability=_load_observability(args.observability_json))
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if summary.get("rawPromptIncluded") or summary.get("rawCompletionIncluded"):
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
