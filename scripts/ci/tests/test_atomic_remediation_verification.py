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

if __name__ == "__main__":
    unittest.main()
