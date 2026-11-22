import json
import tempfile
import unittest
from pathlib import Path

from scripts.ci.compare_benchmark_baseline import load_means, main
from unittest.mock import patch

class BenchmarkEvidenceTests(unittest.TestCase):
    def test_missing_result_files_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaisesRegex(ValueError, "no BenchmarkDotNet result files"):
                load_means(Path(d))

    def test_empty_result_file_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "x-report-full-compressed.json").write_text('{"Benchmarks":[]}')
            baseline = root / "baseline.json"
            baseline.write_text(json.dumps({"benchmarks":[{"fullName":"Example.Bench","maxMeanNs":100}]}))
            with patch("sys.argv", ["compare", "--baseline", str(baseline), "--results", str(root)]):
                with self.assertRaisesRegex(ValueError, "no measured benchmark means"):
                    main()

    def test_empty_baseline_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            baseline = root / "baseline.json"
            baseline.write_text('{"benchmarks":[]}')
            with patch("sys.argv", ["compare", "--baseline", str(baseline), "--results", str(root)]):
                with self.assertRaisesRegex(ValueError, "at least one benchmark"):
                    main()

if __name__ == "__main__":
    unittest.main()
