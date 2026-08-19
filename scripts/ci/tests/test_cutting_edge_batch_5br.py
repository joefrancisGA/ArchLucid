"""TB-195 Ask conversation compression drift guards (Batch 5BR)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCuttingEdgeBatch5BR(unittest.TestCase):
    def test_tb_195_conversation_context_options(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "ConversationContextOptions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Ask:ConversationContext", text)
        self.assertIn("CompressionEnabled", text)
        self.assertIn("= false", text)

    def test_tb_195_compressor_implementation(self) -> None:
        path = REPO_ROOT / "ArchLucid.Application" / "Ask" / "ConversationContextCompressor.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IConversationContextCompressor", text)
        self.assertIn("CompressAsync", text)
        self.assertIn("LogWarning", text)

    def test_tb_195_ask_service_wires_compressor(self) -> None:
        path = REPO_ROOT / "ArchLucid.Host.Core" / "Services" / "Ask" / "AskService.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("IConversationContextCompressor", text)
        self.assertIn("BuildHistoryTextAsync", text)


if __name__ == "__main__":
    unittest.main()
