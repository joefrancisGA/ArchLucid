"""Tests for assert_rollback_scripts_exist.py."""

from __future__ import annotations

import assert_rollback_scripts_exist as sut


def test_main_succeeds_on_real_repo_layout() -> None:
    assert sut.main() == 0

def test_securenow_manual_rollbacks_match_their_forward_objects() -> None:
    """Missing or mistargeted manual rollback companions must fail CI."""
    migration_dir = sut._repo_root() / "ArchLucid.Persistence" / "Migrations"
    objects = {
        "417_SecureNowCollectionTriggerClaims.sql": (
            "R417_SecureNowCollectionTriggerClaims.sql",
            "dbo.SecureNowCollectionTriggerClaims",
        ),
        "418_SecureNowRankedPathOrderedIndex.sql": (
            "R418_SecureNowRankedPathOrderedIndex.sql",
            "IX_SecurityEvidencePaths_Tenant_Workspace_Project_Snapshot_Path",
        ),
        "419_SecureNowCapacityLeases.sql": (
            "R419_SecureNowCapacityLeases.sql",
            "dbo.SecureNowCapacityLeases",
        ),
    }
    for forward, (rollback, target) in objects.items():
        assert (migration_dir / forward).is_file()
        path = migration_dir / "Rollback" / rollback
        assert path.is_file(), f"Missing manual rollback {rollback}"
        body = path.read_text(encoding="utf-8")
        assert target in body, f"Rollback {rollback} does not reference its forward object"
        assert "SET NOCOUNT ON;" in body
