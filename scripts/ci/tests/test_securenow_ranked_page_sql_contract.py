"""Guard the SecureNow ranked-page scoped SQL round-trip contract.

Run: python -m unittest scripts/ci/tests/test_securenow_ranked_page_sql_contract.py
Structural guard only; integration tests must additionally validate SQL Server behavior.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathRankRepository.cs"


class RankedPageSqlContractTests(unittest.TestCase):
    def test_count_and_page_share_scoped_predicate_and_single_roundtrip(self):
        source = SOURCE.read_text(encoding="utf-8")
        method = source.split("public async Task<(IReadOnlyList<SecurityEvidencePathRankRecord> Items, int TotalCount)> ListRankedPagedAsync(", 1)[1].split("public async Task<SecurityEvidencePathRankWeightsRecord?>", 1)[0]
        for predicate in (
            "r.TenantId = @TenantId",
            "p.WorkspaceId = @WorkspaceId",
            "p.ProjectId = @ProjectId",
            "p.SnapshotId = r.SnapshotId",
            "(@SnapshotId IS NULL OR r.SnapshotId = @SnapshotId)",
        ):
            self.assertIn(predicate, method)
        self.assertEqual(2, method.count("{whereClause}"), "Both count and page must use exactly the same scope filter")
        self.assertIn("conn.QueryMultipleAsync(", method)
        self.assertIn("countSql + Environment.NewLine + listSql", method)
        self.assertIn("grid.ReadSingleAsync<int>()", method)
        self.assertIn("grid.ReadAsync<RankRow>()", method)
        self.assertIn("OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY", method)
        self.assertNotIn("conn.ExecuteScalarAsync<int>(", method)
        self.assertNotIn("conn.QueryAsync<RankRow>(", method)


if __name__ == "__main__":
    unittest.main()
