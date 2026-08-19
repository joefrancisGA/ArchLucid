"""Unit + drift tests for Container Apps HTTP probe path policy."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from container_app_probe_paths import (  # noqa: E402
    assert_container_app_probe_paths,
    assert_probe_policy_docs_present,
    main,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestContainerAppProbePaths(unittest.TestCase):
    def test_repo_terraform_matches_probe_policy(self) -> None:
        terraform = (REPO_ROOT / "infra" / "terraform-container-apps" / "main.tf").read_text(
            encoding="utf-8"
        )
        passed = assert_container_app_probe_paths(terraform)

        self.assertEqual(len(passed), 3)
        self.assertTrue(any("azurerm_container_app.api" in line for line in passed))
        self.assertTrue(any("azurerm_container_app.ui" in line and "/api/health" in line for line in passed))

    def test_repo_dependency_matrix_present(self) -> None:
        assert_probe_policy_docs_present(REPO_ROOT)

    def test_detects_api_readiness_drift_to_ready(self) -> None:
        terraform = (REPO_ROOT / "infra" / "terraform-container-apps" / "main.tf").read_text(
            encoding="utf-8"
        )
        # Force a single replacement inside the API resource only by rewriting the
        # first readiness path that is currently /health/live (API readiness).
        drifted = terraform.replace(
            """      readiness_probe {
        transport               = "HTTP"
        port                    = 8080
        path                    = "/health/live"
""",
            """      readiness_probe {
        transport               = "HTTP"
        port                    = 8080
        path                    = "/health/ready"
""",
            1,
        )

        with self.assertRaises(ValueError) as ctx:
            assert_container_app_probe_paths(drifted)

        self.assertIn("azurerm_container_app.api", str(ctx.exception))
        self.assertIn("/health/ready", str(ctx.exception))

    def test_detects_ui_probe_drift_to_root(self) -> None:
        terraform = (REPO_ROOT / "infra" / "terraform-container-apps" / "main.tf").read_text(
            encoding="utf-8"
        )
        drifted = terraform.replace('path      = "/api/health"', 'path      = "/"')

        with self.assertRaises(ValueError) as ctx:
            assert_container_app_probe_paths(drifted)

        self.assertIn("azurerm_container_app.ui", str(ctx.exception))

    def test_main_exits_zero_on_repo(self) -> None:
        previous = Path.cwd()

        try:
            os.chdir(REPO_ROOT)
            self.assertEqual(main(), 0)
        finally:
            os.chdir(previous)

    def test_missing_matrix_fails_doc_assert(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            (root / "docs" / "operations").mkdir(parents=True)

            with self.assertRaises(ValueError) as ctx:
                assert_probe_policy_docs_present(root)

            self.assertIn("missing dependency matrix", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
