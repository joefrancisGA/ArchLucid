"""Unit + drift tests for Azure CD deployment-target preflight."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parents[1]

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from cd_deploy_target_preflight import (
    acr_name_from_login_server,
    assert_workflows_declare_deploy_target_preflight,
    resolve_expected,
    run_preflight,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCdDeployTargetPreflight(unittest.TestCase):
    def test_resolve_expected_prefers_expected_over_fallback(self) -> None:
        self.assertEqual(resolve_expected("ten-a", "ten-b", "tenant"), "ten-a")
        self.assertEqual(resolve_expected("", "ten-b", "tenant"), "ten-b")

        with self.assertRaises(ValueError):
            resolve_expected("", "", "tenant")

    def test_acr_name_from_login_server(self) -> None:
        self.assertEqual(acr_name_from_login_server("myacr.azurecr.io"), "myacr")

    def test_run_preflight_account_pass(self) -> None:
        def az_runner(args: list[str]) -> dict[str, Any] | str | None:
            if args[:2] == ["account", "show"]:
                return {"tenantId": "tenant-1", "id": "sub-1"}

            raise AssertionError(f"unexpected az args: {args}")

        report = run_preflight(
            environment="staging",
            build_id="abc123",
            expected_tenant_id="tenant-1",
            expected_subscription_id="sub-1",
            check_resources=False,
            az_runner=az_runner,
        )

        self.assertTrue(report.ok)
        self.assertIn("Tenant validation: PASS", report.summary_markdown())
        self.assertIn("BUILD_ID: `abc123`", report.summary_markdown())

    def test_run_preflight_account_fail_on_wrong_subscription(self) -> None:
        def az_runner(args: list[str]) -> dict[str, Any] | str | None:
            return {"tenantId": "tenant-1", "id": "sub-WRONG"}

        report = run_preflight(
            environment="production",
            build_id="abc123",
            expected_tenant_id="tenant-1",
            expected_subscription_id="sub-1",
            check_resources=False,
            az_runner=az_runner,
        )

        self.assertFalse(report.ok)
        self.assertTrue(any(check.name == "subscription" and check.status == "FAIL" for check in report.checks))

    def test_run_preflight_resources_pass(self) -> None:
        def az_runner(args: list[str]) -> dict[str, Any] | str | None:
            if args[:2] == ["account", "show"]:
                return {"tenantId": "tenant-1", "id": "sub-1"}

            if args[:2] == ["group", "show"]:
                return {"name": "rg-ArchLucid-staging", "location": "eastus"}

            if args[:2] == ["acr", "show"]:
                return {"loginServer": "acrstaging.azurecr.io", "name": "acrstaging"}

            if args[:2] == ["containerapp", "show"]:
                name = args[args.index("--name") + 1]
                return {
                    "name": name,
                    "resourceGroup": "rg-ArchLucid-staging",
                    "properties": {
                        "environmentId": (
                            "/subscriptions/sub-1/resourceGroups/rg-ArchLucid-staging"
                            "/providers/Microsoft.App/managedEnvironments/cae-staging"
                        )
                    },
                }

            raise AssertionError(f"unexpected az args: {args}")

        report = run_preflight(
            environment="staging",
            build_id="abc123",
            expected_tenant_id="tenant-1",
            expected_subscription_id="sub-1",
            check_resources=True,
            expected_resource_group="rg-ArchLucid-staging",
            expected_location="eastus",
            expected_acr_login_server="acrstaging.azurecr.io",
            expected_api_name="archlucid-api",
            expected_worker_name="archlucid-worker",
            expected_ui_name="archlucid-ui",
            expected_environment_name="cae-staging",
            az_runner=az_runner,
        )

        self.assertTrue(report.ok, msg="\n".join(report.errors))
        self.assertTrue(any(check.name == "application_targets" and check.status == "PASS" for check in report.checks))

    def test_run_preflight_resources_fail_wrong_rg_on_app(self) -> None:
        def az_runner(args: list[str]) -> dict[str, Any] | str | None:
            if args[:2] == ["account", "show"]:
                return {"tenantId": "tenant-1", "id": "sub-1"}

            if args[:2] == ["group", "show"]:
                return {"name": "rg-ArchLucid-staging", "location": "eastus"}

            if args[:2] == ["acr", "show"]:
                return {"loginServer": "acrstaging.azurecr.io"}

            if args[:2] == ["containerapp", "show"]:
                return {"name": "archlucid-api", "resourceGroup": "rg-OTHER", "properties": {}}

            raise AssertionError(f"unexpected az args: {args}")

        report = run_preflight(
            environment="staging",
            build_id="abc123",
            expected_tenant_id="tenant-1",
            expected_subscription_id="sub-1",
            check_resources=True,
            expected_resource_group="rg-ArchLucid-staging",
            expected_acr_login_server="acrstaging.azurecr.io",
            expected_api_name="archlucid-api",
            az_runner=az_runner,
        )

        self.assertFalse(report.ok)
        self.assertTrue(any(check.name == "application_targets" and check.status == "FAIL" for check in report.checks))

    def test_workflows_declare_preflight(self) -> None:
        errors = assert_workflows_declare_deploy_target_preflight(REPO_ROOT)
        self.assertEqual(errors, [], msg="\n".join(errors))

    def test_assert_workflows_detects_missing_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            workflow_dir = root / ".github" / "workflows"
            workflow_dir.mkdir(parents=True)
            (workflow_dir / "cd.yml").write_text("no preflight here\n", encoding="utf-8")
            (workflow_dir / "cd-staging-on-merge.yml").write_text("no preflight here\n", encoding="utf-8")

            errors = assert_workflows_declare_deploy_target_preflight(root)
            self.assertTrue(any("missing preflight marker" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
