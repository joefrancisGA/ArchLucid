"""Durable scoped reservation SQL contract (source-shape guard; not SQL integration)."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
SQL = ROOT / "ArchLucid.Persistence/SecureNow/SqlCollectionTriggerClaimRepository.cs"
MIGRATION = ROOT / "ArchLucid.Persistence/Migrations/417_SecureNowCollectionTriggerClaims.sql"

class DistributedClaimContracts(unittest.TestCase):
    def test_unique_scope_and_key(self):
        sql = MIGRATION.read_text(encoding="utf-8")
        self.assertIn("(TenantId, WorkspaceId, ProjectId, IdempotencyKey)", sql)
        self.assertIn("PRIMARY KEY CLUSTERED", sql)
        self.assertIn("ClaimState IN (0, 1, 2)", sql)
    def test_atomic_reservation_is_scoped(self):
        sql = SQL.read_text(encoding="utf-8")
        for clause in ("WITH (UPDLOCK, HOLDLOCK)", "BEGIN TRANSACTION", "COMMIT TRANSACTION",
                       "TenantId = @TenantId", "WorkspaceId = @WorkspaceId",
                       "ProjectId = @ProjectId", "IdempotencyKey = @IdempotencyKey",
                       "SET XACT_ABORT ON"):
            self.assertIn(clause, sql)
        self.assertNotIn("TriggerAsync(", sql)

if __name__ == "__main__":
    unittest.main()
