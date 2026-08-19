"""Tests for the nightly SQL dependency latency digest."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"
_FIXTURE = _REPO / "fixtures" / "sql-dependency-latency" / "sample-query.json"


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


TELEMETRY = _load_module("sql_dependency_latency_telemetry", "sql_dependency_latency_telemetry.py")
REPORT = _load_module("report_sql_dependency_latency_nightly", "report_sql_dependency_latency_nightly.py")
PARSE = _load_module("app_insights_daily_error_telemetry", "app_insights_daily_error_telemetry.py")


class SqlDependencyLatencyNightlyTests(unittest.TestCase):
    def test_rows_sorted_by_p95_desc(self) -> None:
        payload = json.loads(_FIXTURE.read_text(encoding="utf-8"))
        rows = TELEMETRY.rows_from_records(PARSE.parse_log_analytics_response(payload))

        self.assertEqual(len(rows), 2)
        self.assertGreaterEqual(rows[0].p95_ms, rows[1].p95_ms)
        self.assertIn("dbo.Runs", rows[0].name)

    def test_report_script_generates_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            json_out = temp_path / "report.json"
            markdown_out = temp_path / "report.md"
            exit_code = REPORT.main(
                [
                    "--workspace-id",
                    "26a9250a-c210-48d0-8f10-ebb60a76bb48",
                    "--fixture-json",
                    str(_FIXTURE),
                    "--json-out",
                    str(json_out),
                    "--markdown-out",
                    str(markdown_out),
                ]
            )

            self.assertEqual(exit_code, 0)
            payload = json.loads(json_out.read_text(encoding="utf-8"))
            markdown = markdown_out.read_text(encoding="utf-8")

            self.assertEqual(payload["schema"], TELEMETRY.SCHEMA_REPORT)
            self.assertEqual(payload["totals"]["rowCount"], 2)
            self.assertIn("emailSubject", payload)
            self.assertIn("# SQL dependency latency (nightly)", markdown)
            self.assertIn("dbo.Runs", markdown)
            self.assertIn("database.windows.net", markdown)


if __name__ == "__main__":
    unittest.main()
