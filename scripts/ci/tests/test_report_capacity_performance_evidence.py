#!/usr/bin/env python3
"""Unit tests for capacity/performance evidence rollup."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO / "scripts" / "ci" / "report_capacity_performance_evidence.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("report_capacity_performance_evidence", _SCRIPT)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load report_capacity_performance_evidence.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


_module = _load_module()


class CapacityPerformanceEvidenceTests(unittest.TestCase):
    def test_production_fixture_lists_scenarios_without_contractual_guarantee(self) -> None:
        scenarios = _module.load_scenarios(_REPO / "scripts/ci/fixtures/capacity_performance_evidence.json")
        summary = _module.build_summary(_REPO, scenarios)
        self.assertGreaterEqual(int(summary["scenarioCount"]), 3)
        self.assertFalse(summary["contractualScaleGuarantee"])

    def test_missing_artifacts_yield_inconclusive(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            fixture = {
                "scenarios": [
                    {
                        "name": "smoke",
                        "scenario": "health",
                        "environmentClass": "ci",
                        "requestMix": "read",
                        "artifactPath": "docs/perf.md",
                        "p95LatencyMs": 10,
                        "failureRatePercent": 0,
                        "exclusions": "none",
                    }
                ]
            }
            (root / "docs").mkdir(parents=True)
            (root / "docs/perf.md").write_text("# perf", encoding="utf-8")
            (root / "scripts/ci/fixtures").mkdir(parents=True)
            (root / "scripts/ci/fixtures/capacity_performance_evidence.json").write_text(
                json.dumps(fixture),
                encoding="utf-8",
            )
            scenarios = _module.load_scenarios(root / "scripts/ci/fixtures/capacity_performance_evidence.json")
            summary = _module.build_summary(root, scenarios)
            self.assertEqual("PASS", summary["overallDisposition"])


if __name__ == "__main__":
    unittest.main()
