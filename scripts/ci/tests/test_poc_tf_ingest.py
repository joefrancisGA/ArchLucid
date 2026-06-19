"""Tests for Azure Terraform ingest POC (scripts/agent/poc_tf_ingest.py)."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
_AGENT_DIR = _REPO_ROOT / "scripts" / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from poc_tf_ingest import build_json_declaration, ingest_path, parse_simple_terraform, resolve_object_type  # noqa: E402


class PocTfIngestTests(unittest.TestCase):
    def test_resolve_object_type_maps_security_and_policy(self) -> None:
        self.assertEqual(resolve_object_type("azurerm_key_vault"), "SecurityBaseline")
        self.assertEqual(resolve_object_type("azurerm_policy_assignment"), "PolicyControl")
        self.assertEqual(resolve_object_type("azurerm_storage_account"), "TopologyResource")

    def test_parse_simple_terraform_extracts_resources(self) -> None:
        content = (
            'resource "azurerm_resource_group" "app" {}\n'
            'resource "azurerm_key_vault" "core" {}\n'
        )

        parsed = parse_simple_terraform(content)

        self.assertEqual(len(parsed), 2)
        self.assertEqual(parsed[0]["name"], "app")
        self.assertEqual(parsed[1]["objectType"], "SecurityBaseline")

    def test_build_json_declaration_emits_resource_declaration_document(self) -> None:
        content = 'resource "azurerm_storage_account" "assets" {}'
        declaration = build_json_declaration("assets.tf", content)
        payload = json.loads(declaration["content"])

        self.assertEqual(declaration["format"], "json")
        self.assertEqual(payload["resources"][0]["type"], "azurerm_storage_account")

    def test_ingest_path_builds_request_payload(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as temp:
            tf_file = Path(temp) / "main.tf"
            tf_file.write_text(
                'resource "azurerm_resource_group" "app" {\n  name = "rg-app"\n}\n',
                encoding="utf-8",
            )

            payload = ingest_path(
                Path(temp),
                wire_format="simple-terraform",
                system_name="Demo",
                description="Terraform ingest for demo architecture review.",
                request_id="demo-tf-001",
            )

            self.assertEqual(payload["requestId"], "demo-tf-001")
            self.assertEqual(payload["infrastructureDeclarations"][0]["format"], "simple-terraform")
            self.assertIn("azurerm_resource_group", payload["infrastructureDeclarations"][0]["content"])


if __name__ == "__main__":
    unittest.main()
