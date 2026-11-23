"""Atomic remediation verification structural contract."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]

class AtomicVerificationTests(unittest.TestCase):
    def test_sql_update_and_evidence_share_transaction(self):
        code = (ROOT / "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.AtomicVerification.cs").read_text()
        self.assertIn("dbo.uspRemediationCommitVerification", code)
        self.assertNotIn("UPDATE dbo.RemediationInstances", code)
        sql = (ROOT / "ArchLucid.Persistence/Migrations/427_RemediationProcedureOnlyUpdates.sql").read_text()
        body = sql.split("CREATE OR ALTER PROCEDURE dbo.uspRemediationCommitVerification", 1)[1].split("GO", 1)[0]
        self.assertIn("BEGIN TRANSACTION", body)
        self.assertIn("COMMIT TRANSACTION", body)
        self.assertIn("ROLLBACK TRANSACTION", body)
        self.assertLess(body.index("UPDATE dbo.RemediationInstances"), body.index("INSERT INTO dbo.RemediationEvidence"))
        self.assertIn("AND Status = 9", body)

    def test_service_uses_atomic_method(self):
        code = (ROOT / "ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs").read_text()
        segment = code.split("RemediationEvidenceRecord verificationEvidence = new()", 1)[1].split("// A failed check leaves", 1)[0]
        self.assertIn("CommitVerificationInScopeAsync", segment)
        self.assertNotIn("UpdateInScopeAsync", segment)

class AtomicApprovalProvenanceTests(unittest.TestCase):
    def test_approval_sql_is_scoped_and_rowversion_cas_and_evidence_is_atomic(self):
        code = (ROOT / "ArchLucid.Persistence/InfraEvidence/"
                "SqlRemediationInstanceRepository.AtomicApproval.cs").read_text()
        self.assertIn("dbo.uspRemediationCommitApproval", code)
        self.assertIn("mutation.ExpectedRowVersion is not { Length: 8 }", code)
        sql = (ROOT / "ArchLucid.Persistence/Migrations/427_RemediationProcedureOnlyUpdates.sql").read_text()
        body = sql.split("CREATE OR ALTER PROCEDURE dbo.uspRemediationCommitApproval", 1)[1].split("GO", 1)[0]
        for clause in ("AND Status = 1", "RowVersion = @ExpectedRowVersion", "AND WorkspaceId = @WorkspaceId", "AND ProjectId = @ProjectId", "PreflightResultJson IS NOT NULL", "BEGIN TRANSACTION", "COMMIT TRANSACTION", "ROLLBACK TRANSACTION"):
            self.assertIn(clause, body)
        self.assertLess(body.index("UPDATE dbo.RemediationInstances"), body.index("INSERT INTO dbo.RemediationEvidence"))

    def test_legacy_tenant_only_sql_update_removed_and_scoped_approval_remains_atomic(self):
        code = (ROOT / "ArchLucid.Persistence/InfraEvidence/"
                "SqlRemediationInstanceRepository.cs").read_text()
        self.assertNotIn("public async Task UpdateInstanceAsync(", code)
        segment = code.split("public async Task UpdateInstanceInScopeAsync(", 1)[1]
        segment = segment.split("public async Task<RemediationInstanceRecord?> TryGetByIdAsync(", 1)[0]
        self.assertIn("mutation.Status == RemediationInstanceStatus.Approved", segment)
        self.assertIn("atomic provenance commit", segment)
        self.assertIn("dbo.uspRemediationUpdateScoped", segment)

    def test_remediation_inserts_omit_sql_managed_rowversion_column(self):
        code = (ROOT / "ArchLucid.Persistence/InfraEvidence/"
                "SqlRemediationInstanceRepository.cs").read_text()
        for name, successor in (
            ("public async Task InsertInstanceAsync(", "public async Task InsertInstanceInScopeAsync("),
            ("public async Task InsertInstanceInScopeAsync(", "public async Task UpdateInstanceInScopeAsync("),
        ):
            statement = code.split(name, 1)[1].split(successor, 1)[0]
            self.assertIn("INSERT INTO dbo.RemediationInstances", statement)
            self.assertNotIn("ClosedUtc, RowVersion)", statement)
            self.assertIn("ClosedUtc)", statement)

    def test_approval_service_writes_proof_with_atomic_method_not_two_writes(self):
        code = (ROOT / "ArchLucid.Application/InfraEvidence/RemediationInstances/"
                "RemediationInstanceService.cs").read_text()
        segment = code.split("public async Task<RemediationInstanceOperationResult> ApproveAsync(", 1)[1]
        segment = segment.split("public async Task<RemediationInstanceOperationResult> AssignWaveAsync(", 1)[0]
        self.assertIn("RemediationEvidencePhase.Approval", segment)
        self.assertIn("PreflightResultJson", segment)
        self.assertIn("instance.PatternVersionId", segment)
        self.assertIn("instance.FrozenPatternVersion", segment)
        self.assertIn("SHA256.HashData", segment)
        self.assertIn("CommitApprovalInScopeAsync", segment)
        self.assertNotIn("UpdateInScopeAsync(", segment)
        self.assertNotIn("InsertEvidenceInScopeAsync(", segment)

if __name__ == "__main__":
    unittest.main()
