"""Regression checks for SQL rowversion propagation through scoped remediation updates."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
CORE = ROOT / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs"
SQL = ROOT / "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs"
ATOMIC = ROOT / "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.AtomicVerification.cs"
SERVICE = ROOT / "ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs"

class RowVersionEnforcementTests(unittest.TestCase):
    def test_mutation_carries_expected_token(self):
        self.assertIn("public byte[]? ExpectedRowVersion", CORE.read_text())

    def test_sql_projects_and_maps_token(self):
        s = SQL.read_text()
        self.assertIn("RowVersion = row.RowVersion", s)
        self.assertIn("public byte[]? RowVersion", s)
        self.assertIn("ClosedUtc, RowVersion", s)

    def test_update_and_atomic_verification_require_nonnullable_token(self):
        for path in (SQL, ATOMIC):
            s = path.read_text()
            self.assertIn("RowVersion = @ExpectedRowVersion", s)
            self.assertIn("mutation.ExpectedRowVersion is not { Length: 8 }", s)
            self.assertNotIn("(@ExpectedRowVersion IS NULL OR RowVersion = @ExpectedRowVersion)", s)
        self.assertIn("if (updated != 1)", ATOMIC.read_text())

    def test_verification_restore_rereads_and_cas_protects_concurrent_state(self):
        s = SERVICE.read_text()
        segment = s.split("private async Task RestoreInstanceAfterAssociationFailureAsync(", 1)[1]
        segment = segment.split("private static VerifiedRemediationControlAssociationRecord CreateAssociation(", 1)[0]
        self.assertIn("TryGetByIdInScopeAsync(", segment)
        self.assertIn("current.RowVersion is not { Length: 8 }", segment)
        self.assertIn("ToMutation(current) with { ExpectedRowVersion = null }", segment)
        self.assertIn("ExpectedRowVersion = current.RowVersion", segment)
        self.assertIn("ToMutation(beforeVerify)", segment)

    def test_service_carries_original_read_token(self):
        s = SERVICE.read_text()
        self.assertIn("RowVersion = source.RowVersion", s)
        self.assertIn("ExpectedRowVersion = source.RowVersion", s)

if __name__ == "__main__":
    unittest.main()
