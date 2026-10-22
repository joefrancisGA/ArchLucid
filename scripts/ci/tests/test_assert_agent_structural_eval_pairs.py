"""Tests for scripts/ci/assert_agent_structural_eval_pairs.py."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


def _load_module():
    path = Path(__file__).resolve().parents[1] / "assert_agent_structural_eval_pairs.py"
    spec = importlib.util.spec_from_file_location("assert_agent_structural_eval_pairs", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["assert_agent_structural_eval_pairs"] = module
    spec.loader.exec_module(module)
    return module


def test_main_passes_on_repo_pairs_manifest(monkeypatch) -> None:
    mod = _load_module()
    monkeypatch.setattr(sys, "argv", ["assert_agent_structural_eval_pairs.py"])
    assert mod.main() == 0


def test_verify_pairs_fails_when_required_agent_missing(tmp_path: Path) -> None:
    mod = _load_module()
    corpus_root = tmp_path / "eval-corpus"
    corpus_root.mkdir()
    (corpus_root / "manifest.json").write_text(json.dumps({"scenarios": []}), encoding="utf-8")
    pairs_path = corpus_root / "agent-structural-eval-pairs.json"
    pairs_path.write_text(
        json.dumps(
            {
                "pairs": [
                    {
                        "agentType": "Topology",
                        "simulatorScenario": "scenario-azure-web-app.json",
                        "realScenario": "scenario-real-mode-smoke.json",
                    },
                ],
            },
        ),
        encoding="utf-8",
    )

    paths = mod.CorpusPaths(
        corpus_root=corpus_root,
        manifest_path=corpus_root / "manifest.json",
        baseline_dir=tmp_path / "baselines",
    )
    failures = mod.verify_pairs(paths, pairs_path)

    assert failures
    assert any("missing pair for agentType 'Cost'" in message for message in failures)
