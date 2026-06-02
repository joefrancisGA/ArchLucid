"""TB-213 QualityGate WarnOnly lint rule drift guards (Batch 5AC)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AC(unittest.TestCase):
    def test_tb_213_quality_gate_lint_rule_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Hosting" / "QualityGateWarnOnlyProductionLikeConfigurationLint.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("QualityGateWarnOnlyInRealProductionLike", text)
        self.assertIn("AgentExecution:Mode", text)
        self.assertIn("QualityGate:Mode", text)

    def test_tb_213_rule_name_constant(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Core"
            / "Hosting"
            / "ProductionLikeHostingMisconfigurationAdvisorRuleNames.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("QualityGateWarnOnlyInRealProductionLike", text)

    def test_tb_213_evaluator_wires_advisory_finding(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Hosting" / "OperatorConfigurationLintEvaluator.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("QualityGateWarnOnlyProductionLikeConfigurationLint", text)

    def test_tb_213_config_lint_promotes_for_hosted_pilot_profile(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "ConfigLintReportBuilder.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("PromoteHostedPilotQualityGateFindings", text)
        self.assertIn("quality_gate_warn_only_in_real_production_like", text)


if __name__ == "__main__":
    unittest.main()
