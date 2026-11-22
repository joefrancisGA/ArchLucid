"""Regression contract: caller-owned trial run saves cannot split quota and insert."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "ArchLucid.Persistence/Repositories/SqlRunRepository.Write.Save.cs"


class AtomicTrialRunSaveTests(unittest.TestCase):
    def test_caller_connection_requires_transaction_before_quota_write(self):
        source = SOURCE.read_text(encoding="utf-8")
        method = source.split("public async Task SaveAsync(", 1)[1].split("public async Task UpdateAsync(", 1)[0]
        guard = method.index("if (RunRepositoryCore.ShouldConsumeTrialRunAllowanceOnCreate(run) && transaction is null)")
        increment = method.index("await _tenantRepository.TryIncrementActiveTrialRunAsync")
        insert = method.index("connection.QuerySingleAsync<byte[]>")
        self.assertLess(guard, increment)
        self.assertLess(guard, insert)
        self.assertIn("transaction is null", method)
        self.assertIn("await tran.CommitAsync(ct)", method)


if __name__ == "__main__":
    unittest.main()
