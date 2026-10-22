"""TB-052 rule audit trace snapshot IDs drift guards (Batch 5BY)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatch5BY(unittest.TestCase):
    def test_tb_052_rule_audit_trace_payload_fields(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Contracts"
            / "Persistence"
            / "DecisionTraces"
            / "RuleAuditTracePayload.cs"
        )
        text = path.read_text(encoding="utf-8")
        self.assertIn("ContextSnapshotId", text)
        self.assertIn("GraphSnapshotId", text)
        self.assertIn("FindingsSnapshotId", text)
        self.assertIn("PromptRefs", text)

    def test_tb_052_engine_populates_snapshot_ids(self) -> None:
        path = REPO_ROOT / "ArchLucid.Decisioning" / "Services" / "RuleBasedDecisionEngine.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("ContextSnapshotId", text)
        self.assertIn("RuleAuditTracePromptRefAggregator", text)


if __name__ == "__main__":
    unittest.main()
