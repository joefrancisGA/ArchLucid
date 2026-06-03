"""TB-158 / TB-167 proof-of-ROI and sponsor AI posture drift guards (Batch 5CP)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestProofRoiBatch5CP(unittest.TestCase):
    def test_tb_158_pilot_acceptance_thresholds_wired(self) -> None:
        proof = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
        text = proof.read_text(encoding="utf-8-sig")
        doc = REPO_ROOT / "docs" / "go-to-market" / "PILOT_ACCEPTANCE_THRESHOLDS.md"
        self.assertTrue(doc.is_file())
        self.assertIn("Add-PilotAcceptanceThresholdFinding", text)
        self.assertIn("report_pilot_acceptance_thresholds.py", text)

    def test_tb_167_ai_readiness_posture_in_proof_collect(self) -> None:
        proof = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
        text = proof.read_text(encoding="utf-8-sig")
        self.assertIn("Add-AiReadinessPostureFinding", text)
        self.assertIn("Write-AiReadinessPosture.ps1", text)
        self.assertIn("ai-readiness-posture.json", text)


if __name__ == "__main__":
    unittest.main()
