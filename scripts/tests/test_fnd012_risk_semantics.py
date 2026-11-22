"""FND-012 risk semantics schema tests."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/risk/exposure-semantics"

class RiskSemanticsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def load(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid_unknown(self):
        self.assertFalse(list(self.validator.iter_errors(self.load("valid-unknown.json"))))

    def test_no_invented_precision(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-invented-precision.json"))))

    def test_tenant_required(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-no-tenant.json"))))

    def test_reachability_is_explicit(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-reachability.json"))))

    def test_unknown_major_rejected(self):
        item = self.load("valid-unknown.json")
        item["schemaVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(item)))

    def test_unrecognized_score_rejected(self):
        item = self.load("valid-unknown.json")
        item["fabricatedConfidencePercent"] = 82
        self.assertTrue(list(self.validator.iter_errors(item)))

if __name__ == "__main__":
    unittest.main()
