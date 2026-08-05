"""TB-216 sponsor-packet drift guards (Batch 5AD).

Originally guarded ``archlucid try --sponsor-packet``; that CLI entry was retired in favor of
``archlucid sponsor-packet <runId>`` (shared proof-packet writer still applies).
"""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AD(unittest.TestCase):
    def test_tb_216_try_options_parse_sponsor_packet_flags(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "SponsorPacketCommand.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("sponsor-packet", text)
        self.assertIn("--out", text)
        self.assertIn("SponsorPacketWriter.WriteAsync", text)

    def test_tb_216_try_command_invokes_proof_packet_writer(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "SponsorPacketWriter.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("WriteAsync", text)
        self.assertIn("PilotProofPacketCommand.WriteFolderAsync", text)

    def test_tb_216_pilot_proof_packet_exposes_shared_writer(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "PilotProofPacketCommand.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("WriteFolderAsync", text)
        self.assertIn("PilotProofPacketWriteOutcome", text)

    def test_tb_216_first_value_runbook_documents_combined_command(self) -> None:
        path = REPO_ROOT / "docs" / "runbooks" / "FIRST_PILOT_OPERATOR_PATH.md"
        text = path.read_text(encoding="utf-8")
        self.assertTrue(
            "try --sponsor-packet" in text or "sponsor-packet" in text,
            "expected sponsor-packet guidance in FIRST_PILOT_OPERATOR_PATH.md",
        )

    def test_tb_216_evaluator_workbook_documents_combined_command(self) -> None:
        # EVALUATOR_WORKBOOK.md is a path-stable stub; sponsor-packet guidance lives on the operator path.
        path = REPO_ROOT / "docs" / "runbooks" / "FIRST_PILOT_OPERATOR_PATH.md"
        text = path.read_text(encoding="utf-8")
        self.assertTrue(
            "try --sponsor-packet" in text or "sponsor-packet" in text,
            "expected sponsor-packet guidance in FIRST_PILOT_OPERATOR_PATH.md",
        )
        stub = REPO_ROOT / "docs" / "onboarding" / "EVALUATOR_WORKBOOK.md"
        stub_text = stub.read_text(encoding="utf-8")
        self.assertIn("BUYER_ORIENTATION_ONE_SCREEN.md", stub_text)


if __name__ == "__main__":
    unittest.main()
