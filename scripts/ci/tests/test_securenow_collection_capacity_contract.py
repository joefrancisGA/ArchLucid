"""Capacity admission contract: process bulkhead, per-tenant idempotency ordering and instrumentation."""
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[3] / "ArchLucid.Application/SecureNow/CollectionRunTriggerService.cs"

class CollectionCapacityContractTests(unittest.TestCase):
    def test_execution_bulkhead_and_release(self):
        src = SOURCE.read_text(encoding="utf-8")
        self.assertIn("new(8, 8)", src)
        self.assertIn("ActiveTriggerSlots.WaitAsync(admissionToken)", src)
        self.assertIn("CollectionTriggerAdmissionCounter _admissionCounter", src)
        self.assertIn("ActiveTriggerSlots.Release()", src)
        self.assertLess(src.index("triggerGate.WaitAsync(admissionToken)"), src.index("ActiveTriggerSlots.WaitAsync(admissionToken)"))
        self.assertIn("securenow.collection.admission_wait_ms", src)
        self.assertIn("securenow.collection.trigger_attempts", src)
        self.assertIn("scope.TenantId.GetHashCode()", src)
        self.assertIn("scope.WorkspaceId:N", src)
        self.assertIn("scope.ProjectId:N", src)

if __name__ == "__main__":
    unittest.main()
