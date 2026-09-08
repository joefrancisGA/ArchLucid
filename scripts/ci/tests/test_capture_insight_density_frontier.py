#!/usr/bin/env python3
"""Unit tests for scripts/capture_insight_density_frontier.py."""

from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO / "scripts" / "capture_insight_density_frontier.py"
_FIXTURE = (
    _REPO
    / "tests"
    / "eval-corpus"
    / "insight-density-frontier-capture"
    / "synthetic-highly-novel.json"
)


def _load_module():
    spec = importlib.util.spec_from_file_location("capture_insight_density_frontier", _SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


MOD = _load_module()


class CaptureInsightDensityFrontierTests(unittest.TestCase):
    def test_synthetic_fixture_matches_calculator(self) -> None:
        document = json.loads(_FIXTURE.read_text(encoding="utf-8"))
        errors = MOD.validate_capture_document(document)
        self.assertEqual(errors, [])

    def test_build_capture_document_derives_decision_grade_titles(self) -> None:
        document = MOD.build_capture_document(
            architecture_package_sha256="f" * 64,
            findings_snapshot_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            captured_utc="2026-09-07T00:00:00Z",
            label="synthetic",
            archlucid_findings=[
                {
                    "findingId": "f1",
                    "engineType": "topology",
                    "category": "Cost",
                    "title": "Novel cost finding",
                    "policyRuleId": None,
                    "classification": "DecisionGradeFinding",
                },
            ],
            frontier_baseline_findings=[],
            expected_novelty_percentage=100.0,
        )

        self.assertEqual(document["decisionGradeFindingTitles"], ["Novel cost finding"])

    def test_validate_fixture_cli(self) -> None:
        exit_code = MOD.main(["--validate-fixture", str(_FIXTURE)])
        self.assertEqual(exit_code, 0)


if __name__ == "__main__":
    unittest.main()
