"""Tests for bundle-derived simulator/live divergence synthesis."""

from __future__ import annotations

import json
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from build_simulator_live_divergence_from_bundle import build_summary_input  # noqa: E402


def test_missing_gate_yields_no_real_evidence(tmp_path: Path) -> None:
    summary = build_summary_input(tmp_path)

    assert summary["hasRealEvidence"] is False
    assert summary["fallbackToSimulator"] is False


def test_real_gate_without_fallback_counts_as_real_evidence(tmp_path: Path) -> None:
    (tmp_path / "real-llm-evidence-gate.json").write_text(
        json.dumps(
            {
                "executionMode": "real",
                "overallOutcome": "PASS",
                "generatedUtc": "2026-06-14T12:00:00Z",
            }
        )
        + "\n",
        encoding="utf-8",
    )

    summary = build_summary_input(tmp_path)

    assert summary["hasRealEvidence"] is True
    assert summary["structuralComplete"] is True


def test_fallback_blocks_real_evidence(tmp_path: Path) -> None:
    (tmp_path / "real-llm-evidence-gate.json").write_text(
        json.dumps(
            {
                "executionMode": "real",
                "fallbackToSimulator": True,
                "overallOutcome": "WARN",
            }
        )
        + "\n",
        encoding="utf-8",
    )

    summary = build_summary_input(tmp_path)

    assert summary["hasRealEvidence"] is False
    assert summary["fallbackToSimulator"] is True
