"""Tests for scripts/ci/emit_committed_real_mode_quality_gate.py."""

from __future__ import annotations

import importlib.util
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MODULE_PATH = REPO_ROOT / "scripts" / "ci" / "emit_committed_real_mode_quality_gate.py"
RESULTS_DIR = REPO_ROOT / "tests" / "eval-corpus" / "agent-results"


def _load_module():
    spec = importlib.util.spec_from_file_location("emit_committed_real_mode_quality_gate", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class EmitCommittedRealModeQualityGateTests(unittest.TestCase):
    def test_repo_quad_exemplars_emit_pass_gate(self) -> None:
        module = _load_module()
        with tempfile.TemporaryDirectory() as tmp:
            json_out = Path(tmp) / "real-llm-evidence-gate.json"
            exit_code = module.main(["--results-dir", str(RESULTS_DIR), "--json-out", str(json_out)])
            self.assertEqual(exit_code, 0)

            payload = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(payload["schema"], "archlucid.real-llm-evidence-gate.v2")
            self.assertEqual(payload["overallOutcome"], "PASS")
            self.assertEqual(payload["executionMode"], "committed-exemplar")
            self.assertGreaterEqual(len(payload["agentPaths"]), 4)

    def test_missing_quad_exemplar_fails_gate(self) -> None:
        module = _load_module()

        with tempfile.TemporaryDirectory() as tmp:
            results = Path(tmp) / "agent-results"
            shutil.copytree(RESULTS_DIR, results)
            (results / "corpus-real-mode-smoke.real.json").unlink()

            json_out = Path(tmp) / "gate.json"
            exit_code = module.main(["--results-dir", str(results), "--json-out", str(json_out)])
            self.assertEqual(exit_code, 1)

            payload = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(payload["overallOutcome"], "HOLD")


if __name__ == "__main__":
    unittest.main()
