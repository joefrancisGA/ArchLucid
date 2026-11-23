"""Atomic remediation verification structural contract."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]

class AtomicVerificationTests(unittest.TestCase):
    def test_sql_update_and_evidence_share_transaction(self):
        code = (ROOT / "ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.AtomicVerification.cs").read_text()
        self.assertIn("BeginTransactionAsync", code)
        self.assertEqual(2, code.count("transaction: transaction"))
        self.assertLess(code.index("if (updated != 1)"), code.index("evidenceSql,"))
        self.assertIn("CommitAsync(cancellationToken)", code)

    def test_service_uses_atomic_method(self):
        code = (ROOT / "ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs").read_text()
        segment = code.split("RemediationEvidenceRecord verificationEvidence = new()", 1)[1].split("// A failed check leaves", 1)[0]
        self.assertIn("CommitVerificationInScopeAsync", segment)
        self.assertNotIn("UpdateInScopeAsync", segment)

class AtomicApprovalProvenanceTests(unittest.TestCase):
    def test_approval_sql_is_scoped_and_rowversion_cas_and_evidence_is_atomic(self):
        code = (ROOT / "ArchLucid.Persistence/InfraEvidence/"
                "SqlRemediationInstanceRepository.AtomicApproval.cs").read_text()
        self.assertIn("Status = @PreflightPassedStatus", code)
        self.assertIn("RowVersion = @ExpectedRowVersion", code)
        self.assertIn("AND WorkspaceId = @WorkspaceId", code)
        self.assertIn("AND ProjectId = @ProjectId", code)
        self.assertIn("PreflightResultJson IS NOT NULL", code)
        self.assertIn("mutation.ExpectedRowVersion is not { Length: 8 }", code)
        self.assertIn("BeginTransactionAsync", code)
        self.assertEqual(2, code.count("transaction: transaction"))
        self.assertLess(code.index("if (updated != 1)"), code.index("insertEvidenceSql,"))
        self.assertIn("CommitAsync(cancellationToken)", code)

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
