"""Tests for simulator/live divergence RC classifier."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from check_simulator_live_divergence import classify_simulator_live_divergence  # noqa: E402


def test_no_real_evidence_blocks_buyer_facing() -> None:
    result = classify_simulator_live_divergence({"hasRealEvidence": False})

    assert result["classification"] == "no-real-evidence"
    assert result["buyerFacingFullRealBlocked"] is True


def test_fallback_to_simulator_is_release_blocking() -> None:
    result = classify_simulator_live_divergence(
        {
            "hasRealEvidence": True,
            "fallbackToSimulator": True,
            "structuralComplete": True,
            "semanticScoreP50": 0.85,
            "semanticScoreP10": 0.70,
            "explainabilityTraceCompletenessMean": 0.9,
        }
    )

    assert result["classification"] == "release-blocking-drift"
    assert any("fallback" in reason for reason in result["blockingReasons"])


def test_warn_band_requires_owner_note_for_acceptance() -> None:
    result = classify_simulator_live_divergence(
        {
            "hasRealEvidence": True,
            "structuralComplete": True,
            "semanticScoreP50": 0.73,
            "semanticScoreP10": 0.62,
            "baselineSemanticScoreP50": 0.78,
            "explainabilityTraceCompletenessMean": 0.9,
        }
    )

    assert result["classification"] == "semantic-drift-investigate"
    assert result["ownerSignoffRequiredForWarnBand"] is True


def test_accepted_with_owner_note_in_warn_band() -> None:
    result = classify_simulator_live_divergence(
        {
            "hasRealEvidence": True,
            "structuralComplete": True,
            "semanticScoreP50": 0.73,
            "semanticScoreP10": 0.62,
            "baselineSemanticScoreP50": 0.78,
            "explainabilityTraceCompletenessMean": 0.9,
            "ownerDivergenceNote": "Known prompt delta; staging cohort reviewed.",
            "ownerSignoff": "release-owner",
        }
    )

    assert result["classification"] == "accepted-with-owner-note"
    assert result["buyerFacingFullRealBlocked"] is False


def test_blocking_on_green_bar_floor() -> None:
    result = classify_simulator_live_divergence(
        {
            "hasRealEvidence": True,
            "structuralComplete": True,
            "semanticScoreP50": 0.65,
            "semanticScoreP10": 0.55,
            "explainabilityTraceCompletenessMean": 0.9,
        }
    )

    assert result["classification"] == "release-blocking-drift"


def test_material_recommendation_drift_blocks_even_with_good_scores() -> None:
    result = classify_simulator_live_divergence(
        {
            "hasRealEvidence": True,
            "structuralComplete": True,
            "semanticScoreP50": 0.92,
            "semanticScoreP10": 0.86,
            "baselineSemanticScoreP50": 0.93,
            "explainabilityTraceCompletenessMean": 0.95,
            "topLineRecommendationChanged": True,
        }
    )

    assert result["classification"] == "release-blocking-drift"
    assert result["buyerFacingFullRealBlocked"] is True
    assert "topLineRecommendationChanged" in result["materialDriftFields"]
