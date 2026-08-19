"""TB-382–385 insight-density cluster drift guards (batch insight-density-tb382-385)."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestInsightDensityBatchTb382385(unittest.TestCase):
    def test_tb_382_deterministic_gate(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Findings" / "DeterministicInsightDensityGate.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IInsightDensityGate", text)
        self.assertIn("InsightDensityGateResult", text)
        self.assertIn("generic-advice", text)

    def test_tb_382_orchestrator_wiring(self) -> None:
        path = REPO_ROOT / "ArchLucid.Decisioning" / "Services" / "FindingsOrchestrator.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IInsightDensityGate", text)
        self.assertIn("FindingInsightDensityGateApplicator.ApplyToFindings", text)

    def test_tb_382_migration(self) -> None:
        path = REPO_ROOT / "ArchLucid.Persistence" / "Migrations" / "255_FindingRecords_InsightDensity.sql"
        self.assertTrue(path.is_file(), f"missing {path}")

    def test_tb_383_premium_judge_and_critic(self) -> None:
        judge = (
            REPO_ROOT
            / "ArchLucid.AgentRuntime"
            / "Prompts"
            / "InsightDensityJudgeSystemPromptTemplate.cs"
        ).read_text(encoding="utf-8")
        self.assertIn("So What", judge)

        critic = (
            REPO_ROOT / "ArchLucid.AgentRuntime" / "Prompts" / "CriticSystemPromptTemplate.cs"
        ).read_text(encoding="utf-8")
        self.assertIn('"So What" loop', critic)

        premium = REPO_ROOT / "ArchLucid.AgentRuntime" / "PremiumInsightDensityLlmJudge.cs"
        self.assertTrue(premium.is_file())

    def test_tb_384_checklist_routing(self) -> None:
        router = (
            REPO_ROOT / "ArchLucid.Core" / "Findings" / "FindingChecklistCoverageRouter.cs"
        ).read_text(encoding="utf-8")
        self.assertIn("checklist coverage", router.lower())

        migration = (
            REPO_ROOT
            / "ArchLucid.Persistence"
            / "Migrations"
            / "256_FindingsSnapshots_ChecklistCoverage.sql"
        )
        self.assertTrue(migration.is_file())

        panel = (
            REPO_ROOT / "archlucid-ui" / "src" / "components" / "usability" / "CoverageChecklistPanel.tsx"
        ).read_text(encoding="utf-8")
        self.assertIn("CoverageChecklistPanel", panel)

    def test_tb_385_curation_ui(self) -> None:
        banner = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "components"
            / "usability"
            / "InsightDensityCurationBanner.tsx"
        ).read_text(encoding="utf-8")
        self.assertIn("insight-density-curation-banner", banner)

        snippets = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "components"
            / "usability"
            / "FindingEvidenceRefSnippets.tsx"
        )
        self.assertTrue(snippets.is_file())

        lib = (
            REPO_ROOT / "archlucid-ui" / "src" / "lib" / "findings" / "findings-snapshot-insight-density.ts"
        ).read_text(encoding="utf-8")
        self.assertIn("formatInsightDensityCurationMessage", lib)

    def test_tb_382_385_backlog_marked_done(self) -> None:
        backlog = (REPO_ROOT / "docs" / "library" / "TECH_BACKLOG.md").read_text(encoding="utf-8")
        for tb_id in (382, 383, 384, 385):
            section = re.search(rf"## TB-{tb_id}\b[^\n]*\n\n\*\*Status:\*\*([^\n]+)", backlog)
            self.assertIsNotNone(section, f"missing TB-{tb_id} status line")
            status = section.group(1).lower()
            self.assertIn("done", status, f"TB-{tb_id} not marked Done: {section.group(1)}")


if __name__ == "__main__":
    unittest.main()
