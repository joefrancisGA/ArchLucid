"""Structural guard for safe, scoped reconciliation without replay."""
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[3] / "ArchLucid.Persistence/SecureNow/SqlCollectionTriggerClaimRepository.cs"

class ReconcileClaimContractTests(unittest.TestCase):
    def test_only_matching_persisted_run_marks_pending_scheduled(self):
        text = SOURCE.read_text(encoding="utf-8").split("public async Task<bool> ReconcilePersistedRunAsync(", 1)[1].split("private sealed class ClaimRow", 1)[0]
        for term in ("ClaimState = 1", "claim.ClaimState = 0",
                     "dbo.SecureNowCollectionRuns", "AND EXISTS",
                     "run.TenantId = claim.TenantId", "run.WorkspaceId = claim.WorkspaceId",
                     "run.ProjectId = claim.ProjectId", "run.RunId = claim.RunId",
                     "claim.IdempotencyKey = @IdempotencyKey", "claim.RunId = @RunId"):
            self.assertIn(term, text)
        self.assertNotIn("TriggerAsync(", text)

if __name__ == "__main__":
    unittest.main()
