"""TB-184 governance block explainer drift guards (Batch 5BM)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5BM(unittest.TestCase):
    def test_tb_184_feature_flag_options(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "ExplainGovernanceBlocksOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AgentRuntime:ExplainGovernanceBlocks", text)
        self.assertIn("= false", text)

    def test_tb_184_orchestrator_guard(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "Orchestration"
            / "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("ExplainGovernanceBlocksOptions", text)
        self.assertIn("_explainGovernanceBlocksOptions.Value.Enabled", text)

    def test_tb_184_problem_details_extension(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "ProblemDetails" / "ProblemDetailsExtensions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("blockExplanation", text)

    def test_tb_184_commit_ui_surfaces_explanation(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "CommitRunButton.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("commit-governance-block-explanation", text)
        self.assertIn("AI-assisted", text)


if __name__ == "__main__":
    unittest.main()
