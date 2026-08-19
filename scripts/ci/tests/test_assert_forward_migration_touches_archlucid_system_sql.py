"""Tests for assert_forward_migration_touches_archlucid_system_sql."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

import assert_forward_migration_touches_archlucid_system_sql as sut


class TestForwardMigrationTouchesArchLucidSystemSql(unittest.TestCase):
    def test_evaluate_no_system_migrations_skips(self) -> None:
        code, msg = sut.evaluate_changed_paths(
            [
                "ArchLucid.Persistence/Migrations/142_PilotCloseouts.sql",
                "foo.cs",
            ],
        )

        self.assertEqual(code, 0)
        self.assertIn("skipped", msg.lower())

    def test_evaluate_forward_without_system_sql_fails(self) -> None:
        code, msg = sut.evaluate_changed_paths(
            [
                "ArchLucid.Persistence/Migrations/System/004_NewControlPlane.sql",
            ],
        )

        self.assertEqual(code, 1)
        self.assertIn("004_NewControlPlane.sql", msg)
        self.assertIn(sut.ARCHLUCID_SYSTEM_SQL_PATH, msg)

    def test_evaluate_forward_with_system_sql_ok(self) -> None:
        code, msg = sut.evaluate_changed_paths(
            [
                "ArchLucid.Persistence/Migrations/System/004_NewControlPlane.sql",
                sut.ARCHLUCID_SYSTEM_SQL_PATH,
            ],
        )

        self.assertEqual(code, 0)
        self.assertIn("004_NewControlPlane.sql", msg)

    def test_normalize_path_and_pattern(self) -> None:
        self.assertTrue(
            sut.is_forward_system_migration_path(
                r"ArchLucid.Persistence\Migrations\System\003_WarmTenantCatalogStandby.sql",
            ),
        )
        self.assertFalse(
            sut.is_forward_system_migration_path("ArchLucid.Persistence/Migrations/099_Foo.sql"),
        )
