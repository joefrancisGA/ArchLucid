from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
SERVICE = ROOT / "ArchLucid.Application/SecureNow/CollectionRunTriggerService.cs"
COUNTER = ROOT / "ArchLucid.Application/SecureNow/CollectionRunAdmissionCounter.cs"
CONTROLLER = ROOT / "ArchLucid.Api/Controllers/Authority/CollectionRunsController.cs"

class CapacityAdmissionContract(unittest.TestCase):
    def test_bounded_wait_and_cancellation_safety(self):
        source = SERVICE.read_text(encoding="utf-8")
        counter = COUNTER.read_text(encoding="utf-8")
        self.assertIn("Interlocked.Increment(ref waitingAdmissions)", counter)
        self.assertIn("Interlocked.Decrement(ref waitingAdmissions)", counter)
        self.assertNotIn("private static int waitingAdmissions", source)
        self.assertIn("_admissionCounter.IncrementWaiting()", source)
        self.assertIn("_admissionCounter.DecrementWaiting()", source)
        self.assertIn("timeout.CancelAfter(", source)
        self.assertIn("catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)", source)
        self.assertIn("SecureNowCapacityExceededException", source)
        self.assertIn("if (hasExecutionSlot)", source)
        self.assertIn("if (hasTenantGate)", source)

    def test_api_exposes_retryable_overload(self):
        source = CONTROLLER.read_text(encoding="utf-8")
        self.assertIn("StatusCodes.Status429TooManyRequests", source)
        self.assertIn('Response.Headers["Retry-After"]', source)

if __name__ == "__main__":
    unittest.main()
