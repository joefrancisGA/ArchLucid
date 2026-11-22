"""Ensure optional optimistic-concurrency precondition reaches scoped SQL UPDATE."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]

class RemediationOptimisticConcurrencyTests(unittest.TestCase):
    def test_mutation_exposes_expected_timestamp(self):
        s = (ROOT / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs").read_text()
        self.assertIn("public DateTime? ExpectedUpdatedUtc { get; init; }", s.split("public sealed record RemediationInstanceMutation",1)[1])

    def test_sql_update_checks_precondition(self):
        s = (ROOT / "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs").read_text()
        m = s.split("public async Task UpdateInstanceInScopeAsync(",1)[1].split("public async Task<RemediationInstanceRecord?> TryGetByIdAsync(",1)[0]
        self.assertIn("(@ExpectedUpdatedUtc IS NULL OR UpdatedUtc = @ExpectedUpdatedUtc)", m)
        self.assertIn("mutation.ExpectedUpdatedUtc", m)
        self.assertIn("affected != 1", m)

if __name__ == "__main__":
    unittest.main()
