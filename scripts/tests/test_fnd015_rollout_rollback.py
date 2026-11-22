"""FND-015 schema compatibility tests (shape, not runtime enforcement)."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
BASE = Path(__file__).resolve().parents[2] / "schemas/operations/rollout-rollback"
class ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())
    def fixture(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))
    def test_valid(self):
        self.assertFalse(list(self.validator.iter_errors(self.fixture("valid.json"))))
    def test_invalid(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid.json"))))
    def test_unknown_version(self):
        row = self.fixture("valid.json")
        row["schemaVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(row)))
    def test_missing_tenant(self):
        row = self.fixture("valid.json")
        del row["tenantId"]
        self.assertTrue(list(self.validator.iter_errors(row)))
    def test_unknown_execution_field(self):
        row = self.fixture("valid.json")
        row["executeNow"] = True
        self.assertTrue(list(self.validator.iter_errors(row)))
if __name__ == "__main__":
    unittest.main()
