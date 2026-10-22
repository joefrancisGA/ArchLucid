"""TB-012 Wave C architecture drift guards (Batch 5H)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestInvariantWaveCBatch(unittest.TestCase):
    def test_inv_010_central_http_client_architecture_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "CentralHttpClientArchitectureTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_014_no_mutable_static_field_architecture_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "NoMutableStaticFieldArchitectureTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_011_append_only_repository_shape_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "AppendOnlyRepositoryInterfaceShapeTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_015_inbound_webhook_pipeline_order_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "InboundWebhookPipelineOrderArchitectureTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_003_audit_path_classification_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "AuditPathClassificationArchitectureTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_007_injected_time_architecture_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "InjectedTimeArchitectureTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_008_cancellation_forwarding_architecture_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "CancellationForwardingArchitectureTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")

    def test_inv_009_mutating_http_idempotency_architecture_tests_exist(self) -> None:
        path = REPO_ROOT / "ArchLucid.Architecture.Tests" / "MutatingHttpIdempotencyArchitectureTests.cs"
        self.assertTrue(path.is_file(), f"Missing {path}")


if __name__ == "__main__":
    unittest.main()
