"""Parity smoke tests for scripts/ci/eval_agent_corpus.py scoring helpers."""

from __future__ import annotations

from pathlib import Path

import pytest

# Import module under test via importlib (not a package).
import importlib.util


def _load_eval_agent_corpus():
    path = Path(__file__).resolve().parents[1] / "eval_agent_corpus.py"
    spec = importlib.util.spec_from_file_location("eval_agent_corpus", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _golden_valid_path(repo_root: Path) -> Path:
    return (
        repo_root
        / "ArchLucid.AgentRuntime.Tests"
        / "Fixtures"
        / "GoldenAgentResults"
        / "golden-agent-result-valid.json"
    )


def test_score_committed_agent_result_matches_golden_valid_shape():
    mod = _load_eval_agent_corpus()
    repo = Path(__file__).resolve().parents[3]
    p = _golden_valid_path(repo)
    assert p.is_file(), f"missing {p}"

    scored = mod.score_committed_agent_result_json(p.read_text(encoding="utf-8"))
    assert scored["parse_failure"] is False
    assert float(scored["structural_ratio"]) == pytest.approx(1.0)
    assert float(scored["overall_semantic"]) > 0.5
    assert scored["gate_outcome"] in ("accepted", "warned", "rejected")


def test_score_committed_agent_result_invalid_json_is_parse_failure():
    mod = _load_eval_agent_corpus()
    scored = mod.score_committed_agent_result_json("{not json")
    assert scored["parse_failure"] is True
    assert float(scored["structural_ratio"]) == pytest.approx(0.0)
