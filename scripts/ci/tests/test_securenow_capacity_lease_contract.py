"""CAP-03 SQL lease concurrency/invalidation source contracts.

These checks do not replace real SQL Server concurrency tests.
"""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/"ArchLucid.Persistence/SecureNow/SqlSecureNowCapacityLeaseRepository.cs"
MIG=ROOT/"ArchLucid.Persistence/Migrations/419_SecureNowCapacityLeases.sql"

class CapacityLeaseContracts(unittest.TestCase):
    def test_atomic_claim_and_fenced_mutations(self):
        s=SRC.read_text(encoding="utf-8")
        for token in ("WITH (UPDLOCK, HOLDLOCK)", "BEGIN TRANSACTION",
                      "COMMIT TRANSACTION", "FencingToken = FencingToken + 1",
                      "AND ExpiresUtc <= @Now", "AND FencingToken = @Fence",
                      "AND OwnerId = @OwnerId", "AND ExpiresUtc > SYSUTCDATETIME()"):
            self.assertIn(token,s)
        self.assertNotIn("DELETE FROM dbo.SecureNowCapacityLeases",s)
        self.assertNotIn("TriggerAsync(",s)
    def test_unique_slots_and_persistent_fence(self):
        s=MIG.read_text(encoding="utf-8")
        self.assertIn("PRIMARY KEY CLUSTERED (TenantId, WorkloadKey, SlotNumber)",s)
        self.assertIn("FencingToken BIGINT NOT NULL",s)
        self.assertIn("IF OBJECT_ID(",s)

if __name__=="__main__":
    unittest.main()
