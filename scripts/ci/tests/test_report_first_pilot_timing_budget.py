"""Tests for first-pilot timing budget evidence pack."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from report_first_pilot_timing_budget import build_timing_budget, format_markdown


class TestReportFirstPilotTimingBudget(unittest.TestCase):
    def test_measured_and_guidance_separated(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            baseline_path = Path(tmp) / "baseline.json"
            baseline_path.write_text(
                json.dumps(
                    {
                        "steps": [
                            {
                                "stepKey": "commit",
                                "stepLabel": "Commit golden manifest",
                                "status": "RUN",
                                "elapsedMs": 1200,
                            },
                        ],
                    },
                ),
                encoding="utf-8",
            )

            summary = build_timing_budget(
                performance_baseline_path=baseline_path,
                proof_collection_elapsed_ms=5000,
            )

        self.assertEqual(len(summary["measuredPhases"]), 2)
        self.assertGreater(len(summary["guidanceOnlyPhases"]), 0)
        self.assertIn("sponsorOutputRule", summary)

    def test_markdown_labels_guidance_only(self) -> None:
        summary = build_timing_budget(performance_baseline_path=None, proof_collection_elapsed_ms=None)
        md = format_markdown(summary)

        self.assertIn("Guidance-only", md)
        self.assertIn("sla proof", md.lower())


if __name__ == "__main__":
    unittest.main()
