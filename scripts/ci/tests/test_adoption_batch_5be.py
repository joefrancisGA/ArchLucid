"""TB-231 claim-readiness tracker drift guards (Batch 5BE)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5BE(unittest.TestCase):
    def test_tb_231_claim_readiness_status(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "CLAIM_READINESS_STATUS.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Stage 0", text)
        self.assertIn("G4", text)
        self.assertIn("≥3", text)

    def test_tb_231_proof_packet_run_log(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "CLAIM_READINESS_STATUS.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("proof-packet-run-log", text)
        self.assertIn("Run ID", text)
        self.assertIn("Clean", text)

    def test_tb_231_gtm_backlog_links(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "GTM_BACKLOG.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("CLAIM_READINESS_STATUS.md", text)
        self.assertIn("PROOF_PACKET_RUN_LOG.md", text)


if __name__ == "__main__":
    unittest.main()
