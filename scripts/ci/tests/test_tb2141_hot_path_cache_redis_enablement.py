"""CI drift guard for TB-2141 staging/production HotPathCache Redis L2 enablement pack."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
GUIDE = REPO_ROOT / "docs" / "library" / "SCALE_TIER_CACHE_GUIDE.md"
STAGING_TFVARS = REPO_ROOT / "infra" / "terraform-container-apps" / "staging.tfvars.example"
PRODUCTION_TFVARS = REPO_ROOT / "infra" / "terraform-container-apps" / "production.tfvars.example"
CHECKLIST = REPO_ROOT / "scripts" / "ops" / "enable-hot-path-cache-redis-checklist.ps1"
PROVISION = REPO_ROOT / "scripts" / "ops" / "provision-hot-path-cache-managed-redis.ps1"
CONTAINER_APPS_MAIN = REPO_ROOT / "infra" / "terraform-container-apps" / "main.tf"


class TestTb2141HotPathCacheRedisEnablement(unittest.TestCase):
    def test_scale_tier_cache_guide_documents_tb2141_enablement(self) -> None:
        text = GUIDE.read_text(encoding="utf-8")
        self.assertIn("TB-2141", text)
        self.assertIn("hot_path_cache_redis_connection_string", text)
        self.assertIn("ExpectedApiReplicaCount", text)

    def test_staging_and_production_tfvars_examples_wire_redis_var(self) -> None:
        for path in (STAGING_TFVARS, PRODUCTION_TFVARS):
            text = path.read_text(encoding="utf-8")
            self.assertIn("TB-2141", text, f"{path.name} should reference TB-2141")
            self.assertIn(
                "hot_path_cache_redis_connection_string",
                text,
                f"{path.name} should document hot_path_cache_redis_connection_string",
            )

    def test_ops_scripts_exist_and_reference_tb2141(self) -> None:
        self.assertTrue(CHECKLIST.is_file())
        self.assertTrue(PROVISION.is_file())
        checklist = CHECKLIST.read_text(encoding="utf-8")
        provision = PROVISION.read_text(encoding="utf-8")
        self.assertIn("TB-2141", checklist)
        self.assertIn("TB-2141", provision)

    def test_container_apps_sets_expected_replica_count_when_redis_configured(self) -> None:
        main_tf = CONTAINER_APPS_MAIN.read_text(encoding="utf-8")
        self.assertIn("HotPathCache__ExpectedApiReplicaCount", main_tf)
        self.assertIn("var.api_max_replicas", main_tf)
        self.assertIn("hot_path_cache_redis_configured", main_tf)


if __name__ == "__main__":
    unittest.main()
