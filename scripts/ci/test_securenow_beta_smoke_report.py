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
    def check(self, payload):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "evidence.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            return subprocess.run([sys.executable, str(SCRIPT), "--check", str(path)],
                                  capture_output=True, text=True, check=False).returncode

    def build(self, sha=SHA, run_id="1234"):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "evidence.json"
            env = dict(os.environ, MATRIX_RESULT="success", APPLICATION_RESULT="success",
                       ARCHITECTURE_RESULT="success", TESTED_SHA=sha, RUN_ID=run_id)
            result = subprocess.run([sys.executable, str(SCRIPT), "--output", str(path)],
                                    env=env, capture_output=True, text=True, check=False)
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
                       "product_boundary_tests": "success"},
        }

    def test_valid_offline_gate_does_not_assert_beta_approval(self):
        self.assertEqual(self.check(self.valid_payload()), 0)

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
