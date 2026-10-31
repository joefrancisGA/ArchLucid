import json
import tempfile
import unittest
from pathlib import Path
from scripts.ci.report_securenow_memory_headroom import analyze

class MemoryHeadroomTests(unittest.TestCase):
    def test_repetitions_and_budget(self):
        with tempfile.TemporaryDirectory() as d:
            for i,v in enumerate((100000000,120000000,110000000)):
                Path(d,f"{i}.json").write_text(json.dumps({
                    "schemaVersion":1,"benchmarkKind":"DEDICATED_PROCESS_SYNTHETIC_GRAPH",
                    "sample":{"Cohort":"chain","NodeCount":50,"EdgeCount":49,"HopDepth":4,
                    "PrefixCount":5,"SampledWorkingSetBytes":v,"Truncated":False,
                    "MeasurementScope":"DEDICATED_PROCESS_SAMPLED"}}))
            r=analyze(d,256*1024*1024)
            self.assertEqual(1,r["validCohorts"])
            self.assertEqual(180000000,r["results"][0]["advisoryBudgetBytes"])
            self.assertTrue(r["results"][0]["withinAdvisoryLimit"])
    def test_missing_repetitions_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(0,analyze(d,256*1024*1024)["validCohorts"])
    def test_invalid_limit_rejected(self):
        with self.assertRaises(ValueError):analyze(".",0)
if __name__=="__main__":unittest.main()
