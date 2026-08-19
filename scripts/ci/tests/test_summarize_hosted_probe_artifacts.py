"""Tests for scripts/ops/summarize_hosted_probe_artifacts.py (hosted probe rollup)."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_OPS_ROOT = Path(__file__).resolve().parent.parent.parent / "ops"
_FIXTURES = Path(__file__).resolve().parent.parent.parent / "fixtures" / "hosted_probe_rollup"

if str(_OPS_ROOT) not in sys.path:
    sys.path.insert(0, str(_OPS_ROOT))

import summarize_hosted_probe_artifacts as sh  # noqa: E402


def _load_fixture_dir(name: str) -> list[dict]:
    return sh.load_rows_from_json_paths([_FIXTURES / name])


class TestSummarizeHostedProbeArtifacts(unittest.TestCase):
    def test_all_green_staging_and_full_uptime(self) -> None:
        rows = _load_fixture_dir("all_green")
        model = sh.build_rollup(rows)

        self.assertEqual(model.environment_label, "staging")
        self.assertEqual(model.attempted_count, 3)
        self.assertEqual(model.both_ok_count, 3)
        self.assertEqual(model.failed_probe_count, 0)
        self.assertIsNotNone(model.uptime_percent_of_attempted)
        assert model.uptime_percent_of_attempted is not None
        self.assertAlmostEqual(model.uptime_percent_of_attempted, 100.0, places=4)
        self.assertEqual(model.overall_disposition, "WARN")
        self.assertFalse(model.buyer_safe_evidence)

        md = sh.render_markdown(model)

        self.assertIn("Not a contractual SLA", md)
        self.assertIn("staging", md)
        self.assertIn("100.0000%", md)
        self.assertIn("**WARN**", md)

    def test_partial_failure_uptime_and_caveat(self) -> None:
        rows = _load_fixture_dir("partial_failure")
        model = sh.build_rollup(rows)

        self.assertEqual(model.attempted_count, 3)
        self.assertEqual(model.both_ok_count, 2)
        self.assertEqual(model.failed_probe_count, 1)
        self.assertIsNotNone(model.uptime_percent_of_attempted)
        assert model.uptime_percent_of_attempted is not None
        self.assertAlmostEqual(model.uptime_percent_of_attempted, 100.0 * 2 / 3, places=3)

        md = sh.render_markdown(model)

        self.assertIn("Some runs failed live/ready checks", md)

    def test_insufficient_data_no_attempted_probes(self) -> None:
        rows = _load_fixture_dir("insufficient")
        model = sh.build_rollup(rows)

        self.assertEqual(model.attempted_count, 0)
        self.assertIsNone(model.uptime_percent_of_attempted)
        self.assertEqual(model.overall_disposition, "INCONCLUSIVE")
        self.assertFalse(model.buyer_safe_evidence)

        md = sh.render_markdown(model)

        self.assertIn("insufficient data", md.lower())
        self.assertIn("99.9", md)
        self.assertIn("Target SLO", md)
        self.assertIn("**INCONCLUSIVE**", md)

    def test_csv_loads_and_inference_production(self) -> None:
        rows = sh.load_rows_from_csv(_FIXTURES / "csv" / "sample.csv")
        model = sh.build_rollup(rows)

        self.assertEqual(model.attempted_count, 1)
        self.assertEqual(model.environment_label, "production")
        self.assertEqual(model.overall_disposition, "PASS")
        self.assertTrue(model.buyer_safe_evidence)

    def test_mixed_base_urls_environment_unknown(self) -> None:
        rows = [
            {
                "skipped": False,
                "probedAtUtc": "2026-05-01T00:00:00Z",
                "baseUrl": "https://staging.archlucid.net",
                "live_ok": True,
                "ready_ok": True,
            },
            {
                "skipped": False,
                "probedAtUtc": "2026-05-02T00:00:00Z",
                "baseUrl": "https://api.archlucid.net",
                "live_ok": True,
                "ready_ok": True,
            },
        ]
        model = sh.build_rollup(rows)

        self.assertEqual(model.environment_label, "unknown")
        self.assertEqual(model.overall_disposition, "INCONCLUSIVE")
        self.assertFalse(model.buyer_safe_evidence)
        self.assertTrue(any("Mixed environment" in caveat for caveat in model.caveats))

    def test_main_writes_markdown(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "rollup.md"
            exit_code = sh.main(["--format", "markdown", "-o", str(out), str(_FIXTURES / "all_green")])

            self.assertEqual(exit_code, 0)
            text = out.read_text(encoding="utf-8")

            self.assertIn("Hosted SaaS probe availability rollup", text)
            self.assertIn("Not a contractual SLA", text)

    def test_render_text_contains_slo_disclaimer(self) -> None:
        rows = _load_fixture_dir("all_green")
        model = sh.build_rollup(rows)
        text = sh.render_text(model)

        self.assertIn("target_availability_slo_percent (published target, not claimed achieved)", text)


if __name__ == "__main__":
    unittest.main()
