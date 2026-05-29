#!/usr/bin/env python3
"""First-pilot timing budget evidence — measured vs documented targets vs missing."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

# Documented operator narrative only — not a measured benchmark.
GUIDANCE_TARGETS: tuple[dict[str, str], ...] = (
    {
        "phaseKey": "evaluator_first_pass",
        "label": "Hosted evaluator first pass (buyer SaaS)",
        "guidanceSource": "docs/onboarding/EVALUATION_GUIDE.md",
        "guidanceNote": "Roughly thirty minutes end-to-end on a normal connection (five-step buyer path).",
    },
    {
        "phaseKey": "core_pilot_commit",
        "label": "Operator Core Pilot through first commit",
        "guidanceSource": "docs/CORE_PILOT.md",
        "guidanceNote": "Four-step path to committed manifest; wall-clock varies by evidence upload and execute mode.",
    },
)


STAGING_STEP_KEYS: tuple[tuple[str, str], ...] = (
    ("health_live", "Health live"),
    ("health_ready", "Health ready"),
    ("version", "Version"),
    ("create_run", "Create review"),
    ("poll_ready", "Execute and poll"),
    ("commit", "Commit manifest"),
    ("get_manifest", "Fetch manifest"),
    ("list_artifacts", "List artifacts"),
    ("sponsor_export", "Sponsor export"),
)


def load_json(path: Path | None) -> dict | None:
    if path is None or not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} is not a JSON object")

    return payload


def staging_rows_from_baseline(baseline: dict | None) -> list[dict[str, object]]:
    if baseline is None:
        return []

    steps = baseline.get("steps")

    if not isinstance(steps, list):
        return []

    rows: list[dict[str, object]] = []

    for step in steps:
        if not isinstance(step, dict):
            continue

        if step.get("status") != "RUN":
            continue

        rows.append(
            {
                "phaseKey": str(step.get("stepKey", "unknown")),
                "label": str(step.get("stepLabel", "step")),
                "collectionStatus": "MEASURED",
                "elapsedMs": step.get("elapsedMs"),
                "source": "first-pilot-performance-baseline.json",
                "basisLabel": "Measured (staging-smoke; not load test)",
            },
        )

    return rows


def build_timing_budget(
    *,
    performance_baseline_path: Path | None,
    proof_collection_elapsed_ms: int | None,
) -> dict[str, object]:
    baseline = load_json(performance_baseline_path)
    measured = staging_rows_from_baseline(baseline)

    if proof_collection_elapsed_ms is not None:
        measured.append(
            {
                "phaseKey": "proof_collection",
                "label": "First-pilot proof pipeline (this run)",
                "collectionStatus": "MEASURED",
                "elapsedMs": proof_collection_elapsed_ms,
                "source": "collect-first-pilot-proof.ps1",
                "basisLabel": "Measured (orchestration wall clock)",
            },
        )

    guidance = [
        {
            "phaseKey": row["phaseKey"],
            "label": row["label"],
            "collectionStatus": "GUIDANCE_ONLY",
            "elapsedMs": None,
            "source": row["guidanceSource"],
            "basisLabel": "Documented target (not measured in this proof folder)",
            "guidanceNote": row["guidanceNote"],
        }
        for row in GUIDANCE_TARGETS
    ]

    missing = [
        {
            "phaseKey": key,
            "label": label,
            "collectionStatus": "NOT_COLLECTED",
            "elapsedMs": None,
            "source": "staging-smoke-results.json",
            "basisLabel": "Missing — attach -StagingSmokeResultsPath to proof",
        }
        for key, label in STAGING_STEP_KEYS
        if not any(row.get("phaseKey") == key for row in measured)
    ]

    disposition = "PASS" if measured else "WARN"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "measuredPhases": measured,
        "guidanceOnlyPhases": guidance,
        "missingPhases": missing,
        "sponsorOutputRule": "Do not cite timing in sponsor materials without basisLabel MEASURED or explicit GUIDANCE_ONLY caveat.",
    }


def format_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# First-pilot timing budget evidence",
        "",
        "Distinguishes **measured** wall-clock steps, **guidance-only** targets from docs, and **missing** data.",
        "Not a load test or SLA proof.",
        "",
        f"| Disposition | **{summary['disposition']}** |",
        "",
        f"**Sponsor rule:** {summary['sponsorOutputRule']}",
        "",
        "## Measured phases",
        "",
    ]

    measured = summary.get("measuredPhases") or []

    if not measured:
        lines.append("- None — attach staging-smoke timings via `-StagingSmokeResultsPath`.")
    else:
        for row in measured:
            lines.append(
                f"- **{row['label']}** — {row['elapsedMs']} ms ({row['basisLabel']}; `{row['source']}`)",
            )

    lines.extend(["", "## Guidance-only (documentation)", ""])

    for row in summary.get("guidanceOnlyPhases") or []:
        lines.append(f"- **{row['label']}** — {row['guidanceNote']} (`{row['source']}`)")

    lines.extend(["", "## Missing in this proof folder", ""])

    missing = summary.get("missingPhases") or []

    if not missing:
        lines.append("- None (all staging-smoke steps measured or not applicable).")
    else:
        for row in missing[:6]:
            lines.append(f"- **{row['label']}** — {row['basisLabel']}")

    if len(missing) > 6:
        lines.append(f"- … and {len(missing) - 6} more staging steps without timings.")

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--performance-baseline-json", type=Path, default=None)
    parser.add_argument("--proof-collection-elapsed-ms", type=int, default=None)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    summary = build_timing_budget(
        performance_baseline_path=args.performance_baseline_json,
        proof_collection_elapsed_ms=args.proof_collection_elapsed_ms,
    )

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(format_markdown(summary), encoding="utf-8")

    print(f"first-pilot timing budget: {summary['disposition']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
