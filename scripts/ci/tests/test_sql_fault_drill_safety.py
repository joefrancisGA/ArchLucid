"""Safety contract for opt-in disposable SQL fault drill."""
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "ArchLucid.Persistence.Tests/SqlDependencyRecoveryDrillTests.cs"

class SqlFaultDrillSafetyTests(unittest.TestCase):
    def test_drill_requires_explicit_opt_in_and_isolated_catalog(self):
        s = SOURCE.read_text()
        self.assertIn("I_APPROVE_DISPOSABLE_SQL_FAULT_DRILL", s)
        self.assertIn('StartsWith("ArchLucidFaultTest_"', s)
        self.assertIn("##ArchLucidRecovery_", s)
        self.assertIn("TimeSpan.FromSeconds(30)", s)
        self.assertIn("ex.Number == 1222", s)
        self.assertIn("held.RollbackAsync(ct)", s)
        self.assertIn("baseline.Should().Be(10", s)
        self.assertIn("after.Should().Be(30", s)

if __name__ == "__main__":
    unittest.main()
