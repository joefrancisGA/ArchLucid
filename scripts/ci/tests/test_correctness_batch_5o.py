"""TB-202 Notifications unit test drift guards (Batch 5O)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCorrectnessBatch5O(unittest.TestCase):
    def test_tb_202_slack_interactivity_verifier_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Notifications.Tests" / "SlackInteractivityVerifierTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Verify_accepts_valid_signature_within_replay_window", text)
        self.assertIn("Verify_rejects_signature_mismatch", text)

    def test_tb_202_chatops_webhook_delivery_http_failure_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Notifications.Tests" / "ChatOpsWebhookDeliveryServiceTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("DeliverAsync_propagates_http_4xx_failure_from_poster", text)
        self.assertIn("DeliverAsync_propagates_http_5xx_failure_from_poster", text)

    def test_tb_202_authority_run_committed_chatops_hook_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Notifications.Tests" / "AuthorityRunCommittedChatOpsHookTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("NotifyAsync_calls_slack_and_teams_when_configured_with_https_urls", text)
        self.assertIn("NotifyAsync_suppresses_non_cancellation_errors_from_delivery", text)


if __name__ == "__main__":
    unittest.main()
