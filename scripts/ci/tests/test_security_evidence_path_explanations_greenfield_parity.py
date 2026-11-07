"""Keep SecureNow 386/420 DbUp migration and greenfield DDL in parity.

Static source guard, not a replacement for real SQL Server / DbUp integration.
"""
from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CI = ROOT / "scripts" / "ci"
if str(CI) not in sys.path:
    sys.path.insert(0, str(CI))

import build_archlucid_unified_schema_sql as generator


TABLE = "SecurityEvidencePathExplanations"
DDL = ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid.sql"
UNIFIED = ROOT / "ArchLucid.Persistence" / "Scripts" / "ArchLucid_Unified_Schema.sql"
MIGRATIONS = ROOT / "ArchLucid.Persistence" / "Migrations"


def table_body(sql: str) -> str:
    match = re.search(
        rf"CREATE TABLE dbo\\.{TABLE}\\s*\\(\\s*([\\s\\S]*?)\\n\\s*\\);",
        sql,
        flags=re.IGNORECASE,
    )
    if match is None:
        raise AssertionError(f"Missing CREATE TABLE dbo.{TABLE}")
    return match.group(1)


def column_specs(table_sql: str) -> dict[str, tuple[str, str]]:
    specs: dict[str, tuple[str, str]] = {}
    for line in table_sql.splitlines():
        match = re.match(
            r"\\s*(\\w+)\\s+(UNIQUEIDENTIFIER|INT|DATETIME2|NVARCHAR\\((?:MAX|\\d+)\\))\\s+(NOT NULL|NULL)\\s*,?\\s*$",
            line,
            flags=re.IGNORECASE,
        )
        if match:
            specs[match.group(1)] = (match.group(2).upper(), match.group(3).upper())
    return specs


class SecureNowGreenfieldParityTests(unittest.TestCase):
    def test_386_base_table_is_identical_to_greenfield_definition(self) -> None:
        base = (MIGRATIONS / "386_SecurityEvidencePathExplanations.sql").read_text(encoding="utf-8")
        greenfield = DDL.read_text(encoding="utf-8")
        migration_columns = column_specs(table_body(base))
        greenfield_columns = column_specs(table_body(greenfield))
        self.assertGreaterEqual(len(migration_columns), 9)
        self.assertEqual(migration_columns, {
            k: v for k, v in greenfield_columns.items() if k != "ModelOutputRejection"
        })
        for constraint in (
            "PK_SecurityEvidencePathExplanations",
            "FK_SecurityEvidencePathExplanations_Paths",
            "IX_SecurityEvidencePathExplanations_Tenant_Path",
        ):
            self.assertIn(constraint, base)
            self.assertIn(constraint, greenfield)

    def test_420_additive_nullable_column_matches_greenfield(self) -> None:
        migration = (
            MIGRATIONS / "420_SecureNowSecurityEvidencePathExplanationModelOutputRejection.sql"
        ).read_text(encoding="utf-8")
        greenfield = DDL.read_text(encoding="utf-8")
        specs = column_specs(table_body(greenfield))
        self.assertEqual(("NVARCHAR(512)", "NULL"), specs["ModelOutputRejection"])
        for sql in (migration, greenfield):
            self.assertRegex(sql, r"ADD ModelOutputRejection NVARCHAR\\(512\\) NULL;")
            self.assertIn("COL_LENGTH(N'dbo.SecurityEvidencePathExplanations', N'ModelOutputRejection') IS NULL", sql)
        self.assertEqual(1, len(re.findall(r"CREATE TABLE dbo\\.SecurityEvidencePathExplanations", greenfield)))

    def test_unified_schema_matches_generator_and_contains_table(self) -> None:
        checked_in = UNIFIED.read_text(encoding="utf-8")
        self.assertEqual(generator.render_unified_schema(), checked_in)
        self.assertEqual(1, checked_in.count("CREATE TABLE dbo.SecurityEvidencePathExplanations"))
        self.assertIn("ADD ModelOutputRejection NVARCHAR(512) NULL;", checked_in)


if __name__ == "__main__":
    unittest.main()
