"""Tests for the unified offline RAG quality program runner."""

from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path


def _load_program_module():
    path = Path(__file__).resolve().parents[1] / "run_rag_quality_program.py"
    spec = importlib.util.spec_from_file_location("run_rag_quality_program", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["run_rag_quality_program"] = mod
    spec.loader.exec_module(mod)
    return mod


class RunRagQualityProgramTests(unittest.TestCase):
    def test_build_steps_includes_ratchet_and_rollup(self) -> None:
        mod = _load_program_module()
        steps = mod._build_steps(enforce=False, skip_rollup=False, include_live_model=False)
        labels = [step.label for step in steps]

        self.assertEqual(labels, ["faithfulness", "retrieval-ir", "floor-ratchet", "rollup"])

    def test_build_steps_enforce_adds_flag_to_eval_harnesses(self) -> None:
        mod = _load_program_module()
        steps = mod._build_steps(enforce=True, skip_rollup=True, include_live_model=False)
        faithfulness = next(step for step in steps if step.label == "faithfulness")
        retrieval = next(step for step in steps if step.label == "retrieval-ir")

        self.assertIn("--enforce", faithfulness.argv)
        self.assertIn("--enforce", retrieval.argv)

    def test_main_runs_offline_program(self) -> None:
        mod = _load_program_module()
        repo_root = Path(__file__).resolve().parents[3]

        exit_code = mod.main(["--skip-rollup"])

        self.assertEqual(exit_code, 0)

        summary_path = repo_root / "docs" / "quality" / "rag-quality-program-summary.json"

        self.assertTrue(summary_path.is_file())

        payload = json.loads(summary_path.read_text(encoding="utf-8"))

        self.assertEqual(payload.get("program"), "deeper-rag-quality-offline")
        self.assertEqual(payload.get("disposition"), "PASS")
        self.assertIsInstance(payload.get("steps"), list)
        self.assertGreaterEqual(len(payload["steps"]), 3)


if __name__ == "__main__":
    unittest.main()
