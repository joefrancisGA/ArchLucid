"""FND-008 verification outcome schema contract tests."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/remediation/verification-outcome"

class VerificationOutcomeSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def load(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid_inconclusive(self):
        self.assertFalse(list(self.validator.iter_errors(self.load("valid-inconclusive.json"))))

    def test_pass_cannot_include_failed_check(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-pass-with-failed-check.json"))))

    def test_pass_cannot_include_regression(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-pass-with-regression.json"))))

    def test_evidence_required(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-no-evidence.json"))))

    def test_unknown_major_rejected(self):
        item = self.load("valid-inconclusive.json")
        item["schemaVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(item)))

    def test_valid_all_passed(self):
        item = self.load("valid-inconclusive.json")
        item["outcome"] = "passed"
        item["checks"][0]["status"] = "passed"
        self.assertFalse(list(self.validator.iter_errors(item)))

if __name__ == "__main__":
    unittest.main()
