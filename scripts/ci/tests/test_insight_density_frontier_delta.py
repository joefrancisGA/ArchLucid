#!/usr/bin/env python3
"""Unit tests for scripts/ci/insight_density_frontier_delta.py."""

from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_module():
    path = _CI / "insight_density_frontier_delta.py"
    spec = importlib.util.spec_from_file_location("insight_density_frontier_delta", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


MOD = _load_module()


class InsightDensityFrontierDeltaTests(unittest.TestCase):
    def test_jaccard_parity_with_csharp_helper_cases(self) -> None:
        cases = [
            ("Enable MFA for privileged accounts", "Enable MFA for privileged accounts", 1.0),
            ("Cross-region replication lacks documented RPO", "Replication missing RPO documentation", 0.2857142857142857),
            ("totally different phraseology here", "another unrelated architecture topic", 0.0),
        ]

        for left, right, want in cases:
            self.assertAlmostEqual(MOD.jaccard_similarity(left, right), want, places=6)

    def test_is_covered_by_baseline_rule_id_path(self) -> None:
        finding = {
            "category": "Security",
            "title": "Different title",
            "policyRuleId": "storage.public-access",
        }
        baseline_finding = {
            "category": "Security",
            "title": "Other title",
            "ruleId": "storage.public-access",
        }

        self.assertTrue(MOD.is_covered_by_baseline(finding, baseline_finding, 0.60))

    def test_is_covered_by_baseline_title_path(self) -> None:
        finding = {
            "category": "Security",
            "title": "Enable MFA for privileged accounts",
            "policyRuleId": None,
        }
        baseline_finding = {
            "category": "Security",
            "title": "Enable MFA for privileged accounts",
            "ruleId": None,
        }

        self.assertTrue(MOD.is_covered_by_baseline(finding, baseline_finding, 0.60))

    def test_build_summary_matches_committed_corpus(self) -> None:
        corpus = _REPO / "tests" / "eval-corpus" / "insight-density-frontier-delta"
        summary = MOD.build_summary(corpus)

        self.assertEqual(summary["scenarioCount"], 3)
        self.assertTrue(summary["hasZeroPercentScenario"])
        self.assertTrue(summary["hasPositivePercentScenario"])
        self.assertTrue(summary["allScenariosMatchExpected"])
        self.assertEqual(summary["rollup"], "PASS")

    def test_main_enforce_and_check(self) -> None:
        corpus = _REPO / "tests" / "eval-corpus" / "insight-density-frontier-delta"
        capture_corpus = _REPO / "tests" / "eval-corpus" / "insight-density-frontier-capture"
        json_out = _REPO / "docs" / "quality" / "insight-density-frontier-delta.json"
        markdown_out = _REPO / "docs" / "quality" / "insight-density-frontier-delta.md"

        self.assertEqual(
            MOD.main(
                [
                    "--corpus",
                    str(corpus),
                    "--capture-corpus",
                    str(capture_corpus),
                    "--json-out",
                    str(json_out),
                    "--markdown-out",
                    str(markdown_out),
                    "--enforce",
                    "--enforce-capture",
                    "--check",
                ]
            ),
            0,
        )

        committed = json.loads(json_out.read_text(encoding="utf-8"))
        self.assertEqual(committed["rollup"], "PASS")

    def test_capture_summary_accepts_idle_pilot_pending_fixture(self) -> None:
        capture_corpus = _REPO / "tests" / "eval-corpus" / "insight-density-frontier-capture"
        summary = MOD.build_capture_summary(capture_corpus)

        self.assertEqual(summary["rollup"], "PASS")
        idle_rows = [row for row in summary["fixtures"] if row.get("idlePilotPending")]
        self.assertTrue(idle_rows)

    def test_validate_capture_fixture_requires_source(self) -> None:
        errors = MOD.validate_capture_fixture(
            {
                "schema": MOD._CAPTURE_SCHEMA,
                "architecturePackageSha256": "f" * 64,
                "findingsSnapshotId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "capturedUtc": "2026-09-08T00:00:00Z",
                "label": "pilot-pending",
                "decisionGradeFindingTitles": [],
                "archlucidFindings": [],
                "frontierBaseline": {"findings": []},
            }
        )

        self.assertTrue(any("frontierBaseline.source" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
