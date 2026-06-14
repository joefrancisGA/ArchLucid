#!/usr/bin/env python3
"""Synthesize simulator/live divergence input from release bundle artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from check_simulator_live_divergence import classify_simulator_live_divergence, render_markdown  # noqa: E402
from release_evidence_common import load_json, repo_root  # noqa: E402


def _execution_mode(payload: dict[str, Any] | None) -> str:
    if payload is None:
        return ""

    return str(payload.get("executionMode") or payload.get("executionModeLabel") or "").strip().lower()


def build_summary_input(bundle_dir: Path) -> dict[str, Any]:
    gate = load_json(bundle_dir / "real-llm-evidence-gate.json")
    claim = load_json(bundle_dir / "real-mode-claim-gate.json")
    ai_quality = load_json(bundle_dir / "ai-quality-release-summary.json")

    execution_mode = _execution_mode(gate) or _execution_mode(claim)
    fallback = bool(gate and gate.get("fallbackToSimulator")) or bool(
        claim and claim.get("fallbackToSimulator")
    )

    has_real = execution_mode == "real" and not fallback

    if gate is not None:
        outcome = str(gate.get("overallOutcome") or "").upper()
        structural_complete = outcome in {"PASS", "WARN"}
        quality_rejected = outcome in {"FAIL", "HOLD"}
    else:
        structural_complete = False
        quality_rejected = False

    summary: dict[str, Any] = {
        "hasRealEvidence": has_real,
        "fallbackToSimulator": fallback,
        "structuralComplete": structural_complete,
        "qualityGateRejected": quality_rejected,
    }

    if isinstance(ai_quality, dict):
        for key in (
            "semanticScoreP50",
            "semanticScoreP10",
            "baselineSemanticScoreP50",
            "explainabilityTraceCompletenessMean",
        ):
            if key in ai_quality:
                summary[key] = ai_quality.get(key)

        for drift_key in (
            "topLineRecommendationChanged",
            "severityChanged",
            "evidenceBasisChanged",
            "roiImplicationChanged",
            "compliancePostureChanged",
            "highCriticalFindingOutcomeChanged",
        ):
            if drift_key in ai_quality:
                summary[drift_key] = ai_quality.get(drift_key)

    if isinstance(gate, dict):
        for key in ("ownerDivergenceNote", "ownerSignoff", "canonicalCohortModel", "canonicalEvidenceSource"):
            if key in gate and gate.get(key) not in (None, ""):
                summary[key] = gate.get(key)

    if isinstance(claim, dict) and claim.get("ownerDivergenceNote"):
        summary["ownerDivergenceNote"] = claim.get("ownerDivergenceNote")

    if isinstance(claim, dict) and claim.get("ownerSignoff"):
        summary["ownerSignoff"] = claim.get("ownerSignoff")

    return summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument(
        "--enforce-buyer-facing",
        action="store_true",
        help="Exit non-zero when buyerFacingFullRealBlocked is true.",
    )
    args = parser.parse_args(argv)

    bundle_dir = args.bundle_dir.resolve()
    summary_input = build_summary_input(bundle_dir)
    result = classify_simulator_live_divergence(summary_input)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(result), encoding="utf-8")

    print(f"Simulator/live divergence (bundle-derived): {result['classification']}")

    if args.enforce_buyer_facing and result["buyerFacingFullRealBlocked"]:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
