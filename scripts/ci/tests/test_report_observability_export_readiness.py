"""Tests for scripts/report_observability_export_readiness.py (offline)."""
from __future__ import annotations

import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


def _load_report_module():
    script = _REPO / "scripts/report_observability_export_readiness.py"
    name = "report_observability_export_readiness_tested"
    spec = importlib.util.spec_from_file_location(name, script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load report module.")

    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)

    return mod


_M = _load_report_module()


class TestReportObservabilityExportReadiness(unittest.TestCase):
    def test_script_writes_markdown(self):
        script = _REPO / "scripts/report_observability_export_readiness.py"

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "out.md"

            result = subprocess.run(
                [sys.executable, str(script), "--environment", "Production", "--out", str(out)],
                cwd=_REPO,
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            text = out.read_text(encoding="utf-8")

            self.assertIn("Observability export readiness", text)
            self.assertIn("Telemetry export readiness verdict:", text)
            self.assertIn("ArchLucid.Api", text)
            self.assertIn("ArchLucid.Worker", text)
            self.assertIn("archlucid_agent_output_structural_completeness_ratio", text)
            self.assertIn("archlucid_agent_output_quality_gate_total", text)
            self.assertIn("archlucid_agent_trace_blob_upload_failures_total", text)
            self.assertIn("archlucid-agent-output-quality", text)
            self.assertIn("docs/library/TECH_BACKLOG.md", text)

    def test_json_files_only_no_export_without_env(self):
        script = _REPO / "scripts/report_observability_export_readiness.py"

        with tempfile.TemporaryDirectory() as tmp:
            env = os.environ.copy()
            env.pop("APPLICATIONINSIGHTS_CONNECTION_STRING", None)
            env.pop("ApplicationInsights__ConnectionString", None)
            env.pop("Observability__AzureMonitor__ApplicationInsightsConnectionString", None)
            env.pop("Observability__Otlp__Endpoint", None)

            result = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    "--environment",
                    "Production",
                    "--no-process-environment",
                    "--out",
                    str(Path(tmp) / "r.md"),
                ],
                cwd=_REPO,
                check=False,
                capture_output=True,
                text=True,
                env=env,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            text = (Path(tmp) / "r.md").read_text(encoding="utf-8")

            self.assertIn("| **ArchLucid.Api** | **no** |", text)
            self.assertIn("| **ArchLucid.Worker** | **no** |", text)
            self.assertIn("**Telemetry export readiness verdict:** **WARN**", text)

    def test_strict_exit_code_fails_when_json_only_and_no_exporter(self):
        script = _REPO / "scripts/report_observability_export_readiness.py"

        with tempfile.TemporaryDirectory() as tmp:
            env = os.environ.copy()
            env.pop("APPLICATIONINSIGHTS_CONNECTION_STRING", None)

            result = subprocess.run(
                [
                    sys.executable,
                    str(script),
                    "--environment",
                    "Production",
                    "--no-process-environment",
                    "--strict-exit-code",
                    "--out",
                    str(Path(tmp) / "r.md"),
                ],
                cwd=_REPO,
                check=False,
                capture_output=True,
                text=True,
                env=env,
            )

            self.assertEqual(result.returncode, 1, result.stderr)

    def test_stdout_never_prints_connection_string_value(self):
        script = _REPO / "scripts/report_observability_export_readiness.py"
        secret_token = "UnitTest-InstrumentationKey-DoNotReuse-7f3c9a2b1d0e"

        with tempfile.TemporaryDirectory() as tmp:
            env = os.environ.copy()
            env["APPLICATIONINSIGHTS_CONNECTION_STRING"] = (
                f"InstrumentationKey={secret_token};IngestionEndpoint=https://dc.services.visualstudio.com/"
            )

            result = subprocess.run(
                [sys.executable, str(script), "--environment", "Production", "--out", str(Path(tmp) / "x.md")],
                cwd=_REPO,
                check=False,
                capture_output=True,
                text=True,
                env=env,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            combined = result.stdout + result.stderr + (Path(tmp) / "x.md").read_text(encoding="utf-8")

            self.assertNotIn(secret_token, combined)
            self.assertNotIn("IngestionEndpoint=https://dc.services.visualstudio.com", combined)

    def test_pass_verdict_when_env_includes_application_insights_connection_string(self):
        script = _REPO / "scripts/report_observability_export_readiness.py"

        with tempfile.TemporaryDirectory() as tmp:
            env = os.environ.copy()
            env["APPLICATIONINSIGHTS_CONNECTION_STRING"] = "InstrumentationKey=placeholder;"

            result = subprocess.run(
                [sys.executable, str(script), "--environment", "Production", "--out", str(Path(tmp) / "p.md")],
                cwd=_REPO,
                check=False,
                capture_output=True,
                text=True,
                env=env,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            text = (Path(tmp) / "p.md").read_text(encoding="utf-8")

            self.assertIn("**Telemetry export readiness verdict:** **PASS**", text)

    def test_compute_release_verdict_fail_when_api_no_export_and_env_on(self):
        api = _M.HostReport(
            files_attempted=[],
            files_loaded=[],
            load_errors=[],
            active_exports=[],
            export_warnings=["x"],
        )
        worker = _M.HostReport(
            files_attempted=[],
            files_loaded=[],
            load_errors=[],
            active_exports=["OTLP"],
            export_warnings=[],
        )

        v, reasons = _M.compute_release_verdict(
            api=api,
            worker=worker,
            include_process_environment=True,
        )

        self.assertEqual(v, "FAIL")
        self.assertTrue(any("ArchLucid.Api" in r for r in reasons))


if __name__ == "__main__":
    unittest.main()
