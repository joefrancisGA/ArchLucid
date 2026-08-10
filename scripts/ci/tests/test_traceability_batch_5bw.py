"""TB-250 authority pipeline stage timeline drift guards (Batch 5BW)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatch5BW(unittest.TestCase):
    def test_tb_250_migration(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "Migrations" / "240_RunStageOutcomes.sql"
        text = path.read_text(encoding="utf-8")
        self.assertIn("RunStageOutcomes", text)
        self.assertIn("OutcomeStatus", text)

    def test_tb_250_executor_writes_outcomes(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "Orchestration"
            / "Pipeline"
            / "AuthorityPipelineStagesExecutor.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("IRunStageOutcomesRepository", text)
        self.assertIn("RecordStageStartedAsync", text)

    def test_tb_250_api_endpoint(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Authority" / "RunQueryController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("stage-timeline", text)

    def test_tb_250_operator_ui_section(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "[runId]"
            / "_sections"
            / "RunDetailPipelineStagesSection.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("Stage timing and outcomes", text)
        self.assertIn("run-detail-pipeline-stages", text)


if __name__ == "__main__":
    unittest.main()
