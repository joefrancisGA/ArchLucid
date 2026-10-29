import tempfile
import unittest
from pathlib import Path
from scripts.ci.report_archlucid_capacity_trx import parse_trx

class CapacityTrxTests(unittest.TestCase):
    def test_missing_is_not_a_zero_duration_measurement(self):
        self.assertEqual("MISSING_TRX", parse_trx("/not-found/capacity.trx")["status"])
    def test_valid_trx_is_parsed(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)/"test.trx"
            p.write_text('<TestRun><Results><UnitTestResult outcome="Passed" duration="00:00:01.200"/></Results></TestRun>')
            r = parse_trx(p)
            self.assertEqual(1, r["tests"])
            self.assertEqual(1.2, r["sumTestDurationSeconds"])
    def test_failure_not_reported_successful(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)/"test.trx"
            p.write_text('<TestRun><Results><UnitTestResult outcome="Failed" duration="00:00:00.500"/></Results></TestRun>')
            self.assertEqual("FAILED", parse_trx(p)["status"])

if __name__ == "__main__":
    unittest.main()
