"""FND-013 Aspects measurement ledger contract checks."""
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

BASE = Path(__file__).resolve().parents[2] / "schemas/aspects/measurement-ledger"

class AspectsMeasurementContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        schema = json.loads((BASE / "1.0.0.schema.json").read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        cls.validator = Draft202012Validator(schema, format_checker=FormatChecker())

    def load(self, name):
        return json.loads((BASE / "fixtures" / name).read_text(encoding="utf-8"))

    def test_valid_unavailable(self):
        self.assertFalse(list(self.validator.iter_errors(self.load("valid-unavailable.json"))))

    def test_zero_denominator_forbids_density(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-zero-denominator-density.json"))))

    def test_ledger_ref_required(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-no-ledger.json"))))

    def test_negative_defects_rejected(self):
        self.assertTrue(list(self.validator.iter_errors(self.load("invalid-negative-defects.json"))))

    def test_unknown_version_rejected(self):
        item = self.load("valid-unavailable.json")
        item["schemaVersion"] = "2.0.0"
        self.assertTrue(list(self.validator.iter_errors(item)))

    def test_valid_positive_denominator(self):
        item = self.load("valid-unavailable.json")
        item["coverage"]["uniquePathBlobLines"] = 1000
        item["density"]["valuePerKloc"] = 2.0
        item["defects"]["distinctConfirmed"] = 2
        item["evidence"]["verificationStatus"] = "provisional"
        self.assertFalse(list(self.validator.iter_errors(item)))

if __name__ == "__main__":
    unittest.main()
