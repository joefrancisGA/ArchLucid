"""Tests for real-mode evidence freshness reporter."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load():
    script = _CI / "report_real_mode_evidence_freshness.py"
    spec = importlib.util.spec_from_file_location("report_real_mode_evidence_freshness", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load report_real_mode_evidence_freshness.py")

    sys.path.insert(0, str(_CI))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    return mod


REPORT = _load()


class ReportRealModeEvidenceFreshnessTests(unittest.TestCase):
    def test_simulator_only_is_not_strict_blocking(self) -> None:
        summary = {"freshnessStatus": "SIMULATOR_ONLY"}

        self.assertFalse(REPORT.should_fail(summary, strict=True))

    def test_missing_is_strict_blocking(self) -> None:
        summary = {"freshnessStatus": "MISSING"}

        self.assertTrue(REPORT.should_fail(summary, strict=True))

    def test_advisory_never_blocks(self) -> None:
        summary = {"freshnessStatus": "MISSING"}

        self.assertFalse(REPORT.should_fail(summary, strict=False))

    def test_simulator_only_evaluation(self) -> None:
        summary = REPORT.evaluate_freshness(
            bundle_dir=_REPO / "artifacts" / "release",
            agent_results_dir=_REPO / "tests" / "eval-corpus" / "agent-results",
            gate_json=None,
            waiver_json=None,
            allow_simulator_only=True,
            max_gate_age_days=30,
        )

        self.assertEqual(summary["freshnessStatus"], "SIMULATOR_ONLY")
        self.assertIn("SIMULATOR_ONLY_OVERRIDE", summary["reasonCodes"])


if __name__ == "__main__":
    unittest.main()
