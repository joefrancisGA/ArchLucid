"""TB-208 CLI global tool + binary publish drift guards (Batch 5Y)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5Y(unittest.TestCase):
    def test_tb_208_pack_as_tool_in_csproj(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "ArchLucid.Cli.csproj"
        text = path.read_text(encoding="utf-8")
        self.assertIn("<PackAsTool>true</PackAsTool>", text)
        self.assertIn("<ToolCommandName>archlucid</ToolCommandName>", text)

    def test_tb_208_publish_cli_workflow(self) -> None:
        path = REPO_ROOT / ".github" / "workflows" / "publish-cli.yml"
        text = path.read_text(encoding="utf-8")
        self.assertIn("PublishSingleFile=true", text)
        self.assertIn("win-x64", text)
        self.assertIn("linux-x64", text)
        self.assertIn("osx-x64", text)
        self.assertIn("dotnet pack", text)

    def test_tb_208_cli_install_doc(self) -> None:
        path = REPO_ROOT / "docs" / "engineering" / "CLI_INSTALL.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("dotnet tool install -g ArchLucid.Cli", text)
        self.assertIn("Publish CLI", text)

    def test_tb_208_operator_quickstart_links_install(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "customer-facing" / "OPERATOR_QUICKSTART.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("CLI_INSTALL.md", text)


if __name__ == "__main__":
    unittest.main()
