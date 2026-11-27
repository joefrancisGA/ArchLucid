import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    "report_runner_minutes", Path(__file__).resolve().parents[1] / "report_runner_minutes.py"
)
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)

class RunnerMinutesTests(unittest.TestCase):
    def test_parallel_jobs_sum_and_round_individually(self):
        job = {"labels": ["ubuntu-latest"], "status": "completed", "conclusion": "success",
               "started_at": "2026-11-26T10:00:00Z", "completed_at": "2026-11-26T10:01:30Z"}
        row = report.summarize([job, job])["ubuntu-latest"]
        self.assertEqual(row["elapsed_minutes"], 3)
        self.assertEqual(row["rounded_minutes"], 4)

    def test_cancellation_and_missing_duration(self):
        jobs = [{"labels": ["self-hosted", "Linux"], "status": "completed", "conclusion": "cancelled",
                 "started_at": "2026-11-26T10:00:00Z", "completed_at": "2026-11-26T10:01:00Z"},
                {"labels": ["self-hosted"], "status": "queued"}]
        row = report.summarize(jobs)["self-hosted"]
        self.assertEqual(row["canceled"], 1)
        self.assertEqual(row["unknown_duration"], 1)
        self.assertEqual(row["elapsed_minutes"], 1)

if __name__ == "__main__":
    unittest.main()
