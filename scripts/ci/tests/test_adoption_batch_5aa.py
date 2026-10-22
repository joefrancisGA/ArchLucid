"""TB-210 pilot prerequisites drift guards (Batch 5AA)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AA(unittest.TestCase):
    def test_tb_210_pilot_prerequisites_doc(self) -> None:
        path = REPO_ROOT / "docs" / "runbooks" / "PILOT_PREREQUISITES.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Azure AI Search", text)
        self.assertIn("blocking", text.lower())
        self.assertIn("Illustrative cost estimate", text)
        self.assertIn("FirstPilotMinimum", text)
        self.assertIn("ProductionLike", text)

    def test_tb_210_prerequisites_script(self) -> None:
        path = REPO_ROOT / "scripts" / "Test-ArchLucidPrerequisites.ps1"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ProductionLike", text)
        self.assertIn("Retrieval:VectorIndex=AzureSearch", text)
        self.assertIn("Retrieval:AzureSearch:Endpoint", text)

    def test_tb_210_first_pilot_operator_path_links(self) -> None:
        path = REPO_ROOT / "docs" / "runbooks" / "FIRST_PILOT_OPERATOR_PATH.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("PILOT_PREREQUISITES.md", text)
        self.assertIn("Test-ArchLucidPrerequisites.ps1", text)

    def test_tb_210_configuration_reference_links(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "CONFIGURATION_REFERENCE.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("PILOT_PREREQUISITES.md", text)
        self.assertIn("Test-ArchLucidPrerequisites.ps1", text)


if __name__ == "__main__":
    unittest.main()
