"""TB-192 dynamic evidence summarization drift guards (Batch 5V)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCuttingEdgeBatch5V(unittest.TestCase):
    def test_tb_192_evidence_summarization_service_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "EvidenceSummarizationService.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("class EvidenceSummarizationService", text)
        self.assertIn("IEvidenceSummarizationService", text)
        self.assertIn("LlmModelTier.Economy", text)

    def test_tb_192_context_guard_invokes_summarization_before_truncation(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "ContextLengthGuardAgentCompletionClient.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IEvidenceSummarizationService", text)
        self.assertIn("SummarizeAsync", text)
        self.assertIn("AuditEventTypes.LlmEvidenceSummarized", text)

    def test_tb_192_options_default_disabled(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "EvidenceSummarizationOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn('SectionPath = "AgentExecution:EvidenceSummarization"', text)
        self.assertIn("= false", text)

    def test_tb_192_audit_event_catalog_entry(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Audit" / "AuditEventTypes.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("LlmEvidenceSummarized", text)

    def test_tb_192_dependency_tests_guard_circular_llm_access(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.AgentRuntime.Tests"
            / "EvidenceSummarizationServiceDependencyTests.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("EvidenceSummarizationServiceDependencyTests", text)
        self.assertIn("IAgentTierCompletionRouter", text)


if __name__ == "__main__":
    unittest.main()
