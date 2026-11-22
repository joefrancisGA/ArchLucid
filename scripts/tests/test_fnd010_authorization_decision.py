"""FND-010 authorization decision schema tests (shape only)."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/authorization/decision"

class AuthorizationDecisionSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def fixture(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid_default_deny(self):
        self.assertFalse(list(self.validator.iter_errors(self.fixture("valid-denied.json"))))

    def test_execute_allow_needs_approval(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-execute-no-approval.json"))))

    def test_tenant_required(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-no-tenant.json"))))

    def test_unknown_major_rejected(self):
        item = self.fixture("valid-denied.json")
        item["schemaVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(item)))

    def test_allowed_execution_with_approval_shape(self):
        item = self.fixture("valid-denied.json")
        item.update(action="remediation.execute", decision="allow", approvalClass="dual-control", approvalRefs=["approval:example"])
        self.assertFalse(list(self.validator.iter_errors(item)))

    def test_unknown_privileged_action_rejected(self):
        item = self.fixture("valid-denied.json")
        item["action"] = "platform.cross-tenant-delete"
        self.assertTrue(list(self.validator.iter_errors(item)))

if __name__ == "__main__":
    unittest.main()
