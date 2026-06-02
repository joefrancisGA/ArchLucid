"""TB-178 streaming Ask SSE drift guards (Batch 5N)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5N(unittest.TestCase):
    def test_tb_178_ask_stream_endpoint_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Planning" / "AskController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn('[HttpPost("stream")]', text)
        self.assertIn("AskStreamAsync", text)
        self.assertIn("text/event-stream", text)

    def test_tb_178_ask_service_stream_implementation_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Host.Core" / "Services" / "Ask" / "AskService.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AskStreamAsync", text)
        self.assertIn("AgentCompletionStreamingBridge.StreamJsonAsync", text)

    def test_tb_178_use_ask_stream_hook_exists(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "hooks" / "useAskStream.ts"
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("export function useAskStream", text)
        self.assertIn("askArchLucidStream", text)
        self.assertIn("TOKEN_FLUSH_MS", text)

    def test_tb_178_ask_page_uses_use_ask_stream_hook(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "ask" / "_sections" / "AskPageContent.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("useAskStream", text)
        self.assertNotIn("askArchLucidStream", text)

    def test_tb_178_ask_stream_integration_test_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "AskThreadIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Ask_stream_with_seeded_run_emits_token_and_done_events", text)
        self.assertIn("v1/ask/stream", text)


if __name__ == "__main__":
    unittest.main()
