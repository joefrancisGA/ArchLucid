from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "ArchLucid.Persistence/SecureNow/SqlSecureNowCapacityLeaseRepository.cs"

class FencedLeaseCheckTests(unittest.TestCase):
    def test_current_owner_probe_checks_scope_owner_fence_and_expiry(self):
        source = SRC.read_text(encoding="utf-8")
        body = source.split("public async Task<bool> IsCurrentAsync(",1)[1].split("private static void Validate(",1)[0]
        for predicate in ("TenantId = @TenantId", "WorkloadKey = @WorkloadKey",
                          "SlotNumber = @Slot", "OwnerId = @OwnerId",
                          "FencingToken = @Fence", "ExpiresUtc > SYSUTCDATETIME()"):
            self.assertIn(predicate, body)
        self.assertNotIn("UPDATE dbo.",body)

if __name__ == "__main__":
    unittest.main()
