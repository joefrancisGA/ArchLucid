"""TB-285 / TB-286 / TB-287 DTO boundary drift guards (batch 5DW-trust-paid-p1a)."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]

FORBIDDEN_PROPERTIES_FILE = REPO_ROOT / "scripts" / "ci" / "data" / "buyer_dto_forbidden_properties.txt"
REGISTRY_FILE = REPO_ROOT / "ArchLucid.Api.Tests" / "Contracts" / "ProofSurfaceContractRegistry.cs"
MVC_EXTENSIONS = REPO_ROOT / "ArchLucid.Api" / "Startup" / "MvcExtensions.cs"
BUYER_SNAPSHOT = (
    REPO_ROOT / "ArchLucid.Api.Tests" / "Contracts" / "buyer-contract.openapi.snapshot.json"
)


def _read_forbidden_properties() -> list[str]:
    lines: list[str] = []
    for raw in FORBIDDEN_PROPERTIES_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        lines.append(line)
    return lines


class TestDtoBoundaryBatch(unittest.TestCase):
    def test_forbidden_properties_file_matches_registry(self) -> None:
        self.assertTrue(FORBIDDEN_PROPERTIES_FILE.is_file(), f"Missing {FORBIDDEN_PROPERTIES_FILE}")
        registry = REGISTRY_FILE.read_text(encoding="utf-8")
        for name in _read_forbidden_properties():
            self.assertIn(f'"{name}"', registry, f"Registry must list forbidden property {name}")

    def test_proof_surface_forbidden_drift_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Contracts" / "ProofSurfaceForbiddenPropertyDriftTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_openapi_audience_transformer_registered(self) -> None:
        text = MVC_EXTENSIONS.read_text(encoding="utf-8")
        self.assertIn("MicrosoftOpenApiAudienceOperationTransformer", text)
        self.assertIn("MicrosoftOpenApiAudienceSchemaDocumentTransformer", text)

    def test_buyer_openapi_snapshot_exists_without_internal_paths(self) -> None:
        self.assertTrue(BUYER_SNAPSHOT.is_file(), f"Missing {BUYER_SNAPSHOT}")
        text = BUYER_SNAPSHOT.read_text(encoding="utf-8")
        self.assertNotIn("/v1/internal/", text)

    def test_forensics_partition_integration_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "Security" / "ForensicsTracePartitionIntegrationTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")
        body = path.read_text(encoding="utf-8")
        self.assertIn("tool-invocation-forensics", body)
        self.assertIn("traces/forensics", body)

    def test_openapi_buyer_contract_snapshot_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Api.Tests" / "OpenApiBuyerContractSnapshotTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_buyer_facing_dto_boundary_architecture_tests_exist(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Architecture.Tests"
            / "BuyerFacingDtoBoundaryArchitectureTests.cs"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("Buyer_facing_controller_actions_do_not_declare_ArchLucid_Persistence_return_types", text)


if __name__ == "__main__":
    unittest.main()
