"""TB-217 demo seed startup drift guards (Batch 5AE)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestAdoptionBatch5AE(unittest.TestCase):
    def test_tb_217_demo_seed_startup_hosted_service_exists(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Hosting" / "DemoSeedStartupHostedService.cs"

        text = path.read_text(encoding="utf-8")

        self.assertIn("DemoSeedStartupWork", text)
        self.assertIn("BackgroundService", text)
        self.assertIn("DemoSeedBootstrapPolicy", text)

    def test_tb_217_startup_work_skips_when_showcase_policy_disabled(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Hosting" / "DemoSeedStartupWork.cs"

        text = path.read_text(encoding="utf-8")

        self.assertIn("DemoSeedBootstrapPolicy", text)
        self.assertIn("Demo seed skipped (showcase bootstrap policy).", text)
        self.assertIn("IDemoSeedService", text)
        self.assertIn("Showcase demo seed applied on startup.", text)
        self.assertIn("Showcase demo seed failed on startup; continuing without demo data.", text)

    def test_tb_217_program_registers_hosted_service(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api" / "Program.cs"

        text = path.read_text(encoding="utf-8")

        self.assertIn("AddHostedService<DemoSeedStartupHostedService>", text)

    def test_tb_217_unit_tests_cover_startup_seed(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "DemoSeedStartupHostedServiceTests.cs"

        text = path.read_text(encoding="utf-8")

        self.assertIn("RunAsync_when_showcase_policy_disabled_skips_seed", text)
        self.assertIn("RunAsync_when_anonymous_viewer_enabled_calls_seed", text)

    def test_tb_217_demo_workspaces_documents_auto_seed(self) -> None:
        path = REPO_ROOT / "docs" / "go-to-market" / "DEMO_WORKSPACES.md"

        text = path.read_text(encoding="utf-8")

        self.assertIn("Demo:AnonymousViewer:Enabled = true", text)
        self.assertIn("DemoSeedStartupHostedService", text)


if __name__ == "__main__":
    unittest.main()
