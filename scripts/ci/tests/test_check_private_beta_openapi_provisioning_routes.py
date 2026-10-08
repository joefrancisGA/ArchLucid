"""Tests for private-beta provisioning OpenAPI route coverage."""

from __future__ import annotations

import sys
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
                route: {method: {} for method in methods}
                for route, methods in sut.REQUIRED_ROUTES.items()
            }
        }

        self.assertEqual(sut.collect_violations(payload), [])

    def test_missing_method_is_reported(self) -> None:
        payload = {"paths": {"/scim/v2/Users": {"get": {}}}}

        violations = sut.collect_violations(payload)

        self.assertTrue(any("missing provisioning route" in violation for violation in violations))
        self.assertTrue(any("/scim/v2/Users is missing methods" in violation for violation in violations))


if __name__ == "__main__":
    unittest.main()
