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


def test_evaluate_quality_evidence_real_mode_skips_when_env_unset(monkeypatch):
    mod = _load_eval_agent_corpus()
    monkeypatch.delenv("ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT", raising=False)

    q = mod.evaluate_quality_evidence_block(
        Path("/unused"),
        "corpus-real-mode-smoke",
        {
            "mode": "real",
            "agentType": "Topology",
            "agentResultPathEnv": "ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT",
        },
    )

    assert q["skipped"] is True
    assert q.get("error") is None
    assert "evidence_captured" not in q


def test_evaluate_quality_evidence_real_mode_scores_resolved_file(monkeypatch):
    mod = _load_eval_agent_corpus()
    repo = Path(__file__).resolve().parents[3]
    golden = _golden_valid_path(repo)
    assert golden.is_file()
    env_name = "ARCHLUCID_EVAL_CORPUS_PYTEST_REAL_AGENT_TMP"
    monkeypatch.setenv(env_name, str(golden))

    q = mod.evaluate_quality_evidence_block(
        repo,
        "pytest-real",
        {
            "mode": "real",
            "agentType": "Topology",
            "agentResultPathEnv": env_name,
        },
    )

    assert q.get("skipped") is not True
    assert q.get("error") is None
    assert q.get("evidence_captured") is True
    assert q.get("parse_failure") is False
    assert float(q.get("structural_ratio") or 0) >= 0.99


def test_evaluate_quality_evidence_real_mode_requires_safe_env_var_name():
    mod = _load_eval_agent_corpus()

    q = mod.evaluate_quality_evidence_block(
        Path("."),
        "bad-env",
        {
            "mode": "real",
            "agentType": "Topology",
            "agentResultPathEnv": "9INVALID_ENV_PREFIX",
        },
    )

    assert q.get("error")
    assert "safe" in q["error"].lower() and "environment" in q["error"].lower()


def test_real_mode_quality_rollup_counts_rows():
    mod = _load_eval_agent_corpus()
    rows: list = [
        {"quality": {"mode": "real", "skipped": True}},
        {"quality": {"mode": "real", "gate_outcome": "accepted"}},
        {"quality": {"mode": "simulator", "gate_outcome": "accepted"}},
    ]
    r = mod._real_mode_quality_rollup(rows)

    assert r["total"] == 2
    assert r["skipped_no_env"] == 1
    assert r["evaluated"] == 1
    assert r["errors"] == 0
    assert r["evidence_captured"] is True
