#!/usr/bin/env python3
"""Summarize capacity/performance smoke evidence (assessment improvement #26)."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE = REPO_ROOT / "scripts/ci/fixtures/capacity_performance_evidence.json"


def load_scenarios(path: Path) -> list[dict[str, object]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    scenarios = payload.get("scenarios")

    if not isinstance(scenarios, list):
        raise ValueError(f"{path} must contain scenarios array")

    return scenarios


def build_summary(root: Path, scenarios: list[dict[str, object]]) -> dict[str, object]:
    rows: list[dict[str, object]] = []
    measured = 0

    for scenario in scenarios:
        artifact_rel = str(scenario.get("artifactPath", ""))
        artifact_path = root / artifact_rel if artifact_rel else None
        has_artifact = artifact_path is not None and artifact_path.is_file()
        environment_class = str(scenario.get("environmentClass", "unknown"))
        disposition = "PASS" if has_artifact else "INCONCLUSIVE"

        if has_artifact:
            measured += 1

        rows.append(
            {
                "name": scenario.get("name"),
                "scenario": scenario.get("scenario"),
                "environmentClass": environment_class,
                "requestMix": scenario.get("requestMix"),
                "p95LatencyMs": scenario.get("p95LatencyMs") if has_artifact else None,
                "failureRatePercent": scenario.get("failureRatePercent") if has_artifact else None,
                "disposition": disposition,
                "artifactPath": artifact_rel if has_artifact else None,
                "exclusions": scenario.get("exclusions"),
            }
        )

    overall = "PASS" if measured == len(scenarios) and len(scenarios) > 0 else "INCONCLUSIVE"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "overallDisposition": overall,
        "buyerSafeEvidence": overall == "PASS",
        "contractualScaleGuarantee": False,
        "measuredScenarioCount": measured,
        "scenarioCount": len(scenarios),
        "scenarios": rows,
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Capacity and performance evidence rollup",
        "",
        f"**Overall disposition:** {summary.get('overallDisposition')}",
        "",
        "> Smoke/CI evidence only — not a contractual throughput or latency guarantee.",
        "",
        "| Scenario | Environment | Disposition | p95 (ms) | Failure rate |",
        "| --- | --- | --- | --- | --- |",
    ]

    for row in summary.get("scenarios", []):
        if not isinstance(row, dict):
            continue

        lines.append(
            "| {name} | {env} | {disp} | {p95} | {fail} |".format(
                name=row.get("name"),
                env=row.get("environmentClass"),
                disp=row.get("disposition"),
                p95=row.get("p95LatencyMs") if row.get("p95LatencyMs") is not None else "n/a",
                fail=row.get("failureRatePercent") if row.get("failureRatePercent") is not None else "n/a",
            )
        )

    lines.extend(
        [
            "",
            "Canonical methodology: docs/library/PERFORMANCE_BASELINES.md · docs/library/LOAD_TEST_BASELINE.md",
            "",
        ]
    )

    return "\n".join(lines)


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Report capacity/performance evidence rollup.")
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    scenarios = load_scenarios(FIXTURE)
    summary = build_summary(REPO_ROOT, scenarios)
    markdown = render_markdown(summary)

    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.write_text(markdown, encoding="utf-8")
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(f"capacity/performance evidence: {summary['overallDisposition']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
