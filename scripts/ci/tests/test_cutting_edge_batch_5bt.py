"""TB-193 LLM provider factory scaffold drift guards (Batch 5BT)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCuttingEdgeBatch5BT(unittest.TestCase):
    def test_tb_193_factory_interface(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Llm" / "ILlmProviderFactory.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("CreateClient", text)
        self.assertIn("SupportedProviders", text)

    def test_tb_193_provider_type_enum(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Llm" / "LlmProviderType.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AzureOpenAi", text)
        self.assertIn("Anthropic", text)
        self.assertIn("LocalOllama", text)

    def test_tb_193_default_factory(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "DefaultLlmProviderFactory.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("DefaultLlmProviderFactory", text)
        self.assertIn("IAgentCompletionClient", text)

    def test_tb_193_descriptor_provider_type(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "LlmProviderDescriptor.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ProviderType", text)
        self.assertIn("LlmProviderType", text)


if __name__ == "__main__":
    unittest.main()
