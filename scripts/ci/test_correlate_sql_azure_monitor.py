import unittest
from scripts.ci.correlate_sql_azure_monitor import correlate

BENCH = {
    "backend": "SQL_SECURITY_EVIDENCE_PATH_REPOSITORY",
    "measurementStartUtc": "2026-10-28T12:00:05Z",
    "measurementEndUtc": "2026-10-28T12:00:25Z",
    "serverCachedQueryWorkerCpuMillisecondsDelta": 14,
}
MON = {
    "schemaVersion": 1, "metricName": "cpu_percent", "scope": "SQL_SERVER_RESOURCE",
    "resourceId": "/subscriptions/test/resourceGroups/test/providers/Microsoft.Sql/servers/test/databases/test",
    "startUtc": "2026-10-28T12:00:00Z", "endUtc": "2026-10-28T12:01:00Z",
    "observations": [
        {"timestampUtc": "2026-10-28T12:00:00Z", "value": 10},
        {"timestampUtc": "2026-10-28T12:01:00Z", "value": 20}
    ]
}
class CorrelationTests(unittest.TestCase):
    def test_valid_window_is_correlated_not_calibrated(self):
        result = correlate(BENCH, MON)
        self.assertEqual("CORRELATED_NOT_QUERY_CPU_CALIBRATION", result["status"])
        self.assertEqual(15, result["averageObservedValue"])
    def test_incomplete_window_fails(self):
        with self.assertRaises(ValueError):
            correlate(BENCH, {**MON, "endUtc": "2026-10-28T12:00:10Z"})
    def test_wrong_metric_fails(self):
        with self.assertRaises(ValueError):
            correlate(BENCH, {**MON, "metricName": "price"})
    def test_invalid_sample_fails(self):
        with self.assertRaises(ValueError):
            correlate(BENCH, {**MON, "observations": [MON["observations"][0], {"timestampUtc":"2026-10-28T12:00:30Z","value":-3}]})
if __name__ == "__main__":
    unittest.main()
