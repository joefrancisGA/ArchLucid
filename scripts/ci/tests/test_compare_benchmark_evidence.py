import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "compare_benchmark_baseline.py"

class BenchmarkEvidenceTests(unittest.TestCase):
    def invoke(self, baseline, reports):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            baseline_path = root / "baseline.json"
            baseline_path.write_text(json.dumps({"benchmarks": baseline}))
            result_dir = root / "results"
            result_dir.mkdir()
            for name, data in reports.items():
                (result_dir / name).write_text(json.dumps(data))
            return subprocess.run(
                [sys.executable, str(SCRIPT), "--baseline", str(baseline_path), "--results", str(result_dir)],
                capture_output=True, text=True)

    def test_missing_report_fails(self):
        result = self.invoke([{"fullName": "A", "maxMeanNs": 100}], {})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("no benchmark result files", result.stderr)

    def test_malformed_report_fails(self):
        result = self.invoke([{"fullName": "A", "maxMeanNs": 100}],
                             {"x-report-full-compressed.json": {"Benchmarks": None}})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("malformed benchmark report", result.stderr)

    def test_unbaselined_results_are_visible(self):
        report = {"Benchmarks": [
            {"FullName": "A", "Statistics": {"Mean": 50}},
            {"FullName": "B", "Statistics": {"Mean": 60}}]}
        result = self.invoke([{"fullName": "A", "maxMeanNs": 100}],
                             {"x-report-full-compressed.json": report})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("unbaselined result", result.stderr)

    def test_threshold_regression_fails(self):
        report = {"Benchmarks": [{"FullName": "A", "Statistics": {"Mean": 101}}]}
        result = self.invoke([{"fullName": "A", "maxMeanNs": 100}],
                             {"x-report-full-compressed.json": report})
        self.assertEqual(result.returncode, 1)

if __name__ == "__main__":
    unittest.main()
