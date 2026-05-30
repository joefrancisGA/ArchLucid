import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "check_proof_summary_promise_language.py"
SPEC = importlib.util.spec_from_file_location("check_proof_summary_promise_language", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)

class CheckProofSummaryPromiseLanguageTests(unittest.TestCase):
    def test_scan_allows_explicit_negation(self) -> None:
        text = "Do not claim SOC 2 certified status until CPA program completes."
        violations = MODULE.scan_text(text, source_label="fixture")
        self.assertEqual(violations, [])

    def test_scan_flags_forbidden_phrase(self) -> None:
        text = "We are SOC 2 certified and offer guaranteed savings."
        violations = MODULE.scan_text(text, source_label="fixture")
        self.assertGreaterEqual(len(violations), 2)


if __name__ == "__main__":
    unittest.main()
