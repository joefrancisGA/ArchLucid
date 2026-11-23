"""Fail-closed SQL upsert race regression for tenant database binding.

The source-reviewed defect is concurrent first-time UpsertPendingAsync calls
for the same TenantId. SQL MERGE without a serializable key-range lock can
race into duplicate inserts. This is a focused SQL contract test; an actual
SQL Server concurrency integration test remains a separate concern.
"""
from pathlib import Path
import re
import unittest

SOURCE = (
    Path(__file__).resolve().parents[2]
    / "ArchLucid.Persistence" / "Tenancy"
    / "DapperTenantDatabaseBindingRepository.cs"
)


def guarded_binding_merge(source: str) -> bool:
    match = re.search(
        r"MERGE\s+dbo\.TenantDatabaseBindings\s+"
        r"WITH\s*\(\s*HOLDLOCK\s*\)\s+AS\s+target\s+"
        r"USING\s*\(\s*SELECT\s+@TenantId\s+AS\s+TenantId\s*\)\s+AS\s+src\s+"
        r"ON\s+target\.TenantId\s*=\s*src\.TenantId",
        source,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return match is not None


class TenantDatabaseBindingMergeGuardTests(unittest.TestCase):
    def test_real_binding_upsert_serializes_missing_tenant_key_range(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertTrue(guarded_binding_merge(source))
        self.assertIn("WHEN NOT MATCHED THEN", source)
        self.assertIn("INSERT (TenantId, SqlLogicalDatabaseName", source)
        self.assertIn("WHEN MATCHED THEN", source)

    def test_regression_unlocked_merge_is_rejected(self):
        source = SOURCE.read_text(encoding="utf-8")
        unlocked = source.replace(
            "MERGE dbo.TenantDatabaseBindings WITH (HOLDLOCK) AS target",
            "MERGE dbo.TenantDatabaseBindings AS target",
        )
        self.assertNotEqual(source, unlocked)
        self.assertFalse(guarded_binding_merge(unlocked))

    def test_guard_is_specific_to_the_binding_table_and_tenant_key(self):
        source = SOURCE.read_text(encoding="utf-8")
        different_table = source.replace(
            "MERGE dbo.TenantDatabaseBindings WITH (HOLDLOCK) AS target",
            "MERGE dbo.OtherTenantBindings WITH (HOLDLOCK) AS target",
        )
        self.assertFalse(guarded_binding_merge(different_table))
        different_key = source.replace(
            "ON target.TenantId = src.TenantId",
            "ON target.SqlLogicalDatabaseName = src.TenantId",
        )
        self.assertFalse(guarded_binding_merge(different_key))


if __name__ == "__main__":
    unittest.main()
