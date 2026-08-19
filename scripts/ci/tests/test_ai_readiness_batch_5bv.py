"""TB-189 policy-pack draft drift guards (Batch 5BV)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5BV(unittest.TestCase):
    def test_tb_189_draft_endpoint(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance" / "GovernanceController.PolicyPacks.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("policy-pack/draft", text)
        self.assertIn("policyPackDraftService", text)

    def test_tb_189_authoring_wizard_panel(self) -> None:
        wizard_path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "governance"
            / "policy-packs"
            / "_sections"
            / "PolicyRuleAuthoringWizard.tsx"
        )
        builder_path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "governance"
            / "policy-packs"
            / "_sections"
            / "PolicyPackNaturalLanguageBuilder.tsx"
        )
        wizard_text = wizard_path.read_text(encoding="utf-8")
        builder_text = builder_path.read_text(encoding="utf-8")
        self.assertIn("policy-rule-authoring-wizard", wizard_text)
        self.assertIn("PolicyPackNaturalLanguageBuilder", wizard_text)
        self.assertIn("generatePolicyPackFromPrompt", builder_text)


if __name__ == "__main__":
    unittest.main()
