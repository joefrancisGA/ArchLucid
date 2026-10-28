#!/usr/bin/env python3
"""Contract tests for SecureNow SQL read benchmark evidence extraction."""
import tempfile
import unittest
from pathlib import Path
import subprocess
import sys
import json

SCRIPT = Path(__file__).with_name("report_securenow_sql_read_benchmark.py")

def trx(outcome: str, output: str) -> str:
    return f'''<?xml version="1.0" encoding="utf-8"?>
<TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Results><UnitTestResult testName="Batch_insert_preserves_every_path_and_hop_across_buffer_boundaries" outcome="{outcome}">
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

    def test_failed_test_does_not_validate_a_measurement(self):
        result, report = self.run_case(trx("Failed", "SECURENOW_SQL_READ_BENCHMARK paths=1001 hops=1001 repository_calls=1 elapsed_ms=12.500"))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

    def test_missing_output_does_not_fabricate_a_baseline(self):
        result, report = self.run_case(trx("Passed", "nothing reported"))
        self.assertNotEqual(result, 0)
        self.assertEqual(report["samples"], [])

    def test_malformed_trx_is_fail_closed(self):
        result, report = self.run_case("<broken")
        self.assertNotEqual(result, 0)
        self.assertEqual(report["status"], "NOT_MEASURED")

if __name__ == "__main__":
    unittest.main()
