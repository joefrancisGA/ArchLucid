"""Source guard for the SecureNow ranked-page scoped index.

Not a substitute for SQL Server execution-plan testing.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
MIGRATION = ROOT / "ArchLucid.Persistence/Migrations/9999_SecureNowRankedPathOrderedIndex.sql"
QUERY = ROOT / "ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathRankRepository.cs"

class RankedPathIndexContract(unittest.TestCase):
    def test_scoped_index_keys_match_join_predicates(self):
        migration = MIGRATION.read_text(encoding="utf-8")
        query = QUERY.read_text(encoding="utf-8")
        self.assertIn("(TenantId, WorkspaceId, ProjectId, SnapshotId, PathId)", migration)
        self.assertIn("NOT EXISTS", migration)
        for predicate in ("p.TenantId = r.TenantId", "p.WorkspaceId = @WorkspaceId",
                          "p.ProjectId = @ProjectId", "p.SnapshotId = r.SnapshotId"):
            self.assertIn(predicate, query)
        self.assertNotIn("DROP INDEX", migration)

if __name__ == "__main__":
    unittest.main()
