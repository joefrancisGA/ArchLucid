"""Baseline regression helpers for eval_agent_corpus.py."""

from __future__ import annotations

import importlib.util
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


def test_compare_baseline_metrics_flags_aggregate_regression():
    mod = _load_eval_agent_corpus()
    baseline = {
        "structuralCompleteness": 0.9,
        "semanticScore": 0.8,
        "faithfulnessSupportRatio": 0.0,
        "embeddingFaithfulnessMeanCosine": None,
        "aggregateScore": 0.9 * 0.25 + 0.8 * 0.30,
        "rubricVersion": "1",
    }
    current = dict(baseline)
    current["aggregateScore"] = float(baseline["aggregateScore"]) - 4.0

    result = mod.compare_baseline_metrics("scenario-a", current, baseline)

    assert result["failed"] is True
    assert "aggregateScore" in result["regressions"]


def test_write_baseline_round_trip(tmp_path):
    mod = _load_eval_agent_corpus()
    quality = {
        "mode": "simulator",
        "structural_ratio": 0.91,
        "overall_semantic": 0.82,
    }
    metrics = mod.quality_to_baseline_metrics(quality)
    path = mod.write_baseline_file(tmp_path, "corpus-azure-web-app", metrics)
    loaded = mod.load_baseline_file(tmp_path, "corpus-azure-web-app")

    assert path.is_file()
    assert loaded is not None
    assert loaded["structuralCompleteness"] == metrics["structuralCompleteness"]
