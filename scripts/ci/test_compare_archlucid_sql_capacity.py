import unittest
from scripts.ci.compare_archlucid_sql_capacity import compare, BACKEND

def fixture(**changes):
    row = {"schemaVersion":1,"backend":BACKEND,"pathCount":1000,"hopsPerPath":1,
           "concurrency":4,"queries":20,"p50Milliseconds":10.0,"p95Milliseconds":20.0}
    row.update(changes)
    return row

class SqlCapacityComparisonTests(unittest.TestCase):
    def test_matching_cohorts_compare_latencies_without_cpu_claims(self):
        result = compare(fixture(), fixture(p50Milliseconds=12.,p95Milliseconds=22.), "old","new")
        self.assertEqual(20.,result["metrics"]["p50Milliseconds"]["percentChange"])
        self.assertFalse(result["cpuMemoryCalibrationAvailable"])
    def test_mismatched_cohort_is_rejected(self):
        with self.assertRaises(ValueError):
            compare(fixture(),fixture(pathCount=2000),"old","new")
    def test_zero_baseline_has_no_percentage(self):
        result = compare(fixture(p50Milliseconds=0.,p95Milliseconds=0.),
                         fixture(p50Milliseconds=1.,p95Milliseconds=2.),"a","b")
        self.assertIsNone(result["metrics"]["p50Milliseconds"]["percentChange"])
if __name__ == "__main__":
    unittest.main()
