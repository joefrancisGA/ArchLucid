"""Contract tests for SQL run execution ownership lease concurrency."""
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[3] / "ArchLucid.Persistence/Data/Repositories/SqlRunExecuteOwnershipLeaseRepository.cs"

class RunExecuteLeaseConcurrencyTests(unittest.TestCase):
    def test_absent_row_claim_uses_serializable_key_range_lock(self):
        code = SOURCE.read_text()
        self.assertIn("WITH (UPDLOCK, HOLDLOCK)", code)
        self.assertIn("connection.BeginTransaction(IsolationLevel.ReadCommitted)", code)
        self.assertIn("ex.Number is 2601 or 2627", code)

    def test_exact_expiry_is_reclaimable_and_listed(self):
        code = SOURCE.read_text()
        self.assertIn("row.LeaseExpiresUtc <= nowUtc", code)
        self.assertIn("LeaseExpiresUtc <= @AsOfUtc", code)
        self.assertIn("ORDER BY LeaseExpiresUtc ASC, RunId ASC", code)

if __name__ == "__main__":
    unittest.main()
