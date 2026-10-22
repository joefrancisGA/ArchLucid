"""Tests for the daily App Insights error digest."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"
_FIXTURE_DIR = _REPO / "fixtures" / "app-insights-daily-errors"
_BASELINE = _FIXTURE_DIR / "baseline.json"


def _load_module(name: str, script_name: str):
    script = _CI / script_name
    spec = importlib.util.spec_from_file_location(name, script)

    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script_name}")

    sys.path.insert(0, str(_CI))
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


TELEMETRY = _load_module("app_insights_daily_error_telemetry", "app_insights_daily_error_telemetry.py")
REPORT = _load_module("report_app_insights_daily_errors", "report_app_insights_daily_errors.py")


class AppInsightsDailyErrorTelemetryTests(unittest.TestCase):
    def test_normalize_message_strips_guids_and_numbers(self) -> None:
        raw = "Tenant 11111111-1111-1111-1111-111111111111 failed with code 547"
        normalized = TELEMETRY.normalize_message(raw)

        self.assertIn("<guid>", normalized)
        self.assertIn("<n>", normalized)
        self.assertNotIn("11111111", normalized)

    def test_parse_log_analytics_response_maps_rows(self) -> None:
        payload = json.loads((_FIXTURE_DIR / "exceptions.json").read_text(encoding="utf-8"))
        records = TELEMETRY.parse_log_analytics_response(payload)

        self.assertEqual(len(records), 2)
        self.assertEqual(records[0]["Type"], "System.Data.SqlClient.SqlException")
        self.assertEqual(records[0]["Count"], 12)

    def test_mark_new_rows_against_baseline(self) -> None:
        payload = json.loads((_FIXTURE_DIR / "exceptions.json").read_text(encoding="utf-8"))
        rows = TELEMETRY.rows_from_exceptions(TELEMETRY.parse_log_analytics_response(payload))
        baseline = TELEMETRY.load_baseline_file(_BASELINE)
        marked = TELEMETRY.mark_new_rows(rows, baseline)
        new_labels = [row.label for row in marked if row.is_new]

        self.assertIn("System.Data.SqlClient.SqlException", new_labels)
        self.assertEqual(sum(1 for row in marked if row.is_new), 1)

    def test_parse_log_analytics_response_maps_cli_array_rows(self) -> None:
        payload = [
            {
                "Count": "11",
                "ProblemId": "sample-problem",
                "SampleOuterMessage": "permission denied",
                "TableName": "PrimaryResult",
                "Type": "AppExceptions",
            }
        ]
        records = TELEMETRY.parse_log_analytics_response(payload)

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["Count"], "11")
        self.assertEqual(records[0]["Type"], "AppExceptions")
        self.assertNotIn("TableName", records[0])

    def test_report_script_generates_artifacts_from_fixture(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            json_out = temp_path / "daily-error-report.json"
            markdown_out = temp_path / "daily-error-report.md"
            baseline_out = temp_path / "baseline.json"

            exit_code = REPORT.main(
                [
                    "--workspace-id",
                    "26a9250a-c210-48d0-8f10-ebb60a76bb48",
                    "--fixture-dir",
                    str(_FIXTURE_DIR),
                    "--baseline-in",
                    str(_BASELINE),
                    "--baseline-out",
                    str(baseline_out),
                    "--json-out",
                    str(json_out),
                    "--markdown-out",
                    str(markdown_out),
                ]
            )

            self.assertEqual(exit_code, 0)
            payload = json.loads(json_out.read_text(encoding="utf-8"))
            markdown = markdown_out.read_text(encoding="utf-8")
            baseline_after = json.loads(baseline_out.read_text(encoding="utf-8"))

            self.assertEqual(payload["schema"], TELEMETRY.SCHEMA_REPORT)
            self.assertEqual(payload["totals"]["newSignatureCount"], 3)
            self.assertIn("# App Insights daily error digest", markdown)
            self.assertIn("New error signatures", markdown)
            self.assertGreaterEqual(len(baseline_after["signatures"]), 2)


if __name__ == "__main__":
    unittest.main()
