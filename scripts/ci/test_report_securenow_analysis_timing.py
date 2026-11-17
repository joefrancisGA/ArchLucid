import tempfile
import unittest
from pathlib import Path
from scripts.ci.report_securenow_analysis_timing import collect

def trx(cases):
    records = "".join(
        f'<UnitTestResult testName="{name}" outcome="{outcome}" duration="{duration}"/>'
        for name, outcome, duration in cases
    )
    return f'<TestRun><Results>{records}</Results></TestRun>'

RANK = "ArchLucid.Application.Tests.InfraEvidence.PathRankingEngineTests.RunAsync_loads_defender_posture_for_blast_radius_ranking"
CUT = "ArchLucid.Application.Tests.InfraEvidence.CutPointAnalysisEngineTests.RunAsync_empty_snapshot_clears_cut_points_without_error"

class AnalysisTimingReporterTests(unittest.TestCase):
    def check(self, rows):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "tests.trx"
            file.write_text(trx(rows), encoding="utf-8")
            return collect(file)

    def test_records_two_distinct_real_cases(self):
        result = self.check([(RANK, "Passed", "00:00:00.1234567"), (CUT, "Passed", "00:00:00.0200000")])
        self.assertEqual("RECORDED", result["status"])
        self.assertEqual(2, len(result["tests"]))
        self.assertEqual([20.0, 123.457], sorted(t["duration_ms"] for t in result["tests"]))

    def test_missing_fails_closed(self):
        self.assertEqual("MISSING_OR_FAILED", self.check([(RANK, "Passed", "00:00:01.000")])["status"])

    def test_failure_fails_closed(self):
        self.assertEqual("MISSING_OR_FAILED", self.check([(RANK, "Failed", "00:00:01.000"), (CUT, "Passed", "00:00:01.000")])["status"])

    def test_duplicate_fails_closed(self):
        self.assertEqual("MISSING_OR_FAILED", self.check([(RANK, "Passed", "00:00:01.000"), (RANK, "Passed", "00:00:01.000"), (CUT, "Passed", "00:00:01.000")])["status"])

    def test_malformed_duration_fails_closed(self):
        self.assertEqual("MISSING_OR_FAILED", self.check([(RANK, "Passed", "invalid"), (CUT, "Passed", "00:00:01.000")])["status"])

if __name__ == "__main__":
    unittest.main()
