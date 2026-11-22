"""Guard that scoped remediation control queries delegate to repository pushdown."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]

class RemediationControlContractTests(unittest.TestCase):
    def test_scoped_port_does_not_repeat_tenant_wide_filter(self):
        code = (ROOT / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/ProjectScopedRepositoryCapabilities.cs").read_text()
        section = code.split("public interface IProjectScopedRemediationInstanceRepository", 1)[1].split("public interface IProjectScopedAuditAssessmentRepository", 1)[0]
        method = section.split("ListByControlIdInScopeAsync(", 1)[1]
        self.assertIn("CancellationToken cancellationToken = default);", method)
        self.assertNotIn("Where(row => row.ControlId", method)

    def test_adapter_delegates_to_underlying_repository(self):
        code = (ROOT / "ArchLucid.Persistence/InfraEvidence/ProjectScopedRepositoryAdapters.cs").read_text()
        section = code.split("public sealed class ProjectScopedRemediationInstanceRepositoryAdapter", 1)[1].split("public sealed class ProjectScopedAuditAssessmentRepositoryAdapter", 1)[0]
        self.assertIn("inner.ListByControlIdInScopeAsync(scope, controlId, cancellationToken)", section)

if __name__ == "__main__":
    unittest.main()
