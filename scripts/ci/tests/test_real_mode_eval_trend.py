"""TB-683 real-mode eval trend artifact and consecutive regression checks."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


def _load_module(name: str, relative_path: str):
    path = Path(__file__).resolve().parents[1] / relative_path
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def test_build_json_trend_report_includes_real_mode_agents():
    eval_mod = _load_module("eval_agent_corpus", "eval_agent_corpus.py")
    rows = [
        {
            "id": "corpus-real-mode-smoke",
            "quality": {
                "mode": "real",
                "gate_outcome": "accepted",
                "structural_ratio": 0.95,
                "overall_semantic": 0.88,
                "faithfulness_support_ratio": 0.7,
            },
        },
        {
            "id": "corpus-azure-web-app",
            "quality": {
                "mode": "simulator",
                "gate_outcome": "accepted",
            },
        },
    ]
    gate_snapshot = {"baseline_failed": False, "real_gate_failed": False}

    doc = eval_mod.build_json_trend_report(rows, gate_snapshot=gate_snapshot)

    assert doc["realModeRollup"]["total"] == 1
    assert len(doc["agents"]) == 1
    assert doc["agents"][0]["scenarioId"] == "corpus-real-mode-smoke"
    assert doc["agents"][0]["aggregateScore"] is not None


def test_check_consecutive_regression_warns_on_two_nights(tmp_path: Path):
    trend_mod = _load_module(
        "assert_real_mode_eval_consecutive_regression",
        "assert_real_mode_eval_consecutive_regression.py",
    )
    payload = {
        "gateSnapshot": {"baseline_failed": True},
        "baselineComparisons": [{"failed": True}],
    }
    current = tmp_path / "current.json"
    previous = tmp_path / "previous.json"
    current.write_text(json.dumps(payload), encoding="utf-8")
    previous.write_text(json.dumps(payload), encoding="utf-8")

    warnings = trend_mod.check_consecutive_regression(
        trend_mod._load_trend(current),
        trend_mod._load_trend(previous),
    )

    assert len(warnings) == 1
