#!/usr/bin/env python3
"""Tests for the architecture assurance tournament tooling."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_ASSURANCE = _REPO / "scripts" / "assurance"


def _load(name: str):
    path = _ASSURANCE / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


VALIDATE = _load("validate_tournament_assets")
TOURNAMENT = _load("architecture_tournament")
COMPARE = _load("compare_tournament_runs")
ADVERSARIAL = _load("generate_adversarial_architecture_cases")
REVIEWER = _load("credibility_reviewer")
SURFACES = _load("cross_surface_consistency")
DETERMINISM = _load("determinism_audit")


class ArchitectureAssuranceTournamentTests(unittest.TestCase):
    def test_committed_tournament_assets_preserve_holdout_integrity(self) -> None:
        errors = VALIDATE.validate_assets(
            _REPO / "tests" / "architecture-tournament" / "development-deep-cases.json",
            _REPO / "tests" / "architecture-tournament" / "heldout-slot-registry.json",
        )
        self.assertEqual(errors, [])

    def test_tournament_preserves_dimensions_and_hard_gates_without_overall_score(self) -> None:
        payload = {
            "runId": "run-1",
            "systemLabel": "candidate",
            "version": "v1",
            "cases": [
                {
                    "caseId": "c1",
                    "elapsedSeconds": 10,
                    "costUsd": 1.25,
                    "findingsCount": 3,
                    "dimensions": {
                        "recall": 0.8,
                        "precision": 0.9,
                        "severityCalibration": 0.7,
                        "evidenceQuality": 0.9,
                        "tradeoffRecognition": 0.6,
                        "recommendationUsefulness": 0.8,
                        "unsupportedClaimControl": 1.0,
                        "contradictionControl": 1.0,
                        "consistency": 0.9,
                    },
                    "hardGates": {"inventedEvidence": False},
                },
                {
                    "caseId": "c2",
                    "elapsedSeconds": 12,
                    "costUsd": 0.75,
                    "findingsCount": 2,
                    "dimensions": {
                        "recall": 0.6,
                        "precision": 0.8,
                        "severityCalibration": 0.9,
                        "evidenceQuality": 0.7,
                        "tradeoffRecognition": 0.8,
                        "recommendationUsefulness": 0.7,
                        "unsupportedClaimControl": 1.0,
                        "contradictionControl": 0.9,
                        "consistency": 0.8,
                    },
                    "hardGates": {"unsupportedCertainty": True},
                },
            ],
        }

        result = TOURNAMENT.summarize(payload)
        self.assertEqual(result["dimensions"]["recall"]["mean"], 0.7)
        self.assertFalse(result["hardGatePass"])
        self.assertNotIn("overallScore", result)
        self.assertEqual(result["totalCostUsd"], 2.0)

    def test_version_comparison_reports_deltas_without_winner(self) -> None:
        left = {
            "runId": "old",
            "version": "1",
            "dimensions": {"recall": {"mean": 0.5}},
            "hardGatePass": True,
            "totalElapsedSeconds": 10,
            "totalCostUsd": 1,
        }
        right = {
            "runId": "new",
            "version": "2",
            "dimensions": {"recall": {"mean": 0.75}},
            "hardGatePass": True,
            "totalElapsedSeconds": 8,
            "totalCostUsd": 1.2,
        }

        result = COMPARE.compare(left, right)
        self.assertEqual(result["dimensions"]["recall"]["deltaRightMinusLeft"], 0.25)
        self.assertNotIn("winner", result)

    def test_adversarial_generator_is_seed_deterministic(self) -> None:
        first = ADVERSARIAL.generate("case-a", 42, 4)
        second = ADVERSARIAL.generate("case-a", 42, 4)
        self.assertEqual(first, second)
        self.assertEqual(len(first["perturbations"]), 4)

    def test_credibility_reviewer_catches_failure_clean_status_and_unsupported_certainty(self) -> None:
        issues = REVIEWER.review(
            {
                "generationStatus": "Complete",
                "engineFailures": [{"engineType": "x"}],
                "findings": [
                    {
                        "findingId": "f1",
                        "engineType": "engine",
                        "title": "Confirmed vulnerability",
                        "rationale": "Observed exposure.",
                        "evidenceRefs": [],
                    }
                ],
            }
        )
        codes = {issue["code"] for issue in issues}
        self.assertIn("FAILURE_PRESENT_BUT_COMPLETE", codes)
        self.assertIn("CERTAINTY_WITHOUT_EVIDENCE", codes)

    def test_cross_surface_auditor_detects_material_disagreement(self) -> None:
        left = {"findings": [{"findingId": "f1", "title": "A", "severity": "High", "category": "Security", "engineType": "e"}]}
        right = {"findings": [{"findingId": "f1", "title": "A", "severity": "Low", "category": "Security", "engineType": "e"}]}
        issues = SURFACES.audit([("left", left), ("right", right)])
        self.assertTrue(any(issue.get("field") == "severity" for issue in issues))

    def test_determinism_audit_ignores_declared_volatile_fields(self) -> None:
        left = {"findingId": "f1", "title": "same", "createdUtc": "2026-01-01T00:00:00Z"}
        right = {"findingId": "f1", "title": "same", "createdUtc": "2026-01-02T00:00:00Z"}
        self.assertEqual(
            DETERMINISM.fingerprint(left, DETERMINISM.DEFAULT_VOLATILE_FIELDS),
            DETERMINISM.fingerprint(right, DETERMINISM.DEFAULT_VOLATILE_FIELDS),
        )


if __name__ == "__main__":
    unittest.main()
