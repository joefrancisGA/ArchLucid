"""Shared source assertions for the remediation SQL regression's isolated catalog."""

from pathlib import Path
from unittest import TestCase


def assert_uses_disposable_catalog(case: TestCase, root: Path, test_source: str) -> None:
    fixture = (root / "ArchLucid.Persistence.Tests/SqlServerDisposablePersistenceFixture.cs").read_text()
    for source, markers in (
        (
            test_source,
            (
                "[Collection(nameof(SqlServerDisposablePersistenceCollection))]",
                "RemediationSqlRolePrivilegesTests(SqlServerDisposablePersistenceFixture fixture)",
                "new(fixture.ConnectionString)",
            ),
        ),
        (
            fixture,
            (
                'OwnedCatalogPrefix = "ArchLucidPersistenceTest_"',
                'OwnedCatalogPrefix + Guid.NewGuid().ToString("N")',
                "CREATE DATABASE",
                "await createCommand.ExecuteNonQueryAsync();",
                "verified.Database, owned.InitialCatalog, StringComparison.Ordinal",
                "DropCatalogIfExists(connectionString)",
            ),
        ),
    ):
        for marker in markers:
            with case.subTest(disposable_catalog_marker=marker):
                case.assertIn(marker, source)
