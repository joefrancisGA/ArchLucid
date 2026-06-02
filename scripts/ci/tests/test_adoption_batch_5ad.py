"""TB-216 try --sponsor-packet drift guards (Batch 5AD)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AD(unittest.TestCase):
    def test_tb_216_try_options_parse_sponsor_packet_flags(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "TryCommandOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SponsorPacket", text)
        self.assertIn("--sponsor-packet", text)
        self.assertIn("ResolveSponsorPacketDirectory", text)
        self.assertIn("try-sponsor-packet", text)

    def test_tb_216_try_command_invokes_proof_packet_writer(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "TryCommand.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("WriteSponsorPacket", text)
        self.assertIn("Generating sponsor proof packet", text)
        self.assertIn("proof-summary.md", text)

    def test_tb_216_pilot_proof_packet_exposes_shared_writer(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "PilotProofPacketCommand.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("WriteFolderAsync", text)
        self.assertIn("PilotProofPacketWriteOutcome", text)

    def test_tb_216_first_value_runbook_documents_combined_command(self) -> None:
        path = REPO_ROOT / "docs" / "runbooks" / "FIRST_VALUE_20_MINUTES.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("try --sponsor-packet", text)

    def test_tb_216_evaluator_workbook_documents_combined_command(self) -> None:
        path = REPO_ROOT / "docs" / "onboarding" / "EVALUATOR_WORKBOOK.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("try --sponsor-packet", text)


if __name__ == "__main__":
    unittest.main()
