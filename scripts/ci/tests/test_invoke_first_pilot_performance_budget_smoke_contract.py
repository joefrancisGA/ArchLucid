"""Text-level guards for Invoke-FirstPilotPerformanceBudgetSmoke.ps1."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "Invoke-FirstPilotPerformanceBudgetSmoke.ps1"


def test_script_references_budget_evaluator_and_simulator_seed() -> None:
    text = SCRIPT.read_text(encoding="utf-8")

    assert "improvement #10" in text.lower() or "improvementNumber" in text or "evaluate_first_pilot_performance_budget.py" in text
    assert "evaluate_first_pilot_performance_budget.py" in text
    assert "Simulator" in text
    assert "performance-budget-smoke.json" in text
    assert "deterministic" in text.lower() or "seeded" in text.lower()


def test_script_does_not_require_live_eval_smoke_script() -> None:
    text = SCRIPT.read_text(encoding="utf-8")

    assert "run-eval-smoke.ps1" not in text
