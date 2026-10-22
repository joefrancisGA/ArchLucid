"""TB-2231 golden-cohort canary drift alert."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path


def _load_module(name: str, relative_path: str):
    path = Path(__file__).resolve().parents[1] / relative_path
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def test_collect_drift_alerts_flags_two_floor_breach_nights(tmp_path: Path) -> None:
    regression = _load_module(
        "assert_real_mode_eval_regression_trend",
        "assert_real_mode_eval_regression_trend.py",
    )
    history_root = tmp_path / "history"
    prior_dir = history_root / "2026-08-15"
    previous_dir = history_root / "2026-08-16"
    current_dir = history_root / "2026-08-17"
    payload = {"gate": {"would_fail_exit": True}, "meanEvaluatedAggregateScore": 0.5}

    for directory in (prior_dir, previous_dir, current_dir):
        directory.mkdir(parents=True)
        (directory / "trend.json").write_text(json.dumps(payload), encoding="utf-8")

    alerts = regression.collect_drift_alerts(current_dir / "trend.json", history_root)

    assert any("breached enforced floors" in alert for alert in alerts)


def test_regression_trend_enforce_exits_nonzero(tmp_path: Path, monkeypatch) -> None:
    regression = _load_module(
        "assert_real_mode_eval_regression_trend",
        "assert_real_mode_eval_regression_trend.py",
    )
    history_root = tmp_path / "history"
    previous_dir = history_root / "2026-08-16"
    current_dir = history_root / "2026-08-17"
    payload = {"gate": {"would_fail_exit": True}}

    for directory in (previous_dir, current_dir):
        directory.mkdir(parents=True)
        (directory / "trend.json").write_text(json.dumps(payload), encoding="utf-8")

    monkeypatch.setattr(
        sys,
        "argv",
        [
            "assert_real_mode_eval_regression_trend.py",
            "--current",
            str(current_dir / "trend.json"),
            "--history-root",
            str(history_root),
            "--enforce",
        ],
    )

    assert regression.main() == 1


def test_canary_drift_alert_passes_without_history(tmp_path: Path) -> None:
    current = tmp_path / "trend.json"
    current.write_text(json.dumps({"gate": {"would_fail_exit": False}}), encoding="utf-8")
    script = Path(__file__).resolve().parents[1] / "assert_golden_cohort_canary_drift_alert.py"
    completed = subprocess.run(
        [sys.executable, str(script), "--current", str(current), "--history-root", str(tmp_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    assert completed.returncode == 0
