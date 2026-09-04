"""TB-187 architecture request draft drift guards (Batch 5BS)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAiReadinessBatch5BS(unittest.TestCase):
    def test_tb_187_draft_endpoint(self) -> None:
        controller_dir = REPO_ROOT / "ArchLucid.Api" / "Controllers" / "Authority"
        text = "".join(
            path.read_text(encoding="utf-8")
            for path in sorted(controller_dir.glob("RunsController*.cs"))
        )
        self.assertIn("request/draft", text)
        self.assertIn("IArchitectureRequestIntakeFacade", text)

    def test_tb_187_draft_service_prompt(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Planning"
            / "Stages"
            / "ArchitectureRequestDraftExtractStage.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("suggestedConstraints", text)
        self.assertIn("enterprise architecture intake assistant", text)

    def test_tb_187_wizard_suggest_fields(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "wizard" / "steps" / "WizardStepDescription.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Suggest fields", text)
        self.assertIn("onSuggestFields", text)

    def test_tb_187_wizard_ai_suggested_marker(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "wizard-ai-suggested-fields.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("markAiSuggested", text)
        self.assertIn("WizardAiSuggestedFieldsProvider", text)


if __name__ == "__main__":
    unittest.main()
