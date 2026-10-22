"""TB-203 ConversationService unit test drift guards (Batch 5P)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCorrectnessBatch5P(unittest.TestCase):
    def test_tb_203_conversation_service_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "ConversationServiceTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("GetOrCreateThreadAsync_creates_new_thread_when_id_null", text)
        self.assertIn("GetOrCreateThreadAsync_throws_when_thread_scope_mismatches", text)

    def test_tb_203_session_not_found_and_history_limit_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "ConversationServiceTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("GetOrCreateThreadAsync_creates_new_thread_when_supplied_id_is_missing", text)
        self.assertIn("GetHistoryAsync_passes_take_limit_to_repository", text)

    def test_tb_203_empty_message_behavior_test_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "ConversationServiceTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AppendUserMessageAsync_persists_empty_content_without_service_validation", text)


if __name__ == "__main__":
    unittest.main()
