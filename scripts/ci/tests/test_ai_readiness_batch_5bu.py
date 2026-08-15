"""TB-188 finding IaC stub generator drift guards (Batch 5BU)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5BU(unittest.TestCase):
    def test_tb_188_feature_flag_options(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "GenerateIacStubsOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentRuntime:GenerateIacStubs", text)
        self.assertIn("= false", text)

    def test_tb_188_stub_generator(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application" / "Agents" / "IaC" / "FindingIacStubGenerator.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IFindingIacStubGenerator", text)
        self.assertIn("AI-generated stub", text)

    def test_tb_188_orchestrator_guard(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "Orchestration"
            / "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("GenerateIacStubsOptions", text)
        self.assertIn("enqueueIacStubGeneration", text)

    def test_tb_188_ui_stub_panel(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "findings" / "FindingIacStubPanel.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("FindingIacStubPanel", text)
        self.assertIn("GenerateIacStubs", text)


if __name__ == "__main__":
    unittest.main()
