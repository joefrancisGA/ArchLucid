"""Tests for scripts/report_observability_export_readiness.py (offline)."""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]


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
            self.assertIn("ArchLucid.Api", text)
            self.assertIn("ArchLucid.Worker", text)
            self.assertIn("archlucid_agent_output_structural_completeness_ratio", text)
            self.assertIn("archlucid_agent_output_quality_gate_total", text)
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


if __name__ == "__main__":
    unittest.main()
