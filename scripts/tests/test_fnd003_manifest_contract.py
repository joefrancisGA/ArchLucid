"""FND-003 schema-only contract tests. Requires jsonschema[format]."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/extensions/manifest"

class ManifestContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text())
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def fixture(self, name):
        return json.loads((BASE / "fixtures" / name).read_text())

    def test_valid_disabled_manifest(self):
        self.assertFalse(list(self.validator.iter_errors(self.fixture("valid.json"))))

    def test_reject_enabled_execution(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-execution-enabled.json"))))

    def test_reject_unapproved_permission(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-permission.json"))))

    def test_reject_unknown_major(self):
        manifest = self.fixture("valid.json")
        manifest["manifestVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(manifest)))

    def test_reject_unknown_fields(self):
        manifest = self.fixture("valid.json")
        manifest["autoExecute"] = True
        self.assertTrue(list(self.validator.iter_errors(manifest)))

if __name__ == "__main__":
    unittest.main()
