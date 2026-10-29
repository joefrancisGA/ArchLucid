"""Regression tests for generated synthetic buyer-demo claims."""
import copy
import json
import tempfile
import unittest
from pathlib import Path

from scripts.ci.audit_securenow_synthetic_demo import audit, load_payload, validate
from scripts.ci.build_two_product_commercial_workpack import synthetic_demo


class SyntheticDemoContractTests(unittest.TestCase):
    def setUp(self):
        self.demo = synthetic_demo()

    def test_current_generated_fixture_conforms_without_approving_beta(self):
        self.assertEqual([], validate(self.demo))
        with tempfile.TemporaryDirectory() as temp:
            source, report_path = Path(temp) / "demo.json", Path(temp) / "audit.json"
            source.write_text(json.dumps(self.demo), encoding="utf-8")
            report, code = audit(source, report_path)
            self.assertEqual(0, code)
            self.assertEqual("CONFORMANT_SYNTHETIC_ONLY", report["status"])
            self.assertFalse(report["betaGo"])
            self.assertFalse(report["customerEvidenceAttested"])
            self.assertEqual(report, json.loads(report_path.read_text()))

    def test_verification_or_external_change_cannot_be_promoted(self):
        for path, value in [
            (("verification", "state"), "VERIFIED"),
            (("advisory", "platformMutation"), True),
            (("advisory", "actionMode"), "SECURENOW_APPLIED"),
            (("baseline", "pathClaim"), "OBSERVED_ATTACK_TRAFFIC"),
            (("baseline", "confidence"), "CALIBRATED_99_PERCENT"),
            (("source",), "REAL_CUSTOMER_PILOT"),
            (("noCustomerEvidence",), False),
        ]:
            with self.subTest(path=path):
                demo = copy.deepcopy(self.demo)
                nested = demo
                for key in path[:-1]:
                    nested = nested[key]
                nested[path[-1]] = value
                self.assertTrue(validate(demo))

    def test_buyer_roi_or_customer_success_fails(self):
        demo = copy.deepcopy(self.demo)
        demo["customerSuccess"] = {"savingsUsd": 1_000_000}
        self.assertIn("$:unexpected_fields", validate(demo))
        demo = copy.deepcopy(self.demo)
        demo["buyerDecision"] = "Guaranteed customer ROI and breach prevention"
        self.assertIn("$.buyerDecision:changed", validate(demo))

    def test_later_capture_requirements_cannot_be_omitted(self):
        demo = copy.deepcopy(self.demo)
        demo["verification"]["requiredInputs"].remove("laterCaptureTimestamp")
        self.assertIn("$.verification.requiredInputs:length", validate(demo))
        demo = copy.deepcopy(self.demo)
        del demo["verification"]["requiredInputs"]
        self.assertIn("$.verification.requiredInputs:missing", validate(demo))

    def test_strict_booleans_prevent_truthiness_injection(self):
        demo = copy.deepcopy(self.demo)
        demo["noCustomerEvidence"] = 1
        demo["advisory"]["platformMutation"] = 0
        self.assertIn("$.noCustomerEvidence:type", validate(demo))
        self.assertIn("$.advisory.platformMutation:type", validate(demo))

    def test_reject_duplicate_keys_and_nonfinite_json(self):
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "demo.json"
            for raw in ['{"noCustomerEvidence":true,"noCustomerEvidence":false}',
                        '{"value":NaN}', '{"value":Infinity}']:
                source.write_text(raw, encoding="utf-8")
                with self.assertRaises(ValueError):
                    load_payload(source)
                report, code = audit(source)
                self.assertEqual(1, code)
                self.assertEqual(["INPUT_INVALID_OR_UNREADABLE"], report["issues"])

    def test_report_never_contains_untrusted_input(self):
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "demo.json"
            leaked = "do-not-print-personal@example.test"
            demo = copy.deepcopy(self.demo)
            demo[leaked] = "pretend customer identity"
            source.write_text(json.dumps(demo), encoding="utf-8")
            report, code = audit(source)
            self.assertEqual(1, code)
            self.assertNotIn(leaked, json.dumps(report))
            self.assertIn("$:unexpected_fields", report["issues"])

    def test_missing_oversized_symlink_and_output_collision_fail(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "demo.json"
            self.assertEqual(1, audit(source)[1])
            source.write_text(" " * 65_537, encoding="utf-8")
            self.assertEqual(1, audit(source)[1])
            source.write_text(json.dumps(self.demo), encoding="utf-8")
            alias = root / "alias.json"
            alias.symlink_to(source)
            self.assertEqual(1, audit(alias)[1])
            with self.assertRaises(ValueError):
                audit(source, source)


if __name__ == "__main__":
    unittest.main()
