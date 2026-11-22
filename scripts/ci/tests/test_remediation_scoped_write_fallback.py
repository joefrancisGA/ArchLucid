"""Guard against unscoped writes in remediation repository default methods."""
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[3] / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs"

class ScopedRemediationFallbackTests(unittest.TestCase):
    def test_default_instance_insert_checks_project_scope(self):
        code = SOURCE.read_text()
        method = code.split("Task InsertInstanceInScopeAsync(", 1)[1].split("Task UpdateInstanceAsync(", 1)[0]
        self.assertIn("scope.Matches(instance.TenantId, instance.WorkspaceId, instance.ProjectId)", method)
        self.assertLess(method.index("scope.Matches("), method.index("InsertInstanceAsync(instance"))

    def test_default_evidence_insert_checks_instance_scope(self):
        code = SOURCE.read_text()
        method = code.split("Task InsertEvidenceInScopeAsync(", 1)[1].split("Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(", 1)[0]
        self.assertIn("evidence.TenantId != scope.TenantId", method)
        self.assertIn("TryGetByIdInScopeAsync(scope, evidence.InstanceId, cancellationToken)", method)
        self.assertLess(method.index("TryGetByIdInScopeAsync("), method.index("InsertEvidenceAsync(evidence"))

if __name__ == "__main__":
    unittest.main()
