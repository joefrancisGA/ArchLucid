"""TB-241 board-pack AI sponsor narrative drift guards (Batch 5AQ)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AQ(unittest.TestCase):
    def test_tb_241_roi_board_pack_narrative_options(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "RoiBoardPackNarrativeOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("GenerateBoardPackNarrative", text)

    def test_tb_241_exporter_prefixes_narrative(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application" / "Roi" / "SponsorRoiBoardPackExporter.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("SponsorRoiBoardPackNarrativeBuilder", text)
        self.assertIn("generateNarrative", text)

    def test_tb_241_controller_query_param(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Roi" / "RoiController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("generateNarrative", text)

    def test_tb_241_ui_toggle(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "architecture" / "sponsor-dashboard" / "_sections" / "SponsorRoiSummarySection.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("exec-roi-board-pack-narrative-toggle", text)
        self.assertIn("downloadSponsorRoiBoardPack", text)

    def test_tb_241_application_tests(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application.Tests" / "Roi" / "SponsorRoiBoardPackExporterNarrativeTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("## Sponsor report", text)


if __name__ == "__main__":
    unittest.main()
