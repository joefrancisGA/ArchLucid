"""TB-189 policy-pack draft drift guards (Batch 5BV)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5BV(unittest.TestCase):
    def test_tb_189_draft_endpoint(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Governance" / "GovernanceController.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("policy-pack/draft", text)
        self.assertIn("PolicyPackDraftService", text)

    def test_tb_189_authoring_wizard_panel(self) -> None:
        path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "policy-packs"
            / "_sections"
            / "PolicyRuleAuthoringWizard.tsx"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("Draft a rule from plain English", text)


if __name__ == "__main__":
    unittest.main()
