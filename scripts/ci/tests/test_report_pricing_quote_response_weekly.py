"""Tests for pricing quote response weekly telemetry."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"
_FIXTURE = _REPO / "fixtures" / "pricing-quote-response" / "sample-quote-requests.json"


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


TELEMETRY = _load_module("pricing_quote_response_telemetry", "pricing_quote_response_telemetry.py")
REPORT = _load_module("report_pricing_quote_response_weekly", "report_pricing_quote_response_weekly.py")


class PricingQuoteResponseTelemetryTests(unittest.TestCase):
    def test_classify_first_response_thresholds(self) -> None:
        self.assertEqual(TELEMETRY.classify_first_response_hours(10.0, pending=False), "ok")
        self.assertEqual(TELEMETRY.classify_first_response_hours(20.0, pending=False), "warn")
        self.assertEqual(TELEMETRY.classify_first_response_hours(30.0, pending=False), "breach")
        self.assertEqual(TELEMETRY.classify_first_response_hours(None, pending=True), "pending")

    def test_classify_close_thresholds(self) -> None:
        self.assertEqual(TELEMETRY.classify_close_hours(48.0, pending=False), "ok")
        self.assertEqual(TELEMETRY.classify_close_hours(80.0, pending=False), "behind_target")
        self.assertEqual(TELEMETRY.classify_close_hours(130.0, pending=False), "warn")
        self.assertEqual(TELEMETRY.classify_close_hours(200.0, pending=False), "breach")
        self.assertEqual(TELEMETRY.classify_close_hours(None, pending=True), "pending")

    def test_weekly_payload_from_fixture_has_expected_shape(self) -> None:
        payload = json.loads(_FIXTURE.read_text(encoding="utf-8"))
        records = TELEMETRY.load_records_from_export(payload)
        week_start = datetime(2026, 6, 9, tzinfo=timezone.utc)
        week_end = datetime(2026, 6, 16, tzinfo=timezone.utc)
        as_of = datetime(2026, 6, 16, 12, 0, tzinfo=timezone.utc)
        summary = TELEMETRY.build_weekly_payload(
            records,
            week_start=week_start,
            week_end=week_end,
            as_of_utc=as_of,
            source="test-fixture",
        )

        self.assertEqual(summary["schema"], TELEMETRY.SCHEMA_WEEKLY)
        self.assertEqual(summary["requestCount"], 4)
        self.assertIn(summary["weeklyDisposition"], {"PASS", "WARN", "HOLD"})
        self.assertEqual(summary["firstResponse"]["sampleCount"], 3)
        self.assertEqual(summary["firstResponse"]["breachCount"], 2)
        self.assertEqual(summary["close"]["sampleCount"], 2)
        self.assertEqual(summary["close"]["pendingCount"], 2)

        markdown = TELEMETRY.render_weekly_markdown(summary)
        self.assertIn("# Pricing quote response telemetry (weekly)", markdown)
        self.assertIn("Gamma Corp", markdown)

    def test_report_script_generates_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            json_out = temp_path / "weekly-summary.json"
            markdown_out = temp_path / "weekly-summary.md"
            exit_code = REPORT.main(
                [
                    "--input-json",
                    str(_FIXTURE),
                    "--week-start",
                    "2026-06-09T00:00:00+00:00",
                    "--week-end",
                    "2026-06-16T00:00:00+00:00",
                    "--as-of",
                    "2026-06-16T12:00:00+00:00",
                    "--json-out",
                    str(json_out),
                    "--markdown-out",
                    str(markdown_out),
                ],
            )

            self.assertEqual(exit_code, 0)
            self.assertTrue(json_out.is_file())
            self.assertTrue(markdown_out.is_file())

            generated = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertEqual(generated["requestCount"], 4)
            self.assertIn("firstResponse", generated)
            self.assertIn("close", generated)
            self.assertIn("rows", generated)

            markdown = markdown_out.read_text(encoding="utf-8")
            self.assertIn("## First response", markdown)
            self.assertIn("## Close / follow-up", markdown)


if __name__ == "__main__":
    unittest.main()
