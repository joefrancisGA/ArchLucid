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
        "guidanceSource": "docs/onboarding/EVALUATOR_WORKBOOK.md",
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

_FIRST_VALUE_STEP_KEYS: tuple[str, ...] = (
    "create_run",
    "poll_ready",
    "commit",
    "get_manifest",
    "list_artifacts",
)

_PASS_MAX_MS = 10 * 60 * 1000
_WARN_MAX_MS = 20 * 60 * 1000


def _sum_elapsed_ms(measured: list[dict[str, object]], keys: tuple[str, ...]) -> int | None:
    total = 0
    found = 0

    for key in keys:
        row = next((item for item in measured if item.get("phaseKey") == key), None)

        if row is None:
            return None

        elapsed = row.get("elapsedMs")

        if not isinstance(elapsed, int):
            return None

        total += elapsed
        found += 1

    return total if found == len(keys) else None


def classify_first_value_commit_budget(total_ms: int | None) -> dict[str, object]:
    if total_ms is None:
        return {
            "disposition": "HOLD",
            "totalElapsedMs": None,
            "passMaxMs": _PASS_MAX_MS,
            "warnMaxMs": _WARN_MAX_MS,
            "detail": "Missing measured create→commit→artifact steps — attach staging-smoke timings.",
        }

    if total_ms <= _PASS_MAX_MS:
        disposition = "PASS"
    elif total_ms <= _WARN_MAX_MS:
        disposition = "WARN"
    else:
        disposition = "HOLD"

    return {
        "disposition": disposition,
        "totalElapsedMs": total_ms,
        "passMaxMs": _PASS_MAX_MS,
        "warnMaxMs": _WARN_MAX_MS,
        "detail": (
            f"Measured first-value path {total_ms} ms — PASS ≤ {_PASS_MAX_MS} ms, "
            f"WARN ≤ {_WARN_MAX_MS} ms, HOLD above warn max."
        ),
    }


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
    first_value_total_ms = _sum_elapsed_ms(measured, _FIRST_VALUE_STEP_KEYS)
    first_value_budget = classify_first_value_commit_budget(first_value_total_ms)

    if first_value_budget["disposition"] == "HOLD":
        disposition = "HOLD"
    elif first_value_budget["disposition"] == "WARN" and disposition == "PASS":
        disposition = "WARN"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "firstValueCommitBudget": first_value_budget,
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
        f"**First-value commit budget:** **{summary['firstValueCommitBudget']['disposition']}** "
        f"({summary['firstValueCommitBudget']['detail']})",
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
