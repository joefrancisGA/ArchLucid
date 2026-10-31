import json
import tempfile
import unittest
from pathlib import Path
from scripts.ci.report_securenow_memory_forecast_error import evaluate

def write(root,cohort,nodes,run,rss):
    Path(root,f"{cohort}-{nodes}-{run}.json").write_text(json.dumps({
      "schemaVersion":1,"benchmarkKind":"DEDICATED_PROCESS_SYNTHETIC_GRAPH",
      "sample":{"Cohort":cohort,"NodeCount":nodes,"EdgeCount":nodes-1,
      "HopDepth":4,"PrefixCount":5,"SampledWorkingSetBytes":rss,
      "Truncated":False,"MeasurementScope":"DEDICATED_PROCESS_SAMPLED"}}))
class ForecastMemoryErrorTests(unittest.TestCase):
    def test_three_sizes_provide_error_and_advisory_headroom(self):
        with tempfile.TemporaryDirectory() as d:
            for n,rss in [(50,100000000),(200,140000000),(500,210000000)]:
                for i in range(3):write(d,"chain",n,i,rss)
            report=evaluate(d,536870912)
            row=report["cohorts"][0]
            self.assertEqual("HISTORICAL_BACKTEST_ADVISORY_ONLY",row["status"])
            self.assertEqual(2,len(row["errors"]))
            self.assertEqual(1.5,row["recommendedHeadroomMultiplier"])
            self.assertEqual(315000000,row["advisoryPlanningBudgetBytes"])
            self.assertTrue(row["withinConfiguredLimit"])
    def test_missing_size_and_zero_prediction_do_not_invent_factor(self):
        with tempfile.TemporaryDirectory() as d:
            for n in (50,200):
                for i in range(3):write(d,"chain",n,i,0)
            self.assertEqual("INSUFFICIENT_SIZE_COHORTS",evaluate(d,536870912)["cohorts"][0]["status"])
            for i in range(3):write(d,"chain",500,i,100)
            self.assertEqual("ZERO_PREDICTION_NO_HEADROOM_RECOMMENDATION",evaluate(d,536870912)["cohorts"][0]["status"])
    def test_summary_file_is_ignored(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d,"headroom.json").write_text('{"schemaVersion":1,"results":[]}')
            self.assertEqual([],evaluate(d,536870912)["cohorts"])
if __name__=="__main__":unittest.main()
