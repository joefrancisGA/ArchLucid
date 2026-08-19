#!/usr/bin/env python3
"""Classify simulator/live divergence for RC release evidence (assessment Tier 1 #2)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.simulator-live-divergence.v1"

# Owner thresholds (2026-06-11): block below green-bar floors or >0.05 p50 drop; warn 0.02–0.05 drop.
_P50_FLOOR = 0.70
_P10_FLOOR = 0.50
_TRACE_FLOOR = 0.80
_BLOCK_RELATIVE_DROP = 0.05
_WARN_RELATIVE_DROP = 0.02


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_summary(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("summary root must be an object")

    return payload


def classify_simulator_live_divergence(summary: dict[str, Any]) -> dict[str, Any]:
    has_real = bool(summary.get("hasRealEvidence"))
    fallback = bool(summary.get("fallbackToSimulator"))
    structural = bool(summary.get("structuralComplete", True))
    rejected = bool(summary.get("qualityGateRejected"))
    p50 = summary.get("semanticScoreP50")
    p10 = summary.get("semanticScoreP10")
    baseline_p50 = summary.get("baselineSemanticScoreP50")
    trace_mean = summary.get("explainabilityTraceCompletenessMean")
    owner_note = str(summary.get("ownerDivergenceNote") or "").strip()
    owner_signoff = str(summary.get("ownerSignoff") or "").strip()
    material_drift_fields = (
        "topLineRecommendationChanged",
        "severityChanged",
        "evidenceBasisChanged",
        "roiImplicationChanged",
        "compliancePostureChanged",
        "highCriticalFindingOutcomeChanged",
    )

    blocking_reasons: list[str] = []
    warn_reasons: list[str] = []
    material_drift_reasons: list[str] = []

    for field in material_drift_fields:
        if summary.get(field) is True:
            material_drift_reasons.append(field)

    if fallback:
        blocking_reasons.append("fallback-to-simulator cannot count as live evidence")

    if not has_real:
        classification = "no-real-evidence"
        release_blocking = True
    elif fallback:
        classification = "release-blocking-drift"
        release_blocking = True
    elif not structural:
        classification = "structural-pass-only"
        release_blocking = True
        blocking_reasons.append("structural completeness not satisfied")
    else:
        classification = "accepted-full-real"
        release_blocking = False

        for field in material_drift_reasons:
            blocking_reasons.append(f"material simulator/live drift: {field}")

        if isinstance(p50, (int, float)) and float(p50) < _P50_FLOOR:
            blocking_reasons.append(f"semantic p50 {float(p50):.3f} < {_P50_FLOOR}")

        if isinstance(p10, (int, float)) and float(p10) < _P10_FLOOR:
            blocking_reasons.append(f"semantic p10 {float(p10):.3f} < {_P10_FLOOR}")

        if isinstance(trace_mean, (int, float)) and float(trace_mean) < _TRACE_FLOOR:
            blocking_reasons.append(f"trace completeness {float(trace_mean):.3f} < {_TRACE_FLOOR}")

        if rejected:
            blocking_reasons.append("quality gate rejected outcome on cohort")

        if isinstance(p50, (int, float)) and isinstance(baseline_p50, (int, float)):
            drop = round(float(baseline_p50) - float(p50), 4)

            if drop > _BLOCK_RELATIVE_DROP:
                blocking_reasons.append(f"p50 drop {drop:.3f} > {_BLOCK_RELATIVE_DROP} vs baseline")
            elif drop >= _WARN_RELATIVE_DROP:
                warn_reasons.append(f"p50 drop {drop:.3f} in warn band ({_WARN_RELATIVE_DROP}–{_BLOCK_RELATIVE_DROP})")

        if blocking_reasons:
            classification = "release-blocking-drift"
            release_blocking = True
        elif warn_reasons:
            if owner_note and owner_signoff:
                classification = "accepted-with-owner-note"
                release_blocking = False
            else:
                classification = "semantic-drift-investigate"
                release_blocking = False

    buyer_facing_full_real_blocked = release_blocking or classification in {
        "no-real-evidence",
        "release-blocking-drift",
        "structural-pass-only",
    }

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "classification": classification,
        "releaseBlocking": release_blocking,
        "buyerFacingFullRealBlocked": buyer_facing_full_real_blocked,
        "blockingReasons": blocking_reasons,
        "warnReasons": warn_reasons,
        "materialDriftFields": material_drift_reasons,
        "thresholds": {
            "semanticP50Floor": _P50_FLOOR,
            "semanticP10Floor": _P10_FLOOR,
            "traceCompletenessFloor": _TRACE_FLOOR,
            "blockRelativeP50Drop": _BLOCK_RELATIVE_DROP,
            "warnRelativeP50Drop": _WARN_RELATIVE_DROP,
        },
        "canonicalCohortModel": summary.get("canonicalCohortModel") or "gpt-4o",
        "canonicalEvidenceSource": summary.get("canonicalEvidenceSource")
        or "staging Azure OpenAI deployment",
        "ownerSignoffRequiredForWarnBand": bool(warn_reasons),
        "ownerSignoffPresent": bool(owner_signoff),
        "ownerDivergenceNotePresent": bool(owner_note),
    }


def render_markdown(result: dict[str, Any]) -> str:
    lines = [
        "# Simulator / live divergence classification",
        "",
        f"Generated UTC: **{result['generatedUtc']}**",
        "",
        f"**Classification:** **{result['classification']}**",
        f"**Buyer-facing full-real blocked:** **{result['buyerFacingFullRealBlocked']}**",
        "",
        f"Canonical cohort model: `{result['canonicalCohortModel']}`",
        f"Canonical evidence source: {result['canonicalEvidenceSource']}",
        "",
    ]

    if result["blockingReasons"]:
        lines.append("## Blocking reasons")
        lines.append("")

        for reason in result["blockingReasons"]:
            lines.append(f"- {reason}")

        lines.append("")

    if result["warnReasons"]:
        lines.append("## Warn band (owner signoff required to ship)")
        lines.append("")

        for reason in result["warnReasons"]:
            lines.append(f"- {reason}")

        lines.append("")

    lines.append(
        "Fallback-to-simulator rows must never be counted as live evidence. "
        "Accepted-with-owner-note requires owner/release-owner signoff recorded in the release evidence bundle."
    )
    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--summary-json", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument(
        "--enforce-buyer-facing",
        action="store_true",
        help="Exit non-zero when buyerFacingFullRealBlocked is true.",
    )
    args = parser.parse_args(argv)

    summary = _load_summary(args.summary_json)
    result = classify_simulator_live_divergence(summary)

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(result), encoding="utf-8")

    print(f"Simulator/live divergence: {result['classification']}")

    if args.enforce_buyer_facing and result["buyerFacingFullRealBlocked"]:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
