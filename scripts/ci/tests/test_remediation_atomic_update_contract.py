"""Prevent reintroduction of a read-modify-unscoped-write default mutation."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]

class RemediationAtomicUpdateContractTests(unittest.TestCase):
    def test_legacy_tenant_only_update_is_absent_from_every_repository_surface(self):
        paths = (
            "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs",
            "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs",
            "ArchLucid.Persistence/InfraEvidence/NoOpRemediationInstanceRepository.cs",
            "ArchLucid.Application.Tests/InfraEvidence/RemediationInstanceServiceTests.cs",
            "ArchLucid.Application.Tests/InfraEvidence/RemediationPrioritizationAndWaveServiceTests.cs",
        )
        for path in paths:
            with self.subTest(path=path):
                source = (ROOT / path).read_text()
                self.assertNotIn("UpdateInstanceAsync(", source)

    def test_default_scoped_update_fails_closed(self):
        source = (ROOT / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs").read_text()
        method = source.split("Task UpdateInstanceInScopeAsync(", 1)[1].split("/// <summary>Persist verification evidence", 1)[0]
        self.assertIn("throw new NotSupportedException", method)
        self.assertNotIn("UpdateInstanceAsync(", method)
        self.assertNotIn("TryGetByIdInScopeAsync(", method)

    def test_sql_implements_scoped_update(self):
        source = (ROOT / "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs").read_text()
        method = source.split("public async Task UpdateInstanceInScopeAsync(", 1)[1].split("public async Task<RemediationInstanceRecord?>", 1)[0]
        for token in ("WHERE TenantId = @TenantId", "AND WorkspaceId = @WorkspaceId", "AND ProjectId = @ProjectId", "AND InstanceId = @InstanceId"):
            self.assertIn(token, method)

if __name__ == "__main__":
    unittest.main()
