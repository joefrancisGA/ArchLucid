"""Guard the durable claim state transition and scope."""
from pathlib import Path
import unittest
SOURCE = Path(__file__).resolve().parents[3] / "ArchLucid.Persistence/SecureNow/SqlCollectionTriggerClaimRepository.cs"
class ClaimTransitionContract(unittest.TestCase):
    def test_cas_scheduled_transition_is_scope_and_run_bounded(self):
        s=SOURCE.read_text(encoding="utf-8").split("public async Task<bool> MarkScheduledAsync(",1)[1]
        for part in ("ClaimState = 1", "ClaimState = 0", "RunId = @RunId",
                     "TenantId = @TenantId", "WorkspaceId = @WorkspaceId",
                     "ProjectId = @ProjectId", "IdempotencyKey = @IdempotencyKey"):
            self.assertIn(part,s)
if __name__=="__main__":
    unittest.main()
