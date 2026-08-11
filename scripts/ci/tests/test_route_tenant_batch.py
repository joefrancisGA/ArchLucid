"""TB-277 / TB-278 route tenant scope binding drift guards."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]

ROUTE_TENANT_MATRIX_ROUTES = (
    "/v1/admin/tenants/",
    "/v1/admin/metering/",
    "/v1/value-report/",
)


class TestRouteTenantBatch(unittest.TestCase):
    def test_route_tenant_scope_guard_passes(self) -> None:
        script = REPO_ROOT / "scripts" / "ci" / "assert_route_tenant_scope_guard.py"
        proc = subprocess.run(
            [sys.executable, str(script)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(0, proc.returncode, proc.stderr or proc.stdout)

    def test_global_route_tenant_filter_is_registered(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Startup" / "MvcExtensions.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("RouteTenantScopeBindingFilter", text)

    def test_route_tenant_idor_matrix_covers_tenant_scoped_routes(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopedSnapshotReadIdorIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")

        for fragment in ROUTE_TENANT_MATRIX_ROUTES:
            self.assertIn(fragment, text, f"TB-278 matrix must cover {fragment}")

    def test_route_tenant_positive_path_matrix_tb292(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ScopedSnapshotReadIdorIntegrationTests.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("AssertMatchingTenantRouteNotForbiddenAsync", text)
        # TB-292 matrix shipped with tb292 markers; batch 5DU-route-tenant-p1 retargeted scope-only routes (TB-279/280/281).
        has_positive_path_marker = (
            "tb292" in text.lower()
            or "tb279" in text.lower()
            or "tb280" in text.lower()
            or "tb281" in text.lower()
        )
        self.assertTrue(has_positive_path_marker, "positive-path matrix must retain TB-292 or scope-only successor markers")

    def test_route_tenant_scope_binding_filter_source_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Security" / "RouteTenantScopeBindingFilter.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")


if __name__ == "__main__":
    unittest.main()
