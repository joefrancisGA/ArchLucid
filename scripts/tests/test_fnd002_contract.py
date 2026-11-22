"""FND-002 isolated JSON Schema contract fixtures.

Run: python -m unittest discover -s scripts/tests -p 'test_fnd002_contract.py'
Requires: pip install jsonschema[format]
"""
import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "schemas/cross-product/architecture-snapshot-published"

class ContractFixtures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = json.loads((DIR / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(cls.schema)
        cls.validator = Draft202012Validator(cls.schema, format_checker=FormatChecker())

    def load(self, name):
        return json.loads((DIR / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid(self):
        self.assertEqual(list(self.validator.iter_errors(self.load("valid.json"))), [])

    def test_major_version_rejected(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-major-version.json"))))

    def test_missing_tenant_rejected(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-missing-tenant.json"))))

    def test_unknown_field_rejected(self):
        payload = self.load("valid.json")
        payload["unapproved"] = True
        self.assertTrue(list(self.validator.iter_errors(payload)))

    def test_malformed_digest_rejected(self):
        payload = self.load("valid.json")
        payload["payload"]["contentDigest"] = "sha256:invalid"
        self.assertTrue(list(self.validator.iter_errors(payload)))

if __name__ == "__main__":
    unittest.main()
