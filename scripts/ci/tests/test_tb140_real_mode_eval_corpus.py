"""TB-140 drift guard — real-mode eval corpus scenarios and nightly scoring."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CORPUS_ROOT = REPO_ROOT / "tests" / "eval-corpus"
AGENT_RESULTS_DIR = CORPUS_ROOT / "agent-results"


class TestTb140RealModeEvalCorpus(unittest.TestCase):
    def test_manifest_registers_real_mode_scenarios(self) -> None:
        manifest = json.loads((CORPUS_ROOT / "manifest.json").read_text(encoding="utf-8"))
        real_mode_entries = [
            entry
            for entry in manifest["scenarios"]
            if entry.startswith("scenario-real-mode-")
        ]

        self.assertGreaterEqual(len(real_mode_entries), 4)

    def test_real_mode_scenarios_declare_quality_evidence(self) -> None:
        smoke = json.loads((CORPUS_ROOT / "scenario-real-mode-smoke.json").read_text(encoding="utf-8"))
        quality = smoke.get("qualityEvidence") or {}

        self.assertEqual(quality.get("mode"), "real")
        self.assertTrue(quality.get("agentResultPathEnv"))
        self.assertTrue(smoke.get("expectedFindings"))

    def test_committed_exemplars_cover_quad_agent_paths(self) -> None:
        required = (
            "corpus-real-mode-smoke.real.json",
            "corpus-real-mode-cost.real.json",
            "corpus-real-mode-compliance.real.json",
            "corpus-real-mode-critic.real.json",
        )

        for filename in required:
            self.assertTrue((AGENT_RESULTS_DIR / filename).is_file(), filename)

    def test_expanded_nightly_workflow_scores_real_mode_corpus(self) -> None:
        workflow = REPO_ROOT / ".github" / "workflows" / "golden-cohort-expanded-nightly.yml"
        text = workflow.read_text(encoding="utf-8")

        self.assertIn("eval_agent_corpus.py", text)
        self.assertIn("--enforce-real-quality-gate", text)
        self.assertIn("ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT", text)


if __name__ == "__main__":
    unittest.main()
