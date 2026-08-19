"""TB-043 schema remediation non-Polly completion client drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatchTb043(unittest.TestCase):
    def test_tb_043_remediation_client_interface_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "ISchemaRemediationAgentCompletionClient.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("TB-043", text)

    def test_tb_043_host_registers_non_polly_remediation_chain(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Host.Composition"
            / "Startup"
            / "ServiceCollectionExtensions.Agents.AzureCompletion.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("BuildAzureOpenAiScopedCompletionChainWithoutPollyRetry", text)
        self.assertIn("RegisterSchemaRemediationAgentCompletionClient", text)
        self.assertIn("ISchemaRemediationAgentCompletionClient", text)

    def test_tb_043_handlers_resolve_dedicated_remediation_client(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "AgentHandlerLlmResolution.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ISchemaRemediationAgentCompletionClient", text)
        self.assertIn("non-Polly", text)

        completion_path = REPO_ROOT / "ArchLucid.AgentRuntime" / "LlmAgentSchemaCompletion.cs"
        completion_text = completion_path.read_text(encoding="utf-8")
        self.assertIn("remediationCompletionClient ?? completionClient", completion_text)

    def test_tb_043_polly_bounded_schema_completion_test_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime.Tests" / "LlmAgentSchemaCompletionTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("CompleteAsync_applies_polly_retries_only_on_first_schema_attempt", text)


if __name__ == "__main__":
    unittest.main()
