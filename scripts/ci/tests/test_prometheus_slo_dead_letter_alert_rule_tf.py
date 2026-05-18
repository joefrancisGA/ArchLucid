"""Static checks: prometheus_slo_rules.tf declares the integration outbox dead-letter Azure Monitor rule."""
from __future__ import annotations

import re
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_TF = _REPO / "infra" / "terraform-monitoring" / "prometheus_slo_rules.tf"


class TestPrometheusSloDeadLetterAlertRuleTf(unittest.TestCase):
    def test_tf_declares_integration_outbox_dead_letter_rule(self) -> None:
        text = _TF.read_text(encoding="utf-8")
        self.assertIn("ArchLucidIntegrationOutboxDeadLetterNonZeroTf", text)
        self.assertRegex(text, r"archlucid_integration_event_outbox_dead_letter\s*>\s*0")
        self.assertIn('for        = "PT5M"', text)
        self.assertIn("azurerm_monitor_action_group.ops[0].id", text)
        self.assertRegex(
            text,
            re.escape(
                "Integration event outbox dead-letter queue is non-zero. "
                "See docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md."
            ),
        )


if __name__ == "__main__":
    unittest.main()
