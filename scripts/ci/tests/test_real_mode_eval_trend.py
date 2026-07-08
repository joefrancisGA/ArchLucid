"""TB-683 nightly real-mode eval trend artifact helpers."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


def _load_eval_agent_corpus():
    path = Path(__file__).resolve().parents[1] / "eval_agent_corpus.py"
    spec = importlib.util.spec_from_file_location("eval_agent_corpus", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["eval_agent_corpus"] = mod
    spec.loader.exec_module(mod)
    return mod


def _load_assert_trend():
    path = Path(__file__).resolve().parents[1] / "assert_real_mode_eval_regression_trend.py"
    spec = importlib.util.spec_from_file_location("assert_real_mode_eval_regression_trend", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["assert_real_mode_eval_regression_trend"] = mod
    spec.loader.exec_module(mod)
    return mod


def test_build_json_trend_report_includes_real_mode_agents(tmp_path):
    mod = _load_eval_agent_corpus()
    rows = [
        {
            "id": "scenario-real-mode-smoke",
            "quality": {
                "mode": "real",
                "agent_type": "Topology",
                "gate_outcome": "accepted",
                "structural_ratio": 0.9,
                "overall_semantic": 0.8,
                "aggregate_score": 0.85,
            },
        }
    ]
    gate_snapshot = {"would_fail_exit": False}

    payload = mod.build_json_trend_report(rows, tmp_path, gate_snapshot=gate_snapshot)

    assert payload["schema"] == "archlucid.real-mode-eval-nightly.v1"
    assert len(payload["agents"]) == 1
    assert payload["agents"][0]["agentType"] == "Topology"
    assert payload["meanEvaluatedAggregateScore"] == 0.85


def test_assert_regression_trend_warns_on_two_floor_breaches(tmp_path, capsys, monkeypatch):
    trend_mod = _load_eval_agent_corpus()
    assert_mod = _load_assert_trend()
    history = tmp_path / "artifacts" / "real-mode-eval-nightly"
    prior_dir = history / "2026-07-06"
    previous_dir = history / "2026-07-07"
    current_dir = history / "2026-07-08"
    gate = {"would_fail_exit": True}
    rows = [
        {
            "id": "scenario-real-mode-smoke",
            "quality": {
                "mode": "real",
                "agent_type": "Topology",
                "aggregate_score": 0.5,
            },
        }
    ]

    for day_dir in (prior_dir, previous_dir, current_dir):
        day_dir.mkdir(parents=True)
        trend_mod.write_json_trend_report(
            day_dir / "trend.json",
            trend_mod.build_json_trend_report(rows, tmp_path, gate_snapshot=gate),
        )

    monkeypatch.setattr(
        sys,
        "argv",
        [
            "assert_real_mode_eval_regression_trend.py",
            "--current",
            str(current_dir / "trend.json"),
            "--history-root",
            str(history),
        ],
    )
    exit_code = assert_mod.main()

    captured = capsys.readouterr()

    assert exit_code == 0
    assert "Two consecutive nightly real-mode eval runs breached enforced floors" in captured.err
