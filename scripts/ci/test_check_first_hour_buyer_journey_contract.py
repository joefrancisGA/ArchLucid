import tempfile
import unittest
from pathlib import Path
from scripts.ci.check_first_hour_buyer_journey_contract import ROOT, audit

class BuyerJourneyCoverageTests(unittest.TestCase):
    def test_current_sources_cover_essential_guardrails_without_claiming_live_run(self):
        result=audit(ROOT)
        self.assertEqual("STATIC_GUARDS_PRESENT_NOT_BROWSER_VERIFIED", result["status"])
        self.assertEqual(4, len(result["checks"]))
        self.assertTrue(all(row["status"] == "GUARDS_PRESENT_NOT_EXECUTED" for row in result["checks"]))

    def test_missing_source_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            result=audit(Path(d))
            self.assertEqual("SOURCE_GAP", result["status"])
            self.assertTrue(all(row["missingSourceSignals"] for row in result["checks"]))

if __name__=="__main__":
    unittest.main()
