"""Unit tests for assert_terraform_plan_data_regions."""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]

_SPEC = importlib.util.spec_from_file_location(
    "assert_terraform_plan_data_regions",
    _REPO / "scripts" / "ci" / "assert_terraform_plan_data_regions.py",
)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError("Could not load assert_terraform_plan_data_regions.py")
_mod = importlib.util.module_from_spec(_SPEC)
sys.modules["assert_terraform_plan_data_regions"] = _mod
_SPEC.loader.exec_module(_mod)

build_expected_region_allowlist = _mod.build_expected_region_allowlist
find_location_violations = _mod.find_location_violations
validate_plan_data_regions = _mod.validate_plan_data_regions


def _minimal_plan(
    *,
    variables: dict | None = None,
    planned_root_resources: list | None = None,
    resource_changes: list | None = None,
) -> dict:
    plan: dict = {
        "variables": variables or {},
        "planned_values": {"root_module": {"resources": planned_root_resources or []}},
        "resource_changes": resource_changes or [],
    }
    return plan


class TestBuildAllowlist(unittest.TestCase):
    def test_primary_secondary_global_and_extra_env(self) -> None:
        import os

        os.environ["TERRAFORM_DATA_REGION_ALLOWLIST_EXTRA"] = "brazilsouth , westus2"
        try:
            plan = _minimal_plan(
                variables={
                    "location": {"value": "East US"},
                    "secondary_location": {"value": "westus3"},
                },
                planned_root_resources=[],
            )
            allowed = build_expected_region_allowlist(plan)
        finally:
            del os.environ["TERRAFORM_DATA_REGION_ALLOWLIST_EXTRA"]

        self.assertIn("eastus", allowed)
        self.assertIn("westus3", allowed)
        self.assertIn("brazilsouth", allowed)
        self.assertIn("westus2", allowed)
        self.assertIn("global", allowed)

    def test_data_resource_group_adds_region(self) -> None:
        plan = _minimal_plan(
            variables={},
            planned_root_resources=[
                {
                    "address": "data.azurerm_resource_group.target",
                    "mode": "data",
                    "type": "azurerm_resource_group",
                    "name": "target",
                    "values": {"location": "centralus"},
                },
            ],
        )
        allowed = build_expected_region_allowlist(plan)
        self.assertIn("centralus", allowed)


class TestViolations(unittest.TestCase):
    def test_passes_when_location_matches_variable(self) -> None:
        plan = _minimal_plan(
            variables={"location": {"value": "eastus"}},
            resource_changes=[
                {
                    "address": "azurerm_resource_group.this",
                    "mode": "managed",
                    "change": {
                        "actions": ["create"],
                        "after": {"location": "eastus", "name": "rg1"},
                    },
                },
            ],
        )
        violations, err = validate_plan_data_regions(plan)
        self.assertIsNone(err)
        self.assertEqual(violations, [])

    def test_fails_on_unexpected_region(self) -> None:
        plan = _minimal_plan(
            variables={"location": {"value": "eastus"}},
            resource_changes=[
                {
                    "address": "azurerm_log_analytics_workspace.main",
                    "mode": "managed",
                    "change": {
                        "actions": ["create"],
                        "after": {"location": "northeurope"},
                    },
                },
            ],
        )
        violations, err = validate_plan_data_regions(plan)
        self.assertIsNone(err)
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0][0], "azurerm_log_analytics_workspace.main")

    def test_global_always_allowed(self) -> None:
        plan = _minimal_plan(
            variables={"location": {"value": "eastus"}},
            resource_changes=[
                {
                    "address": "azurerm_traffic_manager_profile.main",
                    "mode": "managed",
                    "change": {
                        "actions": ["create"],
                        "after": {"location": "global"},
                    },
                },
            ],
        )
        violations, err = validate_plan_data_regions(plan)
        self.assertIsNone(err)
        self.assertEqual(violations, [])

    def test_skips_delete_only(self) -> None:
        plan = _minimal_plan(
            variables={"location": {"value": "eastus"}},
            resource_changes=[
                {
                    "address": "azurerm_resource_group.this",
                    "mode": "managed",
                    "change": {
                        "actions": ["delete"],
                        "after": {"location": "moon"},
                    },
                },
            ],
        )
        violations, err = validate_plan_data_regions(plan)
        self.assertIsNone(err)
        self.assertEqual(violations, [])

    def test_replace_validates_after(self) -> None:
        plan = _minimal_plan(
            variables={"location": {"value": "eastus"}},
            resource_changes=[
                {
                    "address": "azurerm_resource_group.this",
                    "mode": "managed",
                    "change": {
                        "actions": ["delete", "create"],
                        "after": {"location": "wrongland"},
                    },
                },
            ],
        )
        allowed = build_expected_region_allowlist(plan)
        violations = find_location_violations(plan, allowed)
        self.assertEqual(len(violations), 1)

    def test_validation_error_without_regional_allowlist(self) -> None:
        plan = _minimal_plan(variables={}, resource_changes=[], planned_root_resources=[])
        violations, err = validate_plan_data_regions(plan)
        self.assertIsNotNone(err)
        self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
