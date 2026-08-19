"""Tests for RC evidence signoff bundle and pilot-critical performance evidence."""

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


def run_py(script: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(CI / script), *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class BuildRcEvidenceSignoffBundleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="rc-signoff-bundle-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _write_minimal_bundle(self) -> Path:
        bundle = self.temp_dir / "bundle"
        bundle.mkdir()

        (bundle / "release-readiness-index.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.release-readiness-index.v1",
                    "rollup": "PASS",
                    "gitCommitSha": "abc123",
                    "environment": "Production",
                }
            )
            + "\n",
            encoding="utf-8",
        )

        return bundle

    def test_hold_when_high_risk_gate_skipped(self) -> None:
        bundle = self._write_minimal_bundle()
        json_out = self.temp_dir / "signoff.json"
        md_out = self.temp_dir / "signoff.md"

        result = run_py(
            "build_rc_evidence_signoff_bundle.py",
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
        )

        payload = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(payload["schema"], "archlucid.rc-evidence-signoff-bundle.v1")
        self.assertEqual(payload["overallDisposition"], "HOLD")
        self.assertTrue(len(payload["skippedHighRiskGates"]) > 0)
        self.assertEqual(result.returncode, 0)

    def test_pass_when_required_gates_attached(self) -> None:
        bundle = self._write_minimal_bundle()

        (bundle / "release-smoke-result.json").write_text(
            json.dumps({"verdict": "Pass", "profile": "", "generatedUtc": "2026-06-12T00:00:00+00:00"})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "release-smoke-live-ui-sql-result.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.release-smoke-live-ui-sql-result.v1",
                    "status": "PASS",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (bundle / "config-lint-production-like-hosted-pilot.json").write_text(
            json.dumps({"disposition": "PASS"})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "openapi-contract-snapshot-status.json").write_text(
            json.dumps({"status": "PASS"})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "data-consistency-readiness.json").write_text(
            json.dumps({"disposition": "PASS", "configuredMode": "ALERT"})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "real-mode-claim-gate.json").write_text(
            json.dumps(
                {
                    "schema": "archlucid.real-mode-claim-gate.v1",
                    "disposition": "PASS",
                    "claimWordingClass": "simulator-only",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (bundle / "simulator-only-override.md").write_text("# Simulator-only override\n", encoding="utf-8")
        (bundle / "simulator-live-divergence.json").write_text(
            json.dumps({"disposition": "PASS", "buyerFacingFullRealBlocked": False})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "architecture-invariant-rc-summary.json").write_text(
            json.dumps({"disposition": "PASS"})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "saq-release-gate.json").write_text(
            json.dumps({"disposition": "PASS"})
            + "\n",
            encoding="utf-8",
        )
        (bundle / "first-pilot-timing-budget.json").write_text(
            json.dumps(
                {
                    "disposition": "PASS",
                    "firstValueCommitBudget": {
                        "disposition": "PASS",
                        "detail": "Synthetic PASS for signoff bundle unit test",
                    },
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (bundle / "pilot-readiness-live-release-gate.json").write_text(
            json.dumps({"disposition": "PASS", "detail": "Synthetic PASS for signoff bundle unit test"})
            + "\n",
            encoding="utf-8",
        )

        json_out = self.temp_dir / "signoff-pass.json"
        md_out = self.temp_dir / "signoff-pass.md"

        run_py(
            "build_rc_evidence_signoff_bundle.py",
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
        )

        payload = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(payload["overallDisposition"], "PASS")
        self.assertTrue(payload["evidenceModeSummary"]["simulatorOnlyOverridePresent"])

        gate_ids = {gate["id"]: gate["status"] for gate in payload["gates"]}
        self.assertEqual(gate_ids["release-smoke"], "PASS")
        self.assertEqual(gate_ids["live-ui-api-parity"], "PASS")
        self.assertEqual(gate_ids["procurement-claim-boundary"], "PASS")

    def test_skipped_rows_visible_with_reason(self) -> None:
        bundle = self._write_minimal_bundle()
        json_out = self.temp_dir / "signoff-skipped.json"
        md_out = self.temp_dir / "signoff-skipped.md"

        run_py(
            "build_rc_evidence_signoff_bundle.py",
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
        )

        payload = json.loads(json_out.read_text(encoding="utf-8"))
        release_smoke = next(gate for gate in payload["gates"] if gate["id"] == "release-smoke")

        self.assertEqual(release_smoke["status"], "SKIPPED")
        self.assertIn("Release smoke", release_smoke["reason"])

    def test_rag_citation_coverage_gate_warns_when_missing(self) -> None:
        bundle = self._write_minimal_bundle()
        json_out = self.temp_dir / "signoff-citation.json"
        md_out = self.temp_dir / "signoff-citation.md"

        run_py(
            "build_rc_evidence_signoff_bundle.py",
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
        )

        payload = json.loads(json_out.read_text(encoding="utf-8"))
        citation_gate = next(gate for gate in payload["gates"] if gate["id"] == "rag-citation-coverage")

        self.assertEqual(citation_gate["status"], "SKIPPED")
        self.assertIn("Retrieval quality rollup", citation_gate["reason"])
        self.assertNotIn("rag-citation-coverage", payload.get("skippedHighRiskGates") or [])

    def test_rag_citation_coverage_gate_passes_when_attached(self) -> None:
        bundle = self._write_minimal_bundle()
        (bundle / "retrieval-quality-rollup.json").write_text(
            json.dumps(
                {
                    "disposition": "PASS",
                    "faithfulness": {"meanSupportRatio": 0.92},
                    "interpretation": "Offline golden-fixture benchmarks only.",
                }
            )
            + "\n",
            encoding="utf-8",
        )

        json_out = self.temp_dir / "signoff-citation-pass.json"
        md_out = self.temp_dir / "signoff-citation-pass.md"

        run_py(
            "build_rc_evidence_signoff_bundle.py",
            "--bundle-dir",
            str(bundle),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
        )

        payload = json.loads(json_out.read_text(encoding="utf-8"))
        citation_gate = next(gate for gate in payload["gates"] if gate["id"] == "rag-citation-coverage")

        self.assertEqual(citation_gate["status"], "PASS")


class BuildPilotCriticalPerformanceEvidenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = Path(tempfile.mkdtemp(prefix="pilot-perf-"))

    def tearDown(self) -> None:
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_serialization_and_severe_timeout_hold(self) -> None:
        timings = self.temp_dir / "timings.json"
        timings.write_text(
            json.dumps(
                {
                    "executionMode": "Simulator",
                    "runId": "run-123",
                    "correlationId": "corr-456",
                    "timingsMs": {
                        "create_run": 5000,
                        "commit": 2000,
                        "ask": 250000,
                        "sponsor_export": 4000,
                    },
                }
            )
            + "\n",
            encoding="utf-8",
        )

        json_out = self.temp_dir / "perf.json"
        md_out = self.temp_dir / "perf.md"

        result = run_py(
            "build_pilot_critical_performance_evidence.py",
            "--timings-json",
            str(timings),
            "--environment-label",
            "staging",
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
            "--strict-rc",
        )

        payload = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(payload["schema"], "archlucid.pilot-critical-performance-evidence.v1")
        self.assertEqual(payload["runId"], "run-123")
        self.assertEqual(payload["executionMode"], "simulator")
        self.assertEqual(payload["disposition"], "HOLD")

        ask_flow = next(flow for flow in payload["flows"] if flow["id"] == "ask-response")
        self.assertEqual(ask_flow["status"], "HOLD")
        self.assertIn("Severe timeout", ask_flow["reason"])

        skipped_flow = next(flow for flow in payload["flows"] if flow["id"] == "dashboard-roi")
        self.assertEqual(skipped_flow["status"], "SKIPPED")

        self.assertEqual(result.returncode, 1)

    def test_pass_with_supplied_timings(self) -> None:
        timings = self.temp_dir / "timings-pass.json"
        timings.write_text(
            json.dumps(
                {
                    "executionMode": "Real",
                    "timingsMs": {
                        "create_run": 4000,
                        "commit": 1500,
                        "run_roi": 1200,
                        "ask": 8000,
                        "export_zip": 5000,
                    },
                }
            )
            + "\n",
            encoding="utf-8",
        )

        json_out = self.temp_dir / "perf-pass.json"
        md_out = self.temp_dir / "perf-pass.md"

        run_py(
            "build_pilot_critical_performance_evidence.py",
            "--timings-json",
            str(timings),
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
        )

        payload = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(payload["disposition"], "PASS")
        self.assertEqual(payload["executionMode"], "real")


if __name__ == "__main__":
    unittest.main()
