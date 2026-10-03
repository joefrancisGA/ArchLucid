#!/usr/bin/env python3

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "product_line",
    ROOT / "scripts/agent/al_bug_hunt_product_line.py",
)
product_line = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(product_line)


def test_securenow_path_markers():
    assert product_line.classify_paths(("archlucid-ui/src/lib/product-line/securenow-governance-findings-copy.ts",)) == "securenow"
    assert product_line.classify_paths(("ArchLucid.Host.Composition/Startup/Modules/InfraEvidenceCompositionModule.cs",)) == "securenow"
    assert product_line.classify_paths(("archlucid-ui/src/lib/infra-evidence/infra-evidence-hub-api.ts",)) == "securenow"


def test_archlucid_shared_default():
    assert product_line.classify_paths(("ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs",)) == "archlucid-shared"


def test_zone_override():
    assert product_line.classify_hunt("ui-infra-resource-hub", paths=()) == "securenow"
    assert product_line.classify_hunt("securenow-question-queue", paths=()) == "securenow"
    assert product_line.classify_hunt("infra-evidence-diagrams", paths=()) == "securenow"


def test_explicit_product_line():
    assert product_line.classify_hunt("any-zone", product_line="securenow") == "securenow"
    assert product_line.classify_hunt("any-zone", product_line="archlucid-shared") == "archlucid-shared"


def test_hunt_paths_override_mega_zone():
    assert (
        product_line.classify_hunt(
            "ui-operator-routes",
            paths=("archlucid-ui/src/app/(operator)/security/remediation-factory/RemediationFactoryClient.tsx",),
        )
        == "securenow"
    )
    assert product_line.classify_hunt("ui-operator-routes", paths=()) == "archlucid-shared"
