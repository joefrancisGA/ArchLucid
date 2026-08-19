"""TB-212 hosted-prod Content Safety Terraform drift guards (Batch 5BK)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
TF_ROOT = REPO_ROOT / "deploy" / "hosted-prod-terraform"


class TestAdoptionBatch5BK(unittest.TestCase):
    def test_tb_212_content_safety_compose_files(self) -> None:
        for name in (
            "content_safety_consumed.tf",
            "content_safety_checks.tf",
            "content_safety_outputs.tf",
        ):
            self.assertTrue((TF_ROOT / name).is_file(), msg=name)

    def test_tb_212_outputs_and_env(self) -> None:
        outputs = (TF_ROOT / "content_safety_outputs.tf").read_text(encoding="utf-8")
        self.assertIn("azure_content_safety_container_app_env", outputs)
        self.assertIn("ArchLucid__ContentSafety__Endpoint", outputs)

    def test_tb_212_tfvars_example(self) -> None:
        example = (TF_ROOT / "terraform.tfvars.example").read_text(encoding="utf-8")
        self.assertIn("content_safety_compose_mode", example)
        self.assertIn("content_safety_existing_endpoint", example)

    def test_tb_212_configuration_reference_link(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "CONFIGURATION_REFERENCE.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("deploy/hosted-prod-terraform", text)
        self.assertIn("TB-212", text)

    def test_tb_212_iac_runtime_parity_row(self) -> None:
        path = REPO_ROOT / "docs" / "library" / "IAC_RUNTIME_PARITY.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Azure AI Content Safety", text)
        self.assertIn("Done TB-212", text)


if __name__ == "__main__":
    unittest.main()
