"""FND-006 finding identity schema compatibility tests."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/findings/identity-correlation"

class FindingIdentitySchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def load(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def assertInvalid(self, record):
        self.assertTrue(list(self.validator.iter_errors(record)))

    def test_valid_fuzzy(self):
        self.assertFalse(list(self.validator.iter_errors(self.load("valid-fuzzy.json"))))

    def test_fuzzy_cannot_claim_deterministic(self):
        self.assertInvalid(self.load("invalid-fuzzy-deterministic.json"))

    def test_missing_tenant(self):
        self.assertInvalid(self.load("invalid-missing-tenant.json"))

    def test_policy_match_requires_rule_and_algorithm(self):
        record = self.load("valid-fuzzy.json")
        record["correlationMethod"] = "policy-rule-fingerprint"
        record["confidenceClass"] = "deterministic"
        self.assertInvalid(record)
        record["policyRuleId"] = "RULE-1"
        record["fingerprintAlgorithm"] = "adr0063-sha256-normalized-category-message-v1"
        self.assertFalse(list(self.validator.iter_errors(record)))

    def test_unknown_version(self):
        record = self.load("valid-fuzzy.json")
        record["schemaVersion"] = "2.0.0"
        self.assertInvalid(record)

if __name__ == "__main__":
    unittest.main()
