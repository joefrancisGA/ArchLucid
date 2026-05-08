"""Parity smoke tests for scripts/ci/eval_agent_corpus.py scoring helpers."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

# Import module under test via importlib (not a package).


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


def _del_eval_corpus_real_mode_agent_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Clear env vars referenced by tests/eval-corpus real-mode qualityEvidence rows."""

    for name in (
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT",
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_COST_AGENT_RESULT",
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_COMPLIANCE_AGENT_RESULT",
        "ARCHLUCID_EVAL_CORPUS_REAL_MODE_CRITIC_AGENT_RESULT",
    ):
        monkeypatch.delenv(name, raising=False)


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


def test_main_default_no_real_require_exits_zero_when_real_skipped(monkeypatch):
    """PR-style run: optional real-mode row skips without --require-real-mode-evidence."""

    mod = _load_eval_agent_corpus()
    repo = Path(__file__).resolve().parents[3]
    corpus = repo / "tests" / "eval-corpus"

    _del_eval_corpus_real_mode_agent_env(monkeypatch)
    monkeypatch.setattr(
        sys,
        "argv",
        ["eval_agent_corpus.py", "--corpus", str(corpus)],
    )

    assert mod.main() == 0


def test_main_require_real_mode_fails_when_env_missing(monkeypatch):
    mod = _load_eval_agent_corpus()
    repo = Path(__file__).resolve().parents[3]
    corpus = repo / "tests" / "eval-corpus"

    _del_eval_corpus_real_mode_agent_env(monkeypatch)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "eval_agent_corpus.py",
            "--corpus",
            str(corpus),
            "--require-real-mode-evidence",
        ],
    )

    assert mod.main() == 1


def test_main_require_real_mode_passes_when_smoke_env_points_at_valid_json(monkeypatch):
    mod = _load_eval_agent_corpus()
    repo = Path(__file__).resolve().parents[3]
    corpus = repo / "tests" / "eval-corpus"
    golden = _golden_valid_path(repo)
    assert golden.is_file()

    _del_eval_corpus_real_mode_agent_env(monkeypatch)
    monkeypatch.setenv("ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT", str(golden))
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "eval_agent_corpus.py",
            "--corpus",
            str(corpus),
            "--require-real-mode-evidence",
        ],
    )

    assert mod.main() == 0


def test_main_enforce_real_quality_gate_fails_when_evaluated_real_row_rejected(monkeypatch):
    mod = _load_eval_agent_corpus()
    repo = Path(__file__).resolve().parents[3]
    corpus = repo / "tests" / "eval-corpus"
    golden = _golden_valid_path(repo)
    assert golden.is_file()

    # Any finite structural score is below this floor, so the gate rejects deterministically.
    monkeypatch.setitem(mod._DEFAULT_GATE, "structural_reject_below", 10.0)

    _del_eval_corpus_real_mode_agent_env(monkeypatch)
    monkeypatch.setenv("ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT", str(golden))
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "eval_agent_corpus.py",
            "--corpus",
            str(corpus),
            "--enforce-real-quality-gate",
        ],
    )

    assert mod.main() == 1


def test_main_enforce_real_quality_gate_ignored_when_real_rows_skip(monkeypatch):
    """Skipped real rows (env unset) do not satisfy 'evaluated' for real gate enforcement."""

    mod = _load_eval_agent_corpus()
    repo = Path(__file__).resolve().parents[3]
    corpus = repo / "tests" / "eval-corpus"

    _del_eval_corpus_real_mode_agent_env(monkeypatch)
    monkeypatch.setitem(mod._DEFAULT_GATE, "structural_reject_below", 10.0)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "eval_agent_corpus.py",
            "--corpus",
            str(corpus),
            "--enforce-real-quality-gate",
        ],
    )

    assert mod.main() == 0


def test_main_enforce_real_quality_gate_passes_when_real_accepted(monkeypatch):
    mod = _load_eval_agent_corpus()
    repo = Path(__file__).resolve().parents[3]
    corpus = repo / "tests" / "eval-corpus"
    golden = _golden_valid_path(repo)
    assert golden.is_file()

    _del_eval_corpus_real_mode_agent_env(monkeypatch)
    monkeypatch.setenv("ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT", str(golden))
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "eval_agent_corpus.py",
            "--corpus",
            str(corpus),
            "--enforce-real-quality-gate",
        ],
    )

    assert mod.main() == 0
