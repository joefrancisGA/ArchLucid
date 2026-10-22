"""Drift tests for Container Apps scale-rule mix (TB-915)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
MAIN_TF = REPO_ROOT / "infra" / "terraform-container-apps" / "main.tf"
SECONDARY_TF = REPO_ROOT / "infra" / "terraform-container-apps" / "secondary_region.tf"


class TestContainerAppScaleRules(unittest.TestCase):
    def test_api_has_http_and_cpu_scale_rules(self) -> None:
        terraform = MAIN_TF.read_text(encoding="utf-8")

        api_start = terraform.index('resource "azurerm_container_app" "api"')
        worker_start = terraform.index('resource "azurerm_container_app" "worker"')
        api_block = terraform[api_start:worker_start]

        self.assertIn("http_scale_rule", api_block)
        self.assertIn('custom_rule_type = "cpu"', api_block)
        self.assertIn("local.api_cpu_scale_enabled", api_block)

    def test_worker_has_no_http_scale_rule(self) -> None:
        terraform = MAIN_TF.read_text(encoding="utf-8")

        worker_start = terraform.index('resource "azurerm_container_app" "worker"')
        ui_start = terraform.index('resource "azurerm_container_app" "ui"')
        worker_block = terraform[worker_start:ui_start]

        self.assertNotIn("http_scale_rule", worker_block)

    def test_secondary_api_matches_cpu_scale_wiring(self) -> None:
        terraform = SECONDARY_TF.read_text(encoding="utf-8")

        self.assertIn('resource "azurerm_container_app" "api_secondary"', terraform)
        self.assertIn('custom_rule_type = "cpu"', terraform)
        self.assertIn("local.api_cpu_scale_enabled", terraform)


if __name__ == "__main__":
    unittest.main()
