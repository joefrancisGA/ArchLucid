"""TB-037 / TB-055 traceability drift guards (Batch 5CD)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatch5CD(unittest.TestCase):
    def test_tb_037_provenance_snapshot_materialization(self) -> None:
        access = REPO_ROOT / "ArchLucid.Application" / "Provenance" / "ProvenanceGraphAccessService.cs"
        orchestrator = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "Orchestration"
            / "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"
        )
        enqueuer = (
            REPO_ROOT
            / "ArchLucid.Application"
            / "Runs"
            / "Orchestration"
            / "PostCommitProjectionEnqueuer.cs"
        )
        access_text = access.read_text(encoding="utf-8")
        orchestrator_text = orchestrator.read_text(encoding="utf-8")
        enqueuer_text = enqueuer.read_text(encoding="utf-8")
        self.assertIn("TryMaterializeSnapshotAsync", access_text)
        self.assertIn("RecordProvenanceSnapshotWrite", access_text)
        self.assertIn("PostCommitProjectionEnqueuer", orchestrator_text)
        self.assertIn("ProvenanceSnapshotMaterialization", enqueuer_text)

    def test_tb_055_reasoning_trace_on_findings(self) -> None:
        factory = (
            REPO_ROOT
            / "ArchLucid.Decisioning"
            / "Findings"
            / "Factories"
            / "FindingFactory.cs"
        )
        bounds = REPO_ROOT / "ArchLucid.Decisioning" / "Findings" / "ReasoningTraceBounds.cs"
        migration = REPO_ROOT / "ArchLucid.Persistence" / "Migrations" / "227_FindingRecords_ReasoningTrace.sql"
        factory_text = factory.read_text(encoding="utf-8")
        self.assertIn("ReasoningTraceBounds.Normalize", factory_text)
        self.assertIn("ReasoningTraceDigestSha256", factory_text)
        self.assertIn("ReasoningTrace", bounds.read_text(encoding="utf-8"))
        self.assertIn("ReasoningTrace", migration.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
