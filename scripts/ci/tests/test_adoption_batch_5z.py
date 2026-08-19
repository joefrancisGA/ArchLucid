"""TB-209 request create --from-file drift guards (Batch 5Z)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5Z(unittest.TestCase):
    def test_tb_209_request_create_command_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Commands" / "RequestCreateCommand.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("request create", text)
        self.assertIn("CreateRunAsync", text)

    def test_tb_209_architecture_request_file_parser(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Request" / "ArchitectureRequestFileParser.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ArchitectureRequest", text)
        self.assertIn("ParseFromFile", text)

    def test_tb_209_program_wires_request_create(self) -> None:
        path = REPO_ROOT / "ArchLucid.Cli" / "Program.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn('case "request":', text)
        self.assertIn("RequestCreateCommand", text)

    def test_tb_209_operator_quickstart_documents_cli(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "customer-facing" / "OPERATOR_QUICKSTART.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("request create --from-file", text)
        self.assertIn("greenfield-design-review.json", text)


if __name__ == "__main__":
    unittest.main()
