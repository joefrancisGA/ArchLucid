"""Tests for the RAG live-model faithfulness nightly signal."""

from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path


def _load_signal_module():
    path = Path(__file__).resolve().parents[1] / "run_rag_live_model_faithfulness_signal.py"
    spec = importlib.util.spec_from_file_location("run_rag_live_model_faithfulness_signal", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["run_rag_live_model_faithfulness_signal"] = mod
    spec.loader.exec_module(mod)
    return mod


class RagLiveModelFaithfulnessSignalTests(unittest.TestCase):
    def test_main_writes_summary_with_real_exemplars(self) -> None:
        mod = _load_signal_module()
        repo_root = Path(__file__).resolve().parents[3]
        tmp_json = repo_root / "docs/quality/_tmp_rag_live_model_signal.json"
        tmp_md = repo_root / "docs/quality/_tmp_rag_live_model_signal.md"

        try:
            exit_code = mod.main(
                [
                    "--json-out",
                    str(tmp_json),
                    "--markdown-out",
                    str(tmp_md),
                ],
            )

            self.assertEqual(exit_code, 0)
            self.assertTrue(tmp_json.is_file())

            payload = json.loads(tmp_json.read_text(encoding="utf-8"))

            self.assertEqual(payload.get("program"), "rag-live-model-faithfulness-signal")
            self.assertIn(payload.get("disposition"), {"PASS", "FAIL", "NOT_COLLECTED"})
            self.assertGreater(int(payload.get("configuredExemplarCount") or 0), 0)
        finally:
            if tmp_json.is_file():
                tmp_json.unlink()

            if tmp_md.is_file():
                tmp_md.unlink()

    def test_disposition_not_collected_when_no_scores(self) -> None:
        mod = _load_signal_module()

        self.assertEqual(mod._disposition(failures=[], positive_scored=0), "NOT_COLLECTED")
        self.assertEqual(mod._disposition(failures=["p50 low"], positive_scored=3), "FAIL")
        self.assertEqual(mod._disposition(failures=[], positive_scored=3), "PASS")


if __name__ == "__main__":
    unittest.main()
