"""Tests for LLM budget proof status reporter."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "ci" / "report_llm_budget_proof_status.py"
    spec = importlib.util.spec_from_file_location("report_llm_budget_proof_status", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_build_summary_not_collected_when_budget_missing() -> None:
    module = _load_module()
    summary = module.build_summary(budget=None, llm_mode="simulator", source_path=None)

    assert summary["disposition"] == "NOT_COLLECTED"
    assert summary["llmExecutionMode"] == "simulator"


def test_build_summary_collected_from_budget_payload() -> None:
    module = _load_module()
    summary = module.build_summary(
        budget={
            "monthlyBudgetMonitoringActive": True,
            "blocksAdditionalLlmExecution": False,
            "warnFraction": 0.75,
            "hardCapUtilizationFraction": 0.2,
            "utcMonth": "2026-05",
        },
        llm_mode="real",
        source_path="llm-budget-status.json",
    )

    assert summary["disposition"] == "COLLECTED"
    assert summary["monthlyBudgetMonitoringActive"] is True
