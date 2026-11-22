"""FND-011 read-only snapshot exchange contract tests."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/architecture/read-only-snapshot"

class ReadOnlySnapshotSchemaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def fixture(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid_unknown_freshness(self):
        self.assertFalse(list(self.validator.iter_errors(self.fixture("valid-unknown-freshness.json"))))

    def test_write_enabled_rejected(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-write-enabled.json"))))

    def test_missing_tenant_rejected(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-missing-tenant.json"))))

    def test_unknown_version_rejected(self):
        self.assertTrue(list(self.validator.iter_errors(self.fixture("invalid-unknown-version.json"))))

    def test_legacy_graph_version_required(self):
        item = self.fixture("valid-unknown-freshness.json")
        item.pop("sourceGraphSchemaVersion")
        self.assertTrue(list(self.validator.iter_errors(item)))

    def test_unknown_freshness_not_implicitly_current(self):
        item = self.fixture("valid-unknown-freshness.json")
        self.assertEqual(item["freshness"]["status"], "unknown")

if __name__ == "__main__":
    unittest.main()
