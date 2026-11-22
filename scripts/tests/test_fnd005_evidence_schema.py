"""FND-005 canonical evidence schema contract checks."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/evidence/canonical-record"

class EvidenceSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def load(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid_unverified(self):
        self.assertFalse(list(self.validator.iter_errors(self.load("valid-unverified.json"))))

    def test_verified_requires_metadata(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-false-verification.json"))))

    def test_tenant_required(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-missing-tenant.json"))))

    def test_digest_format(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-digest.json"))))

    def test_reject_unknown_version(self):
        record = self.load("valid-unverified.json")
        record["schemaVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(record)))

    def test_reject_unknown_provenance(self):
        record = self.load("valid-unverified.json")
        record["provenanceKind"] = "AI-VerifiedFact"
        self.assertTrue(list(self.validator.iter_errors(record)))

if __name__ == "__main__":
    unittest.main()
