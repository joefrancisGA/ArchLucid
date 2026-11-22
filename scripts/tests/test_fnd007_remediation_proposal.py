"""FND-007 schema-only remediation proposal tests."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/remediation/proposal"

class RemediationProposalContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def fixture(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid_proposal(self):
        self.assertFalse(list(self.validator.iter_errors(self.fixture("valid-proposal.json"))))

    def test_cannot_claim_executed(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-executed.json"))))

    def test_requires_rollback(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-no-rollback.json"))))

    def test_requires_evidence(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-no-evidence.json"))))

    def test_reject_unknown_version(self):
        proposal = self.fixture("valid-proposal.json")
        proposal["schemaVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(proposal)))

    def test_reject_unapproved_execution_field(self):
        proposal = self.fixture("valid-proposal.json")
        proposal["executeNow"] = True
        self.assertTrue(list(self.validator.iter_errors(proposal)))

if __name__ == "__main__":
    unittest.main()
