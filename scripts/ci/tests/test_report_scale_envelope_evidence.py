"""Tests for V1 scale envelope evidence pack."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from report_scale_envelope_evidence import build_scale_envelope_summary, format_markdown


class TestReportScaleEnvelopeEvidence(unittest.TestCase):
    def test_summary_separates_measured_configured_untested(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            baseline_path = Path(tmp) / "baseline.json"
            baseline_path.write_text(json.dumps({"steps": []}), encoding="utf-8")

            summary = build_scale_envelope_summary(
                performance_baseline_path=baseline_path,
                k6_summary_path=None,
            )

        self.assertGreater(len(summary["measured_evidence"]), 0)
        self.assertGreater(len(summary["configured_targets"]), 0)
        self.assertGreater(len(summary["untested_assumptions"]), 0)

    def test_markdown_does_not_claim_multi_region_sla(self) -> None:
        summary = build_scale_envelope_summary(
            performance_baseline_path=None,
            k6_summary_path=None,
        )
        md = format_markdown(summary)

        self.assertIn("multi-region active/active", md)
        self.assertIn("load-test", md.lower())


if __name__ == "__main__":
    unittest.main()
