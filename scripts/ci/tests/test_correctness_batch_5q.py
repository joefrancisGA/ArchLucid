"""TB-204 rule audit action differentiation drift guards (Batch 5Q)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCorrectnessBatch5Q(unittest.TestCase):
    def test_tb_204_payload_fields_exist(self) -> None:
        for relative in (
            "ArchLucid.Decisioning/DecisionTraces/RuleAuditTracePayload.cs",
            "ArchLucid.Contracts/Persistence/DecisionTraces/RuleAuditTracePayload.cs",
        ):
            path = REPO_ROOT / relative
            text = path.read_text(encoding="utf-8")
            self.assertIn("RequiredFindingIds", text)
            self.assertIn("AllowedFindingIds", text)
            self.assertIn("PreferredFindingIds", text)

    def test_tb_204_engine_populates_action_sets(self) -> None:
        path = REPO_ROOT / "ArchLucid.Decisioning" / "Services" / "RuleBasedDecisionEngine.cs"
        text = path.read_text(encoding="utf-8")
        self.assertIn("audit.RequiredFindingIds.Add", text)
        self.assertIn("audit.AllowedFindingIds.Add", text)
        self.assertIn("audit.PreferredFindingIds.Add", text)

    def test_tb_204_action_differentiation_tests_exist(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Decisioning.Tests"
            / "RuleBasedDecisionEngineActionDifferentiationTests.cs"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("DecideAsync_populates_action_specific_finding_id_sets", text)

    def test_tb_204_sql_migration_exists(self) -> None:
        path = (
            REPO_ROOT
            / "ArchLucid.Persistence"
            / "Migrations"
            / "238_DecisioningTraces_RuleActionFindingIds.sql"
        )
        self.assertTrue(path.is_file(), f"Missing {path}")
        text = path.read_text(encoding="utf-8")
        self.assertIn("RequiredFindingIdsJson", text)


if __name__ == "__main__":
    unittest.main()
