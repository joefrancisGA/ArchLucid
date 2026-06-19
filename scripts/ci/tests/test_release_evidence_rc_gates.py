"""Tests for RC release evidence gates (strict rollup, verdict, handoff, manifests)."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CI = REPO_ROOT / "scripts" / "ci"
FIXTURES = CI / "fixtures" / "release-confidence-rollup"


def run_py(script: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(CI / script), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class ReleaseEvidenceRcGateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="rc-gates-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _bundle_from_pass_fixture(self) -> Path:
        bundle = self.temp_dir / "bundle"
        shutil.copytree(FIXTURES / "pass", bundle)
        (bundle / "release-readiness-index.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.release-readiness-index.v1",
                    "rollup": "WARN",
                    "gitCommitSha": "abc123",
                    "archLucidCliVersion": "1.0.0",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (bundle / "azure-extractor-terraform-emit-status.json").write_text(
            json.dumps({"status": "PASS", "generatedUtc": "2026-06-07T00:00:00+00:00"})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "release-smoke-live-ui-sql-result.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.release-smoke-live-ui-sql-result.v1",
                    "profile": "LiveUiSql",
                    "status": "PASS",
                    "generatedUtc": "2026-06-07T00:00:00+00:00",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        return bundle

    def test_strict_rc_fails_when_blocking_lane_missing(self) -> None:
        bundle = self.temp_dir / "empty"
        bundle.mkdir()
        json_out = self.temp_dir / "rollup.json"
        md_out = self.temp_dir / "rollup.md"
        result = run_py(
            "build_release_confidence_rollup.py",
            "--repo-root",
            str(self.temp_dir),
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
            "--strict-rc",
        )
        self.assertEqual(result.returncode, 1, msg=result.stderr or result.stdout)
        payload = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(payload["strictDisposition"], "HOLD")
        self.assertTrue(len(payload["strictBlockingReasons"]) > 0)

    def test_strict_rc_fails_when_live_ui_sql_parity_missing(self) -> None:
        bundle = self._bundle_from_pass_fixture()
        (bundle / "release-smoke-live-ui-sql-result.json").unlink()
        json_out = self.temp_dir / "rollup-missing-live.json"
        md_out = self.temp_dir / "rollup-missing-live.md"
        result = run_py(
            "build_release_confidence_rollup.py",
            "--repo-root",
            str(self.temp_dir),
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
            "--strict-rc",
        )
        payload = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(payload["strictDisposition"], "HOLD")
        self.assertTrue(
            any("Live UI-SQL parity" in reason for reason in payload["strictBlockingReasons"]),
            msg=payload["strictBlockingReasons"],
        )
        self.assertEqual(result.returncode, 1, msg=result.stderr or result.stdout)

    def test_strict_buyer_rc_fails_without_packet_artifacts(self) -> None:
        bundle = self._bundle_from_pass_fixture()
        result = run_py(
            "release_evidence_bundle.py",
            "validate",
            "--dir",
            str(bundle),
            "--profile",
            "release-readiness",
            "--strict-buyer-rc",
        )
        self.assertEqual(result.returncode, 2, msg=result.stderr or result.stdout)

    def test_strict_buyer_rc_fails_without_real_mode_pass(self) -> None:
        bundle = self._bundle_from_pass_fixture()
        for name in (
            "real-mode-claim-gate.json",
            "real-mode-claim-gate.md",
            "real-mode-evidence-freshness.json",
            "rc-go-no-go-verdict.json",
        ):
            (bundle / name).write_text("{}\n", encoding="utf-8")

        result = run_py(
            "release_evidence_bundle.py",
            "validate",
            "--dir",
            str(bundle),
            "--profile",
            "release-readiness",
            "--strict-buyer-rc",
        )
        self.assertEqual(result.returncode, 2, msg=result.stderr or result.stdout)
        self.assertIn("real-llm-evidence-gate.json", result.stderr + result.stdout)

    def test_strict_rc_passes_with_complete_fixture(self) -> None:
        bundle = self._bundle_from_pass_fixture()
        json_out = self.temp_dir / "rollup-pass.json"
        md_out = self.temp_dir / "rollup-pass.md"
        result = run_py(
            "build_release_confidence_rollup.py",
            "--repo-root",
            str(self.temp_dir),
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
            "--strict-rc",
        )
        payload = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertIn(payload["strictDisposition"], {"PASS", "HOLD"})
        if payload["strictDisposition"] == "PASS":
            self.assertEqual(result.returncode, 0, msg=result.stderr)

    def test_rc_verdict_and_deploy_handoff_emit(self) -> None:
        bundle = self._bundle_from_pass_fixture()
        rollup_json = self.temp_dir / "rollup.json"
        rollup_md = self.temp_dir / "rollup.md"
        run_py(
            "build_release_confidence_rollup.py",
            "--repo-root",
            str(self.temp_dir),
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(rollup_json),
            "--markdown-out",
            str(rollup_md),
        )
        (bundle / "real-mode-claim-gate.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.real-mode-claim-gate.v1",
                    "disposition": "WARN",
                    "claimWordingClass": "partial-real-mode",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (bundle / "saq-release-gate.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.saq-release-gate.v1",
                    "disposition": "HOLD",
                    "blockingReasons": ["SAQ-001 is open P0 and has no release waiver"],
                }
            )
            + "\n",
            encoding="utf-8",
        )
        verdict_json = self.temp_dir / "verdict.json"
        verdict_md = self.temp_dir / "verdict.md"
        run_py(
            "build_rc_go_no_go_verdict.py",
            "--repo-root",
            str(REPO_ROOT),
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(verdict_json),
            "--markdown-out",
            str(verdict_md),
        )
        verdict = json.loads(verdict_json.read_text(encoding="utf-8"))
        self.assertEqual(verdict["schema"], "archlucid.rc-go-no-go-verdict.v1")
        self.assertEqual(verdict["saqReleaseGateDisposition"], "HOLD")
        self.assertIn("SAQ release gate: HOLD", verdict["blockers"])
        handoff_json = self.temp_dir / "handoff.json"
        handoff_md = self.temp_dir / "handoff.md"
        run_py(
            "build_deploy_handoff.py",
            "--repo-root",
            str(REPO_ROOT),
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(handoff_json),
            "--markdown-out",
            str(handoff_md),
        )
        handoff = json.loads(handoff_json.read_text(encoding="utf-8"))
        self.assertEqual(handoff["schema"], "archlucid.deploy-handoff.v1")
        self.assertIn("azure", handoff)

    def test_quote_to_proof_strict_send_blocks_incomplete_baseline(self) -> None:
        summary = self.temp_dir / "summary.json"
        summary.write_text(
            json.dumps(
                {
                    "blockCount": 0,
                    "sponsorPacketDisposition": "READY",
                    "roiBasisStatus": "not-collected",
                    "roiSponsorSafe": True,
                }
            )
            + "\n",
            encoding="utf-8",
        )
        out_json = self.temp_dir / "qtp.json"
        out_md = self.temp_dir / "qtp.md"
        result = run_py(
            "report_quote_to_proof_readiness.py",
            "--go-no-go-summary",
            str(summary),
            "--json-out",
            str(out_json),
            "--markdown-out",
            str(out_md),
            "--strict-send",
        )
        payload = json.loads(out_json.read_text(encoding="utf-8"))
        self.assertEqual(payload["baselineCompletenessStatus"], "NOT_COLLECTED")
        self.assertEqual(payload["proofDisposition"], "HOLD")
        self.assertEqual(result.returncode, 1, msg=result.stderr)

    def test_azure_doc_contract_drift_passes(self) -> None:
        result = run_py("check_azure_doc_contract_drift.py")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_rc_target_environment_matrix_staging_authoritative(self) -> None:
        matrix_path = CI / "data" / "rc_target_environment_matrix.v1.json"
        matrix = json.loads(matrix_path.read_text(encoding="utf-8"))
        authoritative = [
            row for row in matrix["environments"] if row.get("role") == "contract-authoritative"
        ]
        self.assertEqual(1, len(authoritative))
        self.assertEqual("staging", authoritative[0]["id"])
        self.assertEqual("Bearer", authoritative[0].get("defaultAuthMode"))

    def test_v1_integration_starter_contracts_gate(self) -> None:
        result = run_py("check_v1_integration_starter_contracts.py")
        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)

    def test_release_evidence_profile_contract(self) -> None:
        profiles = json.loads(
            (CI / "data" / "release_evidence_bundle_profiles.v1.json").read_text(encoding="utf-8")
        )
        optional = profiles["profiles"]["release-readiness"]["optionalFiles"]
        for name in (
            "rc-go-no-go-verdict.json",
            "deploy-handoff.json",
            "rc-test-evidence-manifest.json",
            "azure-iac-parity-proof.json",
            "managed-identity-verification.json",
            "real-mode-claim-gate.json",
            "saq-release-gate.json",
            "saq-release-gate.md",
        ):
            self.assertIn(name, optional)


if __name__ == "__main__":
    unittest.main()
