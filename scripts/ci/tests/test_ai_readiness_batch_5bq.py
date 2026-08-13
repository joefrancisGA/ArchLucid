"""TB-186 run summary one-pager drift guards (Batch 5BQ)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5BQ(unittest.TestCase):
    def test_tb_186_feature_flag_options(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "GenerateRunSummaryOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentRuntime:GenerateRunSummary", text)
        self.assertIn("= false", text)

    def test_tb_186_export_endpoint(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Api"
            / "Controllers"
            / "Authority"
            / "ArchitectureExportController.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("export/summary", text)
        self.assertIn("GenerateRunSummaryOptions", text)

    def test_tb_186_template_ai_disclaimer(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Exports"
            / "Templates"
            / "run-summary-one-pager.md.hbs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("generated with AI assistance", text)

    def test_tb_186_run_detail_download_link(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "runs" / "RunDetailPageHeader.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Download Executive Summary", text)


if __name__ == "__main__":
    unittest.main()
