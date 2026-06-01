"""Unit tests for TB-166 release real-mode claim gate."""

from __future__ import annotations

import json
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from check_release_real_mode_claim import evaluate_release_real_mode_claim  # noqa: E402


def test_committed_fixtures_cover_all_four_agent_types() -> None:
    agent_dir = _REPO_ROOT / "tests" / "eval-corpus" / "agent-results"
    disposition, rows = evaluate_release_real_mode_claim(
        agent_results_dir=agent_dir,
        gate_json=None,
        require_gate=False,
        max_gate_age_days=30,
        allow_simulator_only=False,
    )

    fixture_row = next(row for row in rows if row["check"].startswith("Committed"))
    assert fixture_row["result"] == "PASS"
    assert disposition in {"WARN", "PASS"}


def test_missing_agent_type_fails() -> None:
    disposition, rows = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=_REPO_ROOT / "artifacts" / "release" / "missing-gate.json",
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=False,
    )

    assert disposition == "HOLD"
    assert any(row["result"] == "FAIL" for row in rows)


def test_simulator_only_override_passes() -> None:
    disposition, rows = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=None,
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=True,
    )

    assert disposition == "PASS"
    assert rows[0]["check"] == "Simulator-only override"


def test_gate_pass_with_pipeline_profile(tmp_path: Path) -> None:
    gate = tmp_path / "gate.json"
    gate.write_text(
        json.dumps(
            {
                "schema": "archlucid.real-llm-evidence-gate.v2",
                "generatedUtc": "2026-06-01T12:00:00Z",
                "disposition": "PASS",
                "fullPipelineProfile": {"mergeSuccess": True},
            }
        ),
        encoding="utf-8",
    )

    disposition, rows = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=gate,
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=False,
    )

    assert disposition == "PASS"
    assert any(row["check"] == "Full pipeline profile" and row["result"] == "PASS" for row in rows)
