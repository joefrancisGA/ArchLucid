"""TB-040 LLM usage metering awaits with CancellationToken.None drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatchTb040(unittest.TestCase):
    def test_tb_040_complete_json_awaits_metering_with_none_token(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "LlmCompletionAccountingClient.Complete.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn(
            "await _telemetry\n                    .RecordTokenUsageAsync(scope, promptTok, completionTok, cachedPromptTok, CancellationToken.None)",
            text,
        )
        self.assertNotIn("_ = TryRecordLlmUsageMeteringAsync", text)

        telemetry_path = REPO_ROOT / "ArchLucid.AgentRuntime" / "LlmCompletionAccountingTelemetry.cs"
        telemetry_text = telemetry_path.read_text(encoding="utf-8")
        self.assertIn("await TryRecordLlmUsageMeteringAsync(scope, promptTok, completionTok, cancellationToken)", telemetry_text)

    def test_tb_040_cancellation_after_inner_completion_test_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime.Tests" / "LlmCompletionAccountingClientTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn(
            "CompleteJsonAsync_when_token_cancelled_after_inner_returns_still_records_metering_once",
            text,
        )
    def test_tb_040_stream_json_awaits_metering_in_finally(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime" / "LlmCompletionAccountingClient.Stream.cs"
        text = path.read_text(encoding="utf-8")
        stream_section = text.split("private async Task SettleStreamUsageAccountingAsync", 1)[1]
        self.assertIn(
            "await _telemetry\n            .RecordTokenUsageAsync(scope, promptTok, completionTok, cachedPromptTok, CancellationToken.None)",
            stream_section,
        )


if __name__ == "__main__":
    unittest.main()
