import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.ci.compare_benchmark_baseline import main

class BenchmarkDiagnosticsTests(unittest.TestCase):
    def compare(self, baseline_items, results):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            baseline = root / "baseline.json"
            baseline.write_text(json.dumps({"benchmarks":baseline_items}))
            (root / "sample-report-full-compressed.json").write_text(
                json.dumps({"Benchmarks":results}))
            stderr = io.StringIO()
            with patch("sys.argv", ["compare", "--baseline", str(baseline), "--results", str(root)]), contextlib.redirect_stderr(stderr), contextlib.redirect_stdout(io.StringIO()):
                result = main()
            return result, stderr.getvalue()

    def test_missing_evidence_is_classified(self):
        result, message = self.compare([{"fullName":"Bench.A","maxMeanNs":10}], [])
        self.assertEqual(result, 1)
        self.assertIn("[MISSING_EVIDENCE]", message)

    def test_regression_is_classified(self):
        result, message = self.compare(
            [{"fullName":"Bench.A","maxMeanNs":10}],
            [{"FullName":"Bench.A","Statistics":{"Mean":12}}])
        self.assertEqual(result, 1)
        self.assertIn("[PERFORMANCE_REGRESSION]", message)

if __name__ == "__main__":
    unittest.main()
