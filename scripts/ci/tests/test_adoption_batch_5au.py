"""TB-227 multi-run collect-first-pilot-proof drift guards (Batch 5AU)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AU(unittest.TestCase):
    def test_tb_227_stickiness_helper(self) -> None:
        path = REPO_ROOT / "scripts" / "FirstPilotMultiRunStickinessProof.ps1"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Write-FirstPilotMultiRunStickinessArtifacts", text)
        self.assertIn("stickinessSignals", text)

    def test_tb_227_script_params(self) -> None:
        path = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
        text = path.read_text(encoding="utf-8")
        self.assertIn("-RunNumber", text)
        self.assertIn("-CompareBaseRunId", text)

    def test_tb_227_repeat_review_doc(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "REPEAT_REVIEW_LOOP.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("-RunNumber 2", text)


if __name__ == "__main__":
    unittest.main()
