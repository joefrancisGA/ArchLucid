#!/usr/bin/env python3
"""Offline SecureNow beta gate regression tests."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("securenow_beta_smoke_report.py")
SHA = "a" * 40

class OfflineGateTests(unittest.TestCase):
    def check(self, payload, *extra_args):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "evidence.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            return subprocess.run([sys.executable, str(SCRIPT), "--check", str(path), *extra_args],
                                  capture_output=True, text=True, check=False).returncode

    def synthetic_core_attribution(self, sha=SHA, run_id="1234"):
        # Explicitly synthetic offline fixture, not evidence of any executed CI job.
        matrix = json.loads((SCRIPT.parents[2] / "docs/securenow/BETA_EVIDENCE_MATRIX.json").read_text())
        rows = []
        for entry in matrix["requirements"]:
            core = entry["id"] in ("FR-EV-03", "NFR-02")
            rows.append({
                "id": entry["id"], "status": "UNKNOWN",
                "blocker": ("CANDIDATE_TEST_PASSED_REQUIREMENT_UNVERIFIED"
                            if core else "MAPPED_TEST_NOT_OBSERVED"),
                "releaseEvidenceVerified": False,
                "observedTests": ([{
                    "name": "ArchLucid.Core.Tests.InfraEvidence.SecurityEvidencePathGuardTests.ValidateAndMaterialize_empty_hops_throws",
                    "outcomes": ["passed"]}] if core else []),
            })
        return {
            "schemaVersion": 1, "product": "SecureNow",
            "evidenceClass": "OBSERVED_TEST_RESULTS_CANDIDATE_ONLY",
            "testedSha": sha, "githubRunId": run_id, "sourceProblems": [],
            "betaReleaseDecision": "NO_GO", "fullyVerifiedRequirementCount": 0,
            "requirements": rows,
        }

    def build(self, sha=SHA, run_id="1234", *, attribution=None, attach=True,
              core_result="success"):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "evidence.json"
            args = [sys.executable, str(SCRIPT), "--output", str(path)]
            if attach:
                attribution_file = Path(directory) / "attribution.json"
                attribution_file.write_text(json.dumps(
                    attribution if attribution is not None else self.synthetic_core_attribution(sha, run_id)),
                    encoding="utf-8")
                args.extend(["--attribution", str(attribution_file)])
            env = dict(os.environ, MATRIX_RESULT="success", APPLICATION_RESULT="success",
                       ARCHITECTURE_RESULT="success", CORE_RESULT=core_result,
                       TESTED_SHA=sha, RUN_ID=run_id)
            result = subprocess.run(args, env=env, capture_output=True,
                                    text=True, check=False)
            self.assertEqual(result.returncode, 0)
            return json.loads(path.read_text(encoding="utf-8"))

    def test_build_rejects_unknown_sha(self):
        self.assertEqual(self.build(sha="UNKNOWN")["offline_gate"], "FAIL")

    def test_build_rejects_invalid_run_id(self):
        self.assertEqual(self.build(run_id="UNKNOWN")["offline_gate"], "FAIL")

    def test_build_accepts_valid_provenance(self):
        report = self.build()
        self.assertEqual(report["offline_gate"], "PASS")
        self.assertEqual(report["beta_release_decision"], "NO_GO")
        self.assertEqual(self.check(report), 0)

    def valid_payload(self):
        return {
            "schema_version": 1,
            "product": "SecureNow",
            "tested_commit_sha": SHA,
            "github_run_id": "1234",
            "offline_gate": "PASS",
            "beta_release_decision": "NO_GO",
            "staging_deployment": "NOT_RUN",
            "live_auth_and_tenant_isolation": "NOT_RUN",
            "real_azure_collection": "NOT_RUN",
            "staging_rollback_and_evidence_preservation": "NOT_RUN",
            "checks": {"matrix_structure": "success",
                       "verification_and_cross_scope_tests": "success",
                       "product_boundary_tests": "success",
                       "security_path_guard_tests": "success",
                       "security_path_guard_attribution": "success"},
        }

    def test_missing_core_trx_attribution_is_fail_closed(self):
        report = self.build(attach=False)
        self.assertEqual("FAIL", report["offline_gate"])
        self.assertEqual("failure", report["checks"]["security_path_guard_attribution"])
        self.assertNotEqual(0, self.check(report))

    def test_core_candidate_test_failure_blocks_offline_gate(self):
        report = self.build(core_result="failure")
        self.assertEqual("FAIL", report["offline_gate"])
        self.assertNotEqual(0, self.check(report))

    def test_missing_failed_or_wrong_run_core_candidates_are_rejected(self):
        valid = self.synthetic_core_attribution()
        cases = []
        wrong = json.loads(json.dumps(valid))
        wrong["testedSha"] = "b" * 40
        cases.append(wrong)
        wrong = json.loads(json.dumps(valid))
        wrong["githubRunId"] = "98765"
        cases.append(wrong)
        wrong = json.loads(json.dumps(valid))
        wrong["sourceProblems"] = ["missing_or_oversized_trx:securenow-beta-core.trx"]
        cases.append(wrong)
        wrong = json.loads(json.dumps(valid))
        wrong["requirements"][2]["observedTests"] = []
        cases.append(wrong)
        wrong = json.loads(json.dumps(valid))
        wrong["requirements"][2]["observedTests"][0]["outcomes"] = ["failed", "passed"]
        cases.append(wrong)
        wrong = json.loads(json.dumps(valid))
        wrong["requirements"][2]["blocker"] = "MAPPED_TEST_NOT_OBSERVED"
        cases.append(wrong)
        wrong = json.loads(json.dumps(valid))
        wrong["betaReleaseDecision"] = "GO"
        cases.append(wrong)
        for attribution in cases:
            with self.subTest(attribution=attribution.get("sourceProblems"),
                              sha=attribution.get("testedSha")):
                report = self.build(attribution=attribution)
                self.assertEqual("FAIL", report["offline_gate"])
                self.assertNotEqual(0, self.check(report))

    def test_missing_core_check_key_is_rejected(self):
        payload = self.valid_payload()
        del payload["checks"]["security_path_guard_attribution"]
        self.assertNotEqual(0, self.check(payload))

    def test_valid_offline_gate_does_not_assert_beta_approval(self):
        self.assertEqual(self.check(self.valid_payload()), 0)

    def test_forty_invalid_release_attestation_variations_are_rejected(self):
        invalid_values = {
            "schema_version": (0, 2, None, "1"),
            "product": ("ArchLucid", "", None, False),
            "tested_commit_sha": ("", "UNKNOWN", "f" * 39, None),
            "github_run_id": ("", "0", "UNKNOWN", None),
            "offline_gate": ("FAIL", "UNKNOWN", None, False),
            "beta_release_decision": ("GO", "UNKNOWN", None, False),
            "staging_deployment": ("PASS", "UNKNOWN", None, False),
            "live_auth_and_tenant_isolation": ("PASS", "UNKNOWN", None, False),
            "real_azure_collection": ("PASS", "UNKNOWN", None, False),
            "staging_rollback_and_evidence_preservation": ("PASS", "UNKNOWN", None, False),
        }
        self.assertEqual(sum(map(len, invalid_values.values())), 40)
        for field, values in invalid_values.items():
            for value in values:
                with self.subTest(field=field, value=value):
                    payload = self.valid_payload()
                    payload[field] = value
                    self.assertNotEqual(self.check(payload), 0)

    def test_expected_sha_and_run_id_bound_to_workflow(self):
        payload = self.valid_payload()
        args = ("--expected-sha", SHA, "--expected-run-id", "1234")
        self.assertEqual(self.check(payload, *args), 0)
        self.assertNotEqual(self.check(payload, "--expected-sha", "b" * 40), 0)
        self.assertNotEqual(self.check(payload, "--expected-run-id", "4321"), 0)

    def test_nonzero_sha_and_valid_expected_provenance_required(self):
        payload = self.valid_payload()
        payload["tested_commit_sha"] = "0" * 40
        self.assertNotEqual(self.check(payload), 0)
        self.assertNotEqual(self.build(sha="0" * 40)["offline_gate"], "PASS")
        payload["tested_commit_sha"] = SHA
        for args in (("--expected-sha", "0" * 40),
                     ("--expected-sha", "bad"),
                     ("--expected-run-id", "0"),
                     ("--expected-run-id", "bad")):
            with self.subTest(args=args):
                self.assertNotEqual(self.check(payload, *args), 0)

    def test_forty_valid_format_but_wrong_run_or_commit_provenances_fail(self):
        payload = self.valid_payload()
        cases = [
            ("--expected-sha", f"{i:040x}") for i in range(1, 21)
        ] + [
            ("--expected-run-id", str(2000 + i)) for i in range(20)
        ]
        self.assertEqual(len(cases), 40)
        for switch, value in cases:
            with self.subTest(switch=switch, value=value):
                self.assertNotEqual(self.check(payload, switch, value), 0)

    def test_missing_schema_version_is_rejected(self):
        payload = self.valid_payload()
        del payload["schema_version"]
        self.assertNotEqual(self.check(payload), 0)

    def test_unknown_schema_version_is_rejected(self):
        payload = self.valid_payload()
        payload["schema_version"] = 2
        self.assertNotEqual(self.check(payload), 0)

    def test_null_root_is_rejected_without_exception(self):
        self.assertNotEqual(self.check(None), 0)

    def test_null_checks_is_rejected_without_exception(self):
        payload = self.valid_payload()
        payload["checks"] = None
        self.assertNotEqual(self.check(payload), 0)

    def test_array_root_is_rejected_without_exception(self):
        self.assertNotEqual(self.check([]), 0)

    def test_failed_check_is_rejected(self):
        payload = self.valid_payload()
        payload["checks"]["product_boundary_tests"] = "failure"
        self.assertNotEqual(self.check(payload), 0)

    def test_unknown_commit_rejected(self):
        payload = self.valid_payload()
        payload["tested_commit_sha"] = "UNKNOWN"
        self.assertNotEqual(self.check(payload), 0)

    def test_false_go_rejected(self):
        payload = self.valid_payload()
        payload["beta_release_decision"] = "GO"
        self.assertNotEqual(self.check(payload), 0)

    def test_false_staging_evidence_rejected(self):
        payload = self.valid_payload()
        payload["staging_rollback_and_evidence_preservation"] = "PASS"
        self.assertNotEqual(self.check(payload), 0)

if __name__ == "__main__":
    unittest.main()
