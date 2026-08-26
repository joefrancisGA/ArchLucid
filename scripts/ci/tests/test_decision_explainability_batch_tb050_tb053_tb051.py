"""CI drift guards for TB-050, TB-051, TB-053, and TB-101."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestDecisionExplainabilityBatch(unittest.TestCase):
    def test_tb_050_manifest_decision_confidence_fields(self) -> None:
        path = REPO_ROOT / "ArchLucid.Core" / "Manifest" / "ResolvedArchitectureDecision.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("double? Confidence", text)
        self.assertIn("DecisionConfidenceSource ConfidenceSource", text)

    def test_tb_050_manifest_projector_wired(self) -> None:
        securityPopulator = (
            REPO_ROOT
            / "ArchLucid.Decisioning"
            / "Manifest"
            / "Builders"
            / "TopologySecurityCostManifestSectionPopulators.cs"
        )
        self.assertIn(
            "ManifestDecisionConfidenceProjector.ApplyTo",
            securityPopulator.read_text(encoding="utf-8"),
        )

    def test_tb_051_calibrated_prior_resolver(self) -> None:
        resolver = REPO_ROOT / "ArchLucid.Decisioning" / "Merge" / "DecisionStrategyAgentConfidenceResolver.cs"
        text = resolver.read_text(encoding="utf-8")
        self.assertIn("ResolveAcceptPriorWithSource", text)
        self.assertIn("CalibratedConfidence", text)

    def test_tb_053_finding_confidence_result_type(self) -> None:
        calculator = REPO_ROOT / "ArchLucid.Decisioning" / "Findings" / "FindingConfidenceCalculator.cs"
        text = calculator.read_text(encoding="utf-8")
        self.assertIn("FindingConfidenceCalculationResult", text)
        self.assertIn("FindingConfidenceStatus.Unknown", text)

    def test_tb_101_app_service_legacy_documented(self) -> None:
        app_service = REPO_ROOT / "infra" / "terraform-private" / "app_service.tf"
        text = app_service.read_text(encoding="utf-8")
        self.assertIn("TB-101", text)
        self.assertIn("Container Apps", text)


if __name__ == "__main__":
    unittest.main()
