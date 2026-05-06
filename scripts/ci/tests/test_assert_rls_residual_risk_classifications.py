"""Tests for assert_rls_residual_risk_classifications."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

import assert_rls_residual_risk_classifications as sut


class TestRlsResidualRiskClassifications(unittest.TestCase):
    def test_extract_dbo_create_tables_ignores_comments_and_parses_supported_forms(self) -> None:
        sql = """
        /* CREATE TABLE dbo.CommentedOut (Id INT NOT NULL); */
        -- CREATE TABLE dbo.LineCommentedOut (Id INT NOT NULL);
        CREATE TABLE dbo.ScopeCovered
        (
            Id INT NOT NULL
        );
        CREATE TABLE [dbo].[TenantOnly] (
            Id INT NOT NULL
        );
        CREATE TABLE OperationalTable (
            Id INT NOT NULL
        );
        """

        self.assertEqual(
            sut.extract_dbo_create_tables(sql),
            {"ScopeCovered", "TenantOnly", "OperationalTable"},
        )

    def test_evaluate_accepts_all_documented_classification_buckets(self) -> None:
        current_tables = {
            "ScopeCovered",
            "TenantOnly",
            "SystemPlane",
            "ChildWithControl",
            "Operational",
            "AcceptedResidual",
        }
        matrix = """
        | Classification | Tables |
        |----------------|--------|
        | `rls-covered-scope-triple` | `dbo.ScopeCovered` |
        | `tenant-only-covered` | `dbo.TenantOnly` |
        | `database-per-tenant/system-plane-only` | `dbo.SystemPlane` |
        | `child-table-with-compensating-control` | `dbo.ChildWithControl` |
        | `operational-table` | `dbo.Operational` |
        | `explicit-accepted-residual-risk` | `dbo.AcceptedResidual` |
        """
        classifications, errors = sut.parse_matrix_classifications(matrix)

        result = sut.evaluate_tables(current_tables, {}, classifications, errors)

        self.assertEqual(result.exit_code, 0)
        self.assertIn("OK:", result.message)

    def test_evaluate_fails_for_unknown_table_with_actionable_message(self) -> None:
        classifications, errors = sut.parse_matrix_classifications(
            "| `rls-covered-scope-triple` | `dbo.ScopeCovered` |\n"
        )

        result = sut.evaluate_tables({"ScopeCovered", "UnknownTenantTable"}, {}, classifications, errors)

        self.assertEqual(result.exit_code, 1)
        self.assertIn("dbo.UnknownTenantTable", result.message)
        self.assertIn("MULTI_TENANT_RLS_RESIDUAL_RISK_MATRIX.md", result.message)

    def test_changed_migration_table_requires_classification_even_before_consolidated_sql(self) -> None:
        classifications, errors = sut.parse_matrix_classifications(
            "| `operational-table` | `dbo.CurrentOperational` |\n"
        )

        result = sut.evaluate_tables(
            {"CurrentOperational"},
            {"ArchLucid.Persistence/Migrations/999_NewTenantTable.sql": {"NewTenantTable"}},
            classifications,
            errors,
        )

        self.assertEqual(result.exit_code, 1)
        self.assertIn("999_NewTenantTable.sql", result.message)

    def test_duplicate_matrix_classification_fails(self) -> None:
        classifications, errors = sut.parse_matrix_classifications(
            """
            | `tenant-only-covered` | `dbo.DuplicateTable` |
            | `operational-table` | `dbo.DuplicateTable` |
            """
        )

        result = sut.evaluate_tables({"DuplicateTable"}, {}, classifications, errors)

        self.assertEqual(result.exit_code, 1)
        self.assertIn("classified as both", result.message)

    def test_forward_dbup_migration_path_matching(self) -> None:
        self.assertTrue(
            sut.is_forward_dbup_migration_path(
                r"ArchLucid.Persistence\Migrations\999_NewTenantTable.sql"
            )
        )
        self.assertFalse(
            sut.is_forward_dbup_migration_path(
                "ArchLucid.Persistence/Migrations/Rollback/R999_NewTenantTable.sql"
            )
        )
        self.assertFalse(
            sut.is_forward_dbup_migration_path(
                "ArchLucid.Persistence/Migrations/System/003_SystemTable.sql"
            )
        )


if __name__ == "__main__":
    unittest.main()
