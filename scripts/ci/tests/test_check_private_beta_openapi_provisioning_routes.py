"""Tests for private-beta provisioning OpenAPI route coverage."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

CI_ROOT = Path(__file__).resolve().parents[1]

if str(CI_ROOT) not in sys.path:
    sys.path.insert(0, str(CI_ROOT))

import check_private_beta_openapi_provisioning_routes as sut


class TestPrivateBetaOpenApiProvisioningRoutes(unittest.TestCase):
    def test_snapshot_passes(self) -> None:
        payload = {
            "paths": {
                route: {
                    method: {
                        "responses": {"401": {}, "403": {}},
                        "x-archlucid-audience": "operator",
                    }
                    for method in methods
                }
                for route, methods in sut.REQUIRED_ROUTES.items()
            }
        }

        self.assertEqual(sut.collect_violations(payload), [])

    def test_missing_method_is_reported(self) -> None:
        payload = {"paths": {"/scim/v2/Users": {"get": {}}}}

        violations = sut.collect_violations(payload)

        self.assertTrue(any("missing provisioning route" in violation for violation in violations))
        self.assertTrue(any("/scim/v2/Users is missing methods" in violation for violation in violations))

    def test_missing_auth_contract_is_reported(self) -> None:
        payload = {
            "paths": {
                route: {
                    method: {
                        "responses": {"200": {}},
                        "x-archlucid-audience": "operator",
                    }
                    for method in methods
                }
                for route, methods in sut.REQUIRED_ROUTES.items()
            }
        }

        violations = sut.collect_violations(payload)

        self.assertTrue(any("missing auth responses" in violation for violation in violations))

    def test_non_operator_audience_is_reported(self) -> None:
        payload = {
            "paths": {
                route: {
                    method: {
                        "responses": {"401": {}, "403": {}},
                        "x-archlucid-audience": "reader",
                    }
                    for method in methods
                }
                for route, methods in sut.REQUIRED_ROUTES.items()
            }
        }

        violations = sut.collect_violations(payload)

        self.assertTrue(any("x-archlucid-audience=operator" in violation for violation in violations))

    def test_generated_client_route_drift_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for relative_path in sut.GENERATED_PATH_FILES:
                path = root / relative_path
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('"/v1/admin/users/invite"', encoding="utf-8")

            violations = sut.collect_generated_client_violations(root)

        self.assertTrue(any("missing generated routes" in violation for violation in violations))


if __name__ == "__main__":
    unittest.main()
