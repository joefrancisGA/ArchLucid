import json
import tempfile
import unittest
from pathlib import Path
from scripts.ci.report_securenow_beta_requirement_attribution import build, test_results

ROOT = Path(__file__).resolve().parents[2]
SHA = "a" * 40


class RequirementAttributionTests(unittest.TestCase):
    def test_22_requirements_remain_unknown_even_when_candidate_passes(self):
        matrix = json.loads((ROOT / "docs/securenow/BETA_EVIDENCE_MATRIX.json").read_text())
        with tempfile.TemporaryDirectory() as d:
            trx = Path(d, "results.trx")
            trx.write_text('<TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">'
                           '<Results><UnitTestResult testName="SecureNowProductBoundaryTests.Works" '
                           'outcome="Passed"/></Results></TestRun>')
            report = build(matrix, sha=SHA, run_id="1234", trx_files=[trx])
        self.assertEqual(22, len(report["requirements"]))
        self.assertEqual("NO_GO", report["betaReleaseDecision"])
        self.assertEqual(0, report["fullyVerifiedRequirementCount"])
        row = next(x for x in report["requirements"] if x["id"] == "FR-AP-02")
        self.assertEqual("CANDIDATE_TEST_PASSED_REQUIREMENT_UNVERIFIED", row["blocker"])
        self.assertFalse(row["releaseEvidenceVerified"])

    def test_failed_candidate_never_becomes_success(self):
        matrix = json.loads((ROOT / "docs/securenow/BETA_EVIDENCE_MATRIX.json").read_text())
        with tempfile.TemporaryDirectory() as d:
            trx = Path(d, "results.trx")
            trx.write_text('<TestRun><UnitTestResult testName="SecureNowProductBoundaryTests.Works" outcome="Failed"/></TestRun>')
            report = build(matrix, sha=SHA, run_id="1234", trx_files=[trx])
        row = next(x for x in report["requirements"] if x["id"] == "FR-AP-02")
        self.assertEqual("CANDIDATE_TEST_DID_NOT_PASS", row["blocker"])

    def test_missing_trx_and_invalid_sha_fail_honestly(self):
        matrix = json.loads((ROOT / "docs/securenow/BETA_EVIDENCE_MATRIX.json").read_text())
        report = build(matrix, sha=SHA, run_id="1234", trx_files=[Path("/nonexistent/file.trx")])
        self.assertEqual(1, len(report["sourceProblems"]))
        with self.assertRaises(ValueError):
            build(matrix, sha="bad", run_id="1234", trx_files=[])

    def test_duplicate_ids_cannot_be_silently_accepted(self):
        matrix = json.loads((ROOT / "docs/securenow/BETA_EVIDENCE_MATRIX.json").read_text())
        matrix["requirements"].append(dict(matrix["requirements"][0]))
        with self.assertRaises(ValueError):
            build(matrix, sha=SHA, run_id="1234", trx_files=[])

if __name__ == "__main__":
    unittest.main()
