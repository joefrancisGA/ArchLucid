"""CI guard for deterministic agent eval corpus gating."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def test_eval_agent_corpus_baseline_step_is_blocking_in_ci() -> None:
    workflow = REPO_ROOT / ".github" / "workflows" / "ci.yml"
    text = workflow.read_text(encoding="utf-8")
    marker = "Agent eval corpus (offline recall + simulator quality evidence + blocking baseline)"
    start = text.index(marker)
    next_step = text.index("\n      - name:", start + len(marker))
    step = text[start:next_step]

    assert "python3 scripts/ci/eval_agent_corpus.py --markdown-report \"$REP\" --baseline" in step
    assert "continue-on-error" not in step
