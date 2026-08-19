"""Unit tests for validate_customer_wif_templates.py path constants."""

from __future__ import annotations

import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = SCRIPT_DIR.parent.parent


class ValidateCustomerWifTemplatesPathsTests(unittest.TestCase):
    def test_terraform_and_bicep_templates_exist(self) -> None:
        terraform_main = REPO_ROOT / "deploy" / "customer-templates" / "terraform" / "main.tf"
        bicep_main = REPO_ROOT / "deploy" / "customer-templates" / "bicep" / "main.bicep"
        tfvars_example = REPO_ROOT / "deploy" / "customer-templates" / "terraform" / "terraform.tfvars.example"

        self.assertTrue(terraform_main.is_file())
        self.assertTrue(bicep_main.is_file())
        self.assertTrue(tfvars_example.is_file())


if __name__ == "__main__":
    unittest.main()
