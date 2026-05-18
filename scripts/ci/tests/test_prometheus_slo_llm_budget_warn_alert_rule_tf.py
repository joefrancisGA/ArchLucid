"""Static checks: prometheus_slo_rules.tf declares the tenant LLM budget utilization Azure Monitor rule."""
from __future__ import annotations

import re
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_TF = _REPO / "infra" / "terraform-monitoring" / "prometheus_slo_rules.tf"


class TestPrometheusSloLlmBudgetWarnAlertRuleTf(unittest.TestCase):
    def test_tf_declares_llm_budget_warn_fraction_rule(self) -> None:
        text = _TF.read_text(encoding="utf-8")
        self.assertIn("ArchLucidLlmBudgetWarnFractionBreachedTf", text)
        self.assertRegex(text, r"max\s+by\s+\(tenant_id\)\s+\(archlucid_llm_budget_utilization_fraction\)\s*>\s*0\.75")
        self.assertRegex(text, r"severity\s*=\s*3")
        self.assertIn('for        = "PT5M"', text)
        self.assertIn("azurerm_monitor_action_group.ops[0].id", text)
        self.assertRegex(
            text,
            re.escape(
                "Tenant LLM budget utilisation exceeded 75%. Review infra/terraform-monitoring.",
            ),
        )


if __name__ == "__main__":
    unittest.main()
