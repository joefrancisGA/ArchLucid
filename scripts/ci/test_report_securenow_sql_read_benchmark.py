#!/usr/bin/env python3
"""Contract tests for SecureNow SQL read benchmark evidence extraction."""
import tempfile
import unittest
from pathlib import Path
import subprocess
import sys
import json

SCRIPT = Path(__file__).with_name("report_securenow_sql_read_benchmark.py")

def trx(outcome: str, output: str, test_name: str = 'Batch_insert_preserves_every_path_and_hop_across_buffer_boundaries') -> str:
    return f'''<?xml version="1.0" encoding="utf-8"?>
<TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Results><UnitTestResult testName="{test_name}" outcome="{outcome}">
  <Output><StdOut>{output}</StdOut></Output>
  </UnitTestResult></Results>
</TestRun>'''

class BenchmarkReportTests(unittest.TestCase):
    def run_case(self, text: str):
        with tempfile.TemporaryDirectory() as temp:
            src = Path(temp) / "test.trx"
            dest = Path(temp) / "result.json"
            src.write_text(text, encoding="utf-8")
            proc = subprocess.run([sys.executable, str(SCRIPT), "--trx", str(src), "--output", str(dest)],
                                  capture_output=True, text=True, check=False)
            return proc.returncode, json.loads(dest.read_text(encoding="utf-8"))

    def test_passing_measurement_is_reported(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500"
        result, report = self.run_case(trx("Passed", line))
        self.assertEqual(result, 0)
        self.assertEqual(report["status"], "MEASURED")
        self.assertEqual(report["samples"][0]["path_count"], 1001)
        self.assertEqual(report["samples"][0]["elapsed_ms"], 12.5)

    def test_dedicated_measurement_file_is_accepted_with_passing_trx(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500"
        with tempfile.TemporaryDirectory() as folder:
            src = Path(folder) / "test.trx"
            marker = Path(folder) / "metric.txt"
            dest = Path(folder) / "out.json"
            src.write_text(trx("Passed", ""), encoding="utf-8")
            marker.write_text(line, encoding="utf-8")
            result = subprocess.run([sys.executable, str(SCRIPT), "--trx", str(src),
                                     "--measurement-file", str(marker), "--output", str(dest)],
                                    capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(dest.read_text(encoding="utf-8"))["status"], "MEASURED")

    def test_dedicated_measurement_rejects_suffix_spoofing(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500tampered"
        with tempfile.TemporaryDirectory() as folder:
            src = Path(folder) / "test.trx"
            marker = Path(folder) / "metric.txt"
            dest = Path(folder) / "out.json"
            src.write_text(trx("Passed", ""), encoding="utf-8")
            marker.write_text(line, encoding="utf-8")
            result = subprocess.run([sys.executable, str(SCRIPT), "--trx", str(src),
                                     "--measurement-file", str(marker), "--output", str(dest)],
                                    capture_output=True, text=True, check=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(json.loads(dest.read_text(encoding="utf-8"))["status"], "NOT_MEASURED")

    def test_dedicated_measurement_does_not_override_failed_trx(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500"
        with tempfile.TemporaryDirectory() as folder:
            src = Path(folder) / "test.trx"
            marker = Path(folder) / "metric.txt"
            dest = Path(folder) / "out.json"
            src.write_text(trx("Failed", ""), encoding="utf-8")
            marker.write_text(line, encoding="utf-8")
            result = subprocess.run([sys.executable, str(SCRIPT), "--trx", str(src),
                                     "--measurement-file", str(marker), "--output", str(dest)],
                                    capture_output=True, text=True, check=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(json.loads(dest.read_text(encoding="utf-8"))["status"], "NOT_MEASURED")

    def test_failed_test_does_not_validate_a_measurement(self):
        result, report = self.run_case(trx("Failed", "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500"))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

    def test_missing_output_does_not_fabricate_a_baseline(self):
        result, report = self.run_case(trx("Passed", "nothing reported"))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["samples"], [])

    def test_unrelated_test_output_is_not_a_benchmark(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500"
        result, report = self.run_case(trx("Passed", line, test_name="UnrelatedTest"))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

    def test_test_name_suffix_cannot_impersonate_benchmark(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500"
        result, report = self.run_case(trx("Passed", line, test_name="Prefix_Batch_insert_preserves_every_path_and_hop_across_buffer_boundaries"))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

    def test_duplicate_measurement_lines_are_rejected(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500"
        result, report = self.run_case(trx("Passed", line + " " + line))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

    def test_incomplete_workload_rejected(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1000 hops=1000 repository_calls=1 elapsed_ms=12.500"
        result, report = self.run_case(trx("Passed", line))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

    def test_zero_latency_rejected(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=0.000"
        result, report = self.run_case(trx("Passed", line))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

    def test_unexpected_query_count_rejected(self):
        line = "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=3 elapsed_ms=12.500"
        result, report = self.run_case(trx("Passed", line))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

    def test_malformed_trx_is_fail_closed(self):
        result, report = self.run_case("<broken")
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

if __name__ == "__main__":
    unittest.main()
