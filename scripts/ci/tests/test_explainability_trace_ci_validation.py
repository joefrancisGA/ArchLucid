"""ExplainabilityTrace CI drift guards (assessment Tier 1 #3)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestExplainabilityTraceCiValidation(unittest.TestCase):
    def test_agent_explainability_trace_validator_present(self) -> None:
        validator = (
            REPO_ROOT / "ArchLucid.Decisioning" / "Findings" / "AgentExplainabilityTraceValidator.cs"
        )
        factory = (
            REPO_ROOT / "ArchLucid.Decisioning" / "Findings" / "Factories" / "FindingFactory.cs"
        )
        tests = (
            REPO_ROOT
            / "ArchLucid.Decisioning.Tests"
            / "Findings"
            / "AgentExplainabilityTraceValidatorTests.cs"
        )

        validator_text = validator.read_text(encoding="utf-8")
        self.assertIn("ValidateMappedAgentFinding", validator_text)
        self.assertIn("MinimumPopulatedFieldCountWithEvidence", validator_text)

        factory_text = factory.read_text(encoding="utf-8")
        self.assertIn("RulesApplied", factory_text)
        self.assertIn("Citations", factory_text)

        tests_text = tests.read_text(encoding="utf-8")
        self.assertIn("Factory_mapped_agent_findings_with_evidence_always_pass_ci_validator", tests_text)
        self.assertIn('[Trait("Suite", "Core")]', tests_text)


if __name__ == "__main__":
    unittest.main()
