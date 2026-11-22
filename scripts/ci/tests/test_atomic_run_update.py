"""Ensure owned run header validation and update share one SQL transaction."""
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[3] / "ArchLucid.Persistence/Repositories/SqlRunRepository.Write.Save.cs"

class AtomicRunUpdateTests(unittest.TestCase):
    def test_owned_guard_and_update_share_transaction(self):
        code = SOURCE.read_text(encoding="utf-8").split("public async Task UpdateAsync(", 1)[1].split("private static async Task EnsureCommittedRunHeaderAnchorsUnchangedAsync(", 1)[0]
        self.assertIn("owned.BeginTransactionAsync(ct)", code)
        self.assertIn("EnsureCommittedRunHeaderAnchorsUnchangedAsync(owned, ownedTransaction, run, ct)", code)
        self.assertIn("ApplyUpdateAsync(owned, ownedTransaction, run, sql, ct)", code)
        self.assertIn("ownedTransaction.CommitAsync(ct)", code)

if __name__ == "__main__":
    unittest.main()
