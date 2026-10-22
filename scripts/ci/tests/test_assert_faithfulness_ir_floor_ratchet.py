"""Ratchet checks for faithfulness + retrieval IR baselines."""

from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path


def _load_ratchet_module():
    path = Path(__file__).resolve().parents[1] / "assert_faithfulness_ir_floor_ratchet.py"
    spec = importlib.util.spec_from_file_location("assert_faithfulness_ir_floor_ratchet", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules["assert_faithfulness_ir_floor_ratchet"] = mod
    spec.loader.exec_module(mod)
    return mod


class FaithfulnessIrFloorRatchetTests(unittest.TestCase):
    def test_main_passes_when_metrics_meet_committed_floors(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        mod = _load_ratchet_module()

        exit_code = mod._main(
            [
                "--floors-file",
                str(repo_root / "tests" / "eval-datasets" / "faithfulness-ir-floors.json"),
                "--faithfulness-summary",
                str(repo_root / "docs" / "quality" / "faithfulness-summary.json"),
                "--retrieval-summary",
                str(repo_root / "docs" / "quality" / "retrieval-ir-summary.json"),
            ],
        )

        if not (repo_root / "docs" / "quality" / "faithfulness-summary.json").is_file():
            self.skipTest("faithfulness-summary.json not generated yet")

        self.assertEqual(exit_code, 0)

    def test_main_fails_when_positive_readiness_regresses(self) -> None:
        mod = _load_ratchet_module()
        tmp = Path(__file__).resolve().parent / "_tmp_faithfulness_ratchet"
        tmp.mkdir(exist_ok=True)

        floors = tmp / "floors.json"
        faithfulness = tmp / "faithfulness.json"
        retrieval = tmp / "retrieval.json"

        floors.write_text(
            json.dumps(
                {
                    "positiveReadinessSupportRatio": 0.95,
                    "policyPackMeanMrr": 0.75,
                    "policyPackOrderingSensitiveMeanNdcgAt10": 0.70,
                    "slack": {"positiveReadinessSupportRatio": 0.01},
                }
            ),
            encoding="utf-8",
        )
        faithfulness.write_text(
            json.dumps({"positiveReadinessSupportRatio": 0.50}),
            encoding="utf-8",
        )
        retrieval.write_text(
            json.dumps(
                {
                    "corpusBreakdown": [
                        {
                            "corpusKind": "PolicyPack",
                            "meanMrr": 0.90,
                            "meanOrderingSensitiveNdcgAt10": 0.90,
                        }
                    ]
                }
            ),
            encoding="utf-8",
        )

        try:
            exit_code = mod._main(
                [
                    "--floors-file",
                    str(floors),
                    "--faithfulness-summary",
                    str(faithfulness),
                    "--retrieval-summary",
                    str(retrieval),
                ],
            )
        finally:
            for path in (floors, faithfulness, retrieval):
                if path.is_file():
                    path.unlink()

        self.assertEqual(exit_code, 1)


if __name__ == "__main__":
    unittest.main()
