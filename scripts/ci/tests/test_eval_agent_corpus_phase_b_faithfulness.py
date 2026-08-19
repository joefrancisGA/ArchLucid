"""Phase B LLM faithfulness floors for eval_agent_corpus.py."""

from __future__ import annotations

import importlib.util
import os
import sys
import unittest
from pathlib import Path


def _load_eval_agent_corpus():
    path = Path(__file__).resolve().parents[1] / "eval_agent_corpus.py"
    spec = importlib.util.spec_from_file_location("eval_agent_corpus", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["eval_agent_corpus"] = mod
    spec.loader.exec_module(mod)
    return mod


class EvalAgentCorpusPhaseBFaithfulnessTests(unittest.TestCase):
    def test_resolve_llm_faithfulness_p50_floor_honors_env_override(self) -> None:
        mod = _load_eval_agent_corpus()
        prior = os.environ.get("ARCHLUCID_LLM_FAITHFULNESS_P50_FLOOR")
        os.environ["ARCHLUCID_LLM_FAITHFULNESS_P50_FLOOR"] = "0.71"

        try:
            self.assertEqual(mod._resolve_llm_faithfulness_p50_floor(), 0.71)
        finally:
            if prior is None:
                os.environ.pop("ARCHLUCID_LLM_FAITHFULNESS_P50_FLOOR", None)
            else:
                os.environ["ARCHLUCID_LLM_FAITHFULNESS_P50_FLOOR"] = prior

    def test_compute_p50_handles_even_and_odd_counts(self) -> None:
        mod = _load_eval_agent_corpus()
        self.assertEqual(mod._compute_p50([0.8, 0.6, 0.7]), 0.7)
        self.assertEqual(mod._compute_p50([0.8, 0.6]), 0.7)

    def test_enforce_llm_faithfulness_floors_flags_low_p50_and_adversarial_ceiling(self) -> None:
        mod = _load_eval_agent_corpus()
        rows = [
            {
                "id": "corpus-real-mode-smoke",
                "expectedOutcome": None,
                "quality": {"mode": "real", "llm_faithfulness_score": 0.48},
            },
            {
                "id": "corpus-real-mode-cost",
                "expectedOutcome": None,
                "quality": {"mode": "real", "llm_faithfulness_score": 0.47},
            },
            {
                "id": "corpus-adv-hallucination-detection",
                "expectedOutcome": {"offline_quality_gate_expectation": "warned"},
                "quality": {"mode": "simulator", "llm_faithfulness_score": 0.55},
            },
        ]

        failures = mod.enforce_llm_faithfulness_floors(
            rows,
            p50_floor=0.65,
            absolute_floor=0.50,
            adversarial_ceiling=0.40,
        )

        self.assertTrue(any("p50" in failure for failure in failures))
        self.assertTrue(any("Adversarial scenario" in failure for failure in failures))
        self.assertTrue(any("absolute hard floor" in failure for failure in failures))

    def test_enforce_llm_faithfulness_floors_passes_healthy_cohort(self) -> None:
        mod = _load_eval_agent_corpus()
        rows = [
            {
                "id": "corpus-real-mode-smoke",
                "expectedOutcome": None,
                "quality": {"mode": "real", "llm_faithfulness_score": 0.72},
            },
            {
                "id": "corpus-real-mode-cost",
                "expectedOutcome": None,
                "quality": {"mode": "real", "llm_faithfulness_score": 0.74},
            },
            {
                "id": "corpus-adv-hallucination-detection",
                "expectedOutcome": {"offline_quality_gate_expectation": "warned"},
                "quality": {"mode": "simulator", "llm_faithfulness_score": 0.25},
            },
        ]

        failures = mod.enforce_llm_faithfulness_floors(
            rows,
            p50_floor=0.65,
            absolute_floor=0.50,
            adversarial_ceiling=0.40,
        )

        self.assertEqual(failures, [])

    def test_summarize_llm_faithfulness_builds_phase_b_rollup(self) -> None:
        mod = _load_eval_agent_corpus()
        rows = [
            {
                "id": "corpus-real-mode-smoke",
                "expectedOutcome": None,
                "quality": {
                    "mode": "real",
                    "llm_faithfulness_score": 0.72,
                    "faithfulness_support_ratio": 0.91,
                    "gate_outcome": "accepted",
                },
            },
            {
                "id": "corpus-adv-hallucination-detection",
                "expectedOutcome": {"offline_quality_gate_expectation": "warned"},
                "quality": {
                    "mode": "simulator",
                    "llm_faithfulness_score": 0.25,
                    "faithfulness_support_ratio": 0.0,
                    "gate_outcome": "warned",
                },
            },
        ]

        summary = mod.summarize_llm_faithfulness(rows)

        self.assertEqual(summary["rubricVersion"], "faithfulness-judge-system.v1.0.0")
        self.assertAlmostEqual(float(summary["p50"]), 0.72)
        self.assertEqual(summary["positiveScenarioCount"], 1)
        self.assertEqual(summary["adversarialScenarioCount"], 1)


if __name__ == "__main__":
    unittest.main()
