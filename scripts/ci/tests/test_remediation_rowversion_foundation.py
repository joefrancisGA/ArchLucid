"""Guard the additive SQL Server remediation rowversion foundation."""
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[3]

class RemediationRowVersionFoundationTests(unittest.TestCase):
    def test_migration_is_additive_and_idempotent(self):
        sql = (ROOT / "ArchLucid.Persistence/Migrations/425_RemediationInstanceRowVersion.sql").read_text().lower()
        self.assertIn("col_length", sql)
        self.assertIn("rowversion not null", sql)
        self.assertIn("alter table dbo.remediationinstances add rowversion", sql)
        self.assertNotIn("drop table", sql)

    def test_record_exposes_token(self):
        source = (ROOT / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/RemediationInstanceRecord.cs").read_text()
        self.assertIn("public byte[]? RowVersion", source)

if __name__ == "__main__":
    unittest.main()
