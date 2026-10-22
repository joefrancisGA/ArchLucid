"""Unit tests for assert_terraform_posture_tier_examples (TB-903)."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
_SCRIPT = REPO_ROOT / "scripts" / "ci" / "assert_terraform_posture_tier_examples.py"

_spec = importlib.util.spec_from_file_location("assert_terraform_posture_tier_examples", _SCRIPT)
assert _spec and _spec.loader
_mod = importlib.util.module_from_spec(_spec)
sys.modules["assert_terraform_posture_tier_examples"] = _mod
_spec.loader.exec_module(_mod)


class TestAssertTerraformPostureTierExamples(unittest.TestCase):
    def test_repo_roots_pass_posture_tier_guard(self) -> None:
        errors = _mod._failures(REPO_ROOT)
        self.assertEqual(errors, [], "\n".join(errors))

    def test_detects_wrong_production_tier_in_example(self) -> None:
        cosmos_example = REPO_ROOT / "infra/terraform-cosmos/production.tfvars.example"
        original = cosmos_example.read_text(encoding="utf-8")
        try:
            cosmos_example.write_text(
                original.replace('posture_tier = "production"', 'posture_tier = "staging"'),
                encoding="utf-8",
            )
            errors = _mod._failures(REPO_ROOT)
            self.assertTrue(
                any("terraform-cosmos/production.tfvars.example" in e for e in errors),
                errors,
            )
        finally:
            cosmos_example.write_text(original, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
