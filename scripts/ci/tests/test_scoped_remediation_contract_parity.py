"""Guard the three remediation repository contract layers against method drift.

This source-level guard is intentionally narrow: the scoped port, its adapter and
the underlying repository must all expose the same atomic verification operation.
It detects the exact CS1061 regression that escaped the #7611 focused workflow.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[3]
PORT = ROOT / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/ProjectScopedRepositoryCapabilities.cs"
ADAPTER = ROOT / "ArchLucid.Persistence/InfraEvidence/ProjectScopedRepositoryAdapters.cs"
REPOSITORY = ROOT / "ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs"

def section(source: str, start: str, end: str) -> str:
    return source.split(start, 1)[1].split(end, 1)[0]

class ScopedRemediationContractParityTests(unittest.TestCase):
    def test_atomic_verification_is_exposed_at_every_layer(self):
        scoped = section(PORT.read_text(), "public interface IProjectScopedRemediationInstanceRepository", "public interface IProjectScopedAuditAssessmentRepository")
        adapter = section(ADAPTER.read_text(), "public sealed class ProjectScopedRemediationInstanceRepositoryAdapter", "public sealed class ProjectScopedAuditAssessmentRepositoryAdapter")
        repository = REPOSITORY.read_text()
        for source in (scoped, adapter, repository):
            self.assertRegex(source, r"\bCommitVerificationInScopeAsync\s*\(")
            signature = section(source, "CommitVerificationInScopeAsync(", ")")
            for argument in ("ProjectScopeKey scope", "RemediationInstanceMutation mutation", "RemediationEvidenceRecord evidence", "CancellationToken cancellationToken"):
                self.assertIn(argument, signature)
        self.assertRegex(adapter, r"inner\.CommitVerificationInScopeAsync\s*\(\s*scope\s*,\s*mutation\s*,\s*evidence\s*,\s*cancellationToken\s*\)")

if __name__ == "__main__":
    unittest.main()
