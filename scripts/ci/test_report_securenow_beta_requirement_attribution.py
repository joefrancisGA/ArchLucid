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

    def test_realistic_vstest_trx_method_only_name_resolves_full_class(self):
        matrix = json.loads((ROOT / "docs/securenow/BETA_EVIDENCE_MATRIX.json").read_text())
        with tempfile.TemporaryDirectory() as d:
            trx = Path(d, "results.trx")
            trx.write_text("""<TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
              <TestDefinitions><UnitTest id="core-1" name="ValidateAndMaterialize_empty_hops_throws">
                <TestMethod className="ArchLucid.Core.Tests.InfraEvidence.SecurityEvidencePathGuardTests"
                            name="ValidateAndMaterialize_empty_hops_throws" />
              </UnitTest></TestDefinitions>
              <Results><UnitTestResult testId="core-1" testName="ValidateAndMaterialize_empty_hops_throws"
                                       outcome="Passed"/></Results>
            </TestRun>""")
            report = build(matrix, sha=SHA, run_id="1234", trx_files=[trx])
        for rid in ("FR-EV-03", "NFR-02"):
            row = next(x for x in report["requirements"] if x["id"] == rid)
            self.assertEqual("CANDIDATE_TEST_PASSED_REQUIREMENT_UNVERIFIED", row["blocker"])
            self.assertEqual(["passed"], row["observedTests"][0]["outcomes"])
            self.assertIn("SecurityEvidencePathGuardTests", row["observedTests"][0]["name"])
            self.assertFalse(row["releaseEvidenceVerified"])
        self.assertEqual("NO_GO", report["betaReleaseDecision"])

    def test_definition_without_executed_result_cannot_infer_success(self):
        with tempfile.TemporaryDirectory() as d:
            trx = Path(d, "results.trx")
            trx.write_text("""<TestRun><TestDefinitions><UnitTest id="core-1">
                <TestMethod className="ArchLucid.Core.Tests.InfraEvidence.SecurityEvidencePathGuardTests"
                            name="A"/></UnitTest></TestDefinitions></TestRun>""")
            observed, problems = test_results([trx])
        self.assertEqual({}, observed)
        self.assertEqual(["no_test_results:results.trx"], problems)

    def test_resolved_repeated_test_with_failure_never_appears_passing(self):
        matrix = json.loads((ROOT / "docs/securenow/BETA_EVIDENCE_MATRIX.json").read_text())
        with tempfile.TemporaryDirectory() as d:
            trx = Path(d, "results.trx")
            trx.write_text("""<TestRun><TestDefinitions><UnitTest id="core-1">
                <TestMethod className="ArchLucid.Core.Tests.InfraEvidence.SecurityEvidencePathGuardTests"
                            name="A"/></UnitTest></TestDefinitions>
                <Results>
                  <UnitTestResult testId="core-1" testName="A" outcome="Passed"/>
                  <UnitTestResult testId="core-1" testName="A" outcome="Failed"/>
                </Results></TestRun>""")
            report = build(matrix, sha=SHA, run_id="1234", trx_files=[trx])
        for rid in ("FR-EV-03", "NFR-02"):
            row = next(x for x in report["requirements"] if x["id"] == rid)
            self.assertEqual("CANDIDATE_TEST_DID_NOT_PASS", row["blocker"])
            self.assertEqual(["failed", "passed"], row["observedTests"][0]["outcomes"])

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
