"""FND-009 audit correlation schema compatibility checks."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/audit/defense-trace"

class AuditCorrelationContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def load(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid_proposal(self):
        self.assertFalse(list(self.validator.iter_errors(self.load("valid-proposal.json"))))

    def test_approval_requires_decision(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-approval-no-decision.json"))))

    def test_actor_required(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-no-actor.json"))))

    def test_tenant_required(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-no-tenant.json"))))

    def test_unknown_version(self):
        item = self.load("valid-proposal.json")
        item["schemaVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(item)))

    def test_valid_denied_approval(self):
        item = self.load("valid-proposal.json")
        item["stage"] = "approval-recorded"
        item["decision"] = "denied"
        self.assertFalse(list(self.validator.iter_errors(item)))

if __name__ == "__main__":
    unittest.main()
