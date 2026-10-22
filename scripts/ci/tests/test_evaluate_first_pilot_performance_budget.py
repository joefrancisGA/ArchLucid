"""Tests for first-pilot performance budget evaluator."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "ci" / "evaluate_first_pilot_performance_budget.py"
    spec = importlib.util.spec_from_file_location("evaluate_first_pilot_performance_budget", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_simulator_seed_timings_pass_soft_budget() -> None:
    module = _load_module()
    summary = module.evaluate_performance_budget(
        timings_ms={
            "health_live": 80,
            "create_run": 900,
            "poll_ready": 165000,
            "commit": 1100,
        },
        execution_mode="Simulator",
    )

    assert summary["overallDisposition"] == "PASS"
    assert summary["observedP95Seconds"] <= summary["softBudgetP95Seconds"]
    assert "not an SLA" in summary["readinessNote"]


def test_simulator_hard_budget_hold() -> None:
    module = _load_module()
    summary = module.evaluate_performance_budget(
        timings_ms={"poll_ready": 600000},
        execution_mode="Simulator",
    )

    assert summary["overallDisposition"] == "HOLD"


def test_real_mode_soft_budget_warn() -> None:
    module = _load_module()
    summary = module.evaluate_performance_budget(
        timings_ms={"poll_ready": 960000},
        execution_mode="Real",
    )

    assert summary["overallDisposition"] == "WARN"
