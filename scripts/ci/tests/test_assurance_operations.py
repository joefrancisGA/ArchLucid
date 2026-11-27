#!/usr/bin/env python3
"""Tests for assurance operations tooling."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from tempfile import TemporaryDirectory
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


METRICS = _load("qa_discovery_metrics")
CAPTURE = _load("capture_recapture")
ROUTER = _load("assurance_router")
CERTAINTY = _load("unsupported_certainty_audit")
REGRESSION = _load("regression_ledger")


class AssuranceOperationsTests(unittest.TestCase):
    def test_qa_metrics_count_unique_duplicate_credibility_and_zero_defect_zones(self) -> None:
        records = [
            {
                "defectId": "d1",
                "zone": "security",
                "severity": "critical",
                "credibilityDefect": True,
                "discoveredBy": "reviewer-a",
                "hours": 1,
                "costUsd": 2,
            },
            {
                "defectId": "d2",
                "zone": "security",
                "severity": "high",
                "duplicateOf": "d1",
                "discoveredBy": "reviewer-b",
                "hours": 0.5,
                "costUsd": 1,
            },
        ]
        result = METRICS.summarize(records, ["security", "billing"])
        self.assertEqual(result["uniqueDefects"], 1)
        self.assertEqual(result["duplicateDefects"], 1)
        self.assertEqual(result["credibilityDefects"], 1)
        self.assertIn("billing", result["saturatedZones"])

    def test_capture_recapture_chapman_estimate_is_explicitly_caveated(self) -> None:
        result = CAPTURE.estimate({"a", "b", "c", "d", "e"}, {"c", "d", "e", "f", "g"})
        self.assertEqual(result["overlapCount"], 3)
        self.assertGreaterEqual(result["chapmanEstimatedTotal"], result["observedUnionCount"])
        self.assertIn("Exploratory", result["claimBoundary"])

    def test_cheapest_first_router_escalates_truth_kernel_security_changes(self) -> None:
        lanes = ROUTER.route({
            "changedPaths": ["ArchLucid.Application/InfraEvidence/SecureNowArchitect/PrivilegePathEnumerator.cs"],
            "riskTags": ["security", "truth-kernel"],
        })
        names = [row["lane"] for row in lanes]
        self.assertEqual(names[:2], ["compile-static", "targeted-unit"])
        self.assertIn("reference-oracle", names)
        self.assertIn("mutation", names)
        self.assertEqual([row["costOrder"] for row in lanes], sorted(row["costOrder"] for row in lanes))

    def test_unsupported_certainty_audit_flags_inference_with_confirmed_language(self) -> None:
        issues = CERTAINTY.audit({
            "findings": [
                {
                    "findingId": "f1",
                    "title": "Confirmed compromise",
                    "rationale": "Observed attacker movement.",
                    "evidenceRefs": ["snapshot:x"],
                    "properties": {"provenanceKind": "AiInference"},
                }
            ]
        })
        codes = {row["code"] for row in issues}
        self.assertIn("STRONG_LANGUAGE_ON_INFERENCE", codes)

    def test_regression_ledger_requires_durable_memory_for_confirmed_defect(self) -> None:
        row = {"defectId": "d1", "confirmed": True, "regressionDisposition": "metamorphic-test"}
        with TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertTrue(REGRESSION.validate([row], artifact_root=root))
            self.assertTrue(REGRESSION.validate(
                [dict(row, regressionArtifact="ArchLucid.Tests/FooTests.cs")], artifact_root=root,
            ))
            raw = json.dumps({
                "schemaVersion": 1, "defectId": "d1", "regressionDisposition": "metamorphic-test",
                "intendedBehavior": "Ordering is invariant under reversed input.",
                "testIdentity": "FooTests.OrderingIsInvariant",
                "expectedFailureReason": "ordering changed",
                "baseline": {"revision": "a" * 40, "testIdentity": "FooTests.OrderingIsInvariant",
                             "executedCount": 1, "exitCode": 1, "outcome": "assertion-failed",
                             "failureReason": "ordering changed"},
                "corrected": {"revision": "b" * 40, "testIdentity": "FooTests.OrderingIsInvariant",
                              "executedCount": 1, "exitCode": 0, "outcome": "passed"},
            }).encode()
            (root / "proof.json").write_bytes(raw)
            self.assertEqual(REGRESSION.validate([
                dict(row, regressionArtifact="proof.json", regressionArtifactSha256=hashlib.sha256(raw).hexdigest())
            ], artifact_root=root), [])


if __name__ == "__main__":
    unittest.main()
