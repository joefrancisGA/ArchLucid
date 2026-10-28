"""Guard bounded tenant-stripe admission and scoped idempotency."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "ArchLucid.Application/SecureNow/CollectionRunTriggerService.cs"

class CollectionTriggerAdmissionTests(unittest.TestCase):
    def test_scoped_gates_and_idempotency(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn("Enumerable.Range(0, 64)", source)
        self.assertIn("scope.TenantId.GetHashCode()", source)
        self.assertIn("triggerGate.WaitAsync(cancellationToken)", source)
        self.assertIn("triggerGate.Release()", source)
        self.assertIn("scope.WorkspaceId:N", source)
        self.assertIn("scope.ProjectId:N", source)
        self.assertIn("_idempotencyStore.TryGet(scopedKey", source)
        self.assertNotIn("private static readonly SemaphoreSlim TriggerGate = new(1, 1)", source)

if __name__ == "__main__":
    unittest.main()
