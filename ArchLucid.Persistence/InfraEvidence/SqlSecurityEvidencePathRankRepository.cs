using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityEvidencePathRankRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityEvidencePathRankRepository
{
    public async Task<SecurityEvidencePathRankRecord?> TryGetRankAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT r.PathId, r.TenantId, r.SnapshotId, r.RuleVersion,
                                  r.TechnicalExposureScore, r.PrivilegeDepthScore, r.BlastRadiusScore,
                                  r.BusinessConsequenceScore, r.ConfidenceBandScore, r.CompositeSortScore,
                                  r.RankOrder, r.ExplanationSummary, r.BreakdownJson, r.ComputedUtc
                           FROM dbo.SecurityEvidencePathRanks r
                           INNER JOIN dbo.SecurityEvidencePaths p
                               ON p.TenantId = r.TenantId AND p.PathId = r.PathId
                           WHERE r.TenantId = @TenantId AND r.PathId = @PathId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        RankRow? row = await conn.QuerySingleOrDefaultAsync<RankRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, PathId = pathId }, cancellationToken: cancellationToken));

        return row is null ? null : MapRank(row);
    }

    public async Task<IReadOnlyList<SecurityEvidencePathRankRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT r.PathId, r.TenantId, r.SnapshotId, r.RuleVersion,
                                  r.TechnicalExposureScore, r.PrivilegeDepthScore, r.BlastRadiusScore,
                                  r.BusinessConsequenceScore, r.ConfidenceBandScore, r.CompositeSortScore,
                                  r.RankOrder, r.ExplanationSummary, r.BreakdownJson, r.ComputedUtc
                           FROM dbo.SecurityEvidencePathRanks r
                           INNER JOIN dbo.SecurityEvidencePaths p
                               ON p.TenantId = r.TenantId AND p.PathId = r.PathId
                           WHERE r.TenantId = @TenantId
                             AND r.SnapshotId = @SnapshotId
                             AND p.WorkspaceId = @WorkspaceId
                             AND p.ProjectId = @ProjectId
                           ORDER BY r.RankOrder, r.PathId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RankRow> rows = await conn.QueryAsync<RankRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    SnapshotId = snapshotId,
                },
                cancellationToken: cancellationToken));

        return rows.Select(MapRank).ToList();
    }

    public async Task ReplaceRanksForSnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<SecurityEvidencePathRankRecord> ranks,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(ranks);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction tx = conn.BeginTransaction();

        const string deleteSql = """
                                 DELETE r
                                 FROM dbo.SecurityEvidencePathRanks r
                                 WHERE r.TenantId = @TenantId AND r.SnapshotId = @SnapshotId;
                                 """;

        await conn.ExecuteAsync(
            new CommandDefinition(
                deleteSql,
                new { TenantId = tenantId, SnapshotId = snapshotId },
                transaction: tx,
                cancellationToken: cancellationToken));

        if (ranks.Count == 0)
        {
            tx.Commit();
            return;
        }

        const string insertSql = """
                                 INSERT INTO dbo.SecurityEvidencePathRanks
                                 (
                                     PathId, TenantId, SnapshotId, RuleVersion,
                                     TechnicalExposureScore, PrivilegeDepthScore, BlastRadiusScore,
                                     BusinessConsequenceScore, ConfidenceBandScore, CompositeSortScore,
                                     RankOrder, ExplanationSummary, BreakdownJson, ComputedUtc
                                 )
                                 VALUES
                                 (
                                     @PathId, @TenantId, @SnapshotId, @RuleVersion,
                                     @TechnicalExposureScore, @PrivilegeDepthScore, @BlastRadiusScore,
                                     @BusinessConsequenceScore, @ConfidenceBandScore, @CompositeSortScore,
                                     @RankOrder, @ExplanationSummary, @BreakdownJson, @ComputedUtc
                                 );
                                 """;

        foreach (SecurityEvidencePathRankRecord rank in ranks)
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertSql,
                    new
                    {
                        rank.PathId,
                        rank.TenantId,
                        rank.SnapshotId,
                        rank.RuleVersion,
                        rank.TechnicalExposureScore,
                        rank.PrivilegeDepthScore,
                        rank.BlastRadiusScore,
                        rank.BusinessConsequenceScore,
                        rank.ConfidenceBandScore,
                        rank.CompositeSortScore,
                        rank.RankOrder,
                        rank.ExplanationSummary,
                        rank.BreakdownJson,
                        rank.ComputedUtc,
                    },
                    transaction: tx,
                    cancellationToken: cancellationToken));
        }

        tx.Commit();
    }

    public async Task<(IReadOnlyList<SecurityEvidencePathRankRecord> Items, int TotalCount)> ListRankedPagedAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? snapshotId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        (int safePage, int safePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(safePage, safePageSize);

        const string whereClause = """
                                   WHERE r.TenantId = @TenantId
                                     AND p.WorkspaceId = @WorkspaceId
                                     AND p.ProjectId = @ProjectId
                                     AND (@SnapshotId IS NULL OR r.SnapshotId = @SnapshotId)
                                   """;

        string countSql = $"""
                           SELECT COUNT(1)
                           FROM dbo.SecurityEvidencePathRanks r
                           INNER JOIN dbo.SecurityEvidencePaths p
                               ON p.TenantId = r.TenantId AND p.PathId = r.PathId
                           {whereClause};
                           """;

        string listSql = $"""
                          SELECT r.PathId, r.TenantId, r.SnapshotId, r.RuleVersion,
                                 r.TechnicalExposureScore, r.PrivilegeDepthScore, r.BlastRadiusScore,
                                 r.BusinessConsequenceScore, r.ConfidenceBandScore, r.CompositeSortScore,
                                 r.RankOrder, r.ExplanationSummary, r.BreakdownJson, r.ComputedUtc
                          FROM dbo.SecurityEvidencePathRanks r
                          INNER JOIN dbo.SecurityEvidencePaths p
                              ON p.TenantId = r.TenantId AND p.PathId = r.PathId
                          {whereClause}
                          ORDER BY r.RankOrder, r.PathId
                          OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY;
                          """;

        object parameters = new
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            SnapshotId = snapshotId,
            Skip = skip,
            PageSize = safePageSize,
        };

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int totalCount = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));

        IEnumerable<RankRow> rows = await conn.QueryAsync<RankRow>(
            new CommandDefinition(listSql, parameters, cancellationToken: cancellationToken));

        IReadOnlyList<SecurityEvidencePathRankRecord> items = rows.Select(MapRank).ToList();

        return (items, totalCount);
    }

    public async Task<SecurityEvidencePathRankWeightsRecord?> TryGetWeightsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TenantId, WeightsJson, UpdatedByActorKey, UpdatedUtc
                           FROM dbo.SecurityEvidencePathRankWeights
                           WHERE TenantId = @TenantId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        WeightsRow? row = await conn.QuerySingleOrDefaultAsync<WeightsRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return row is null
            ? null
            : new SecurityEvidencePathRankWeightsRecord
            {
                TenantId = row.TenantId,
                WeightsJson = row.WeightsJson,
                UpdatedByActorKey = row.UpdatedByActorKey,
                UpdatedUtc = row.UpdatedUtc,
            };
    }

    public async Task UpsertWeightsAsync(
        SecurityEvidencePathRankWeightsRecord weights,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           MERGE dbo.SecurityEvidencePathRankWeights AS target
                           USING (SELECT @TenantId AS TenantId) AS source
                           ON target.TenantId = source.TenantId
                           WHEN MATCHED THEN
                               UPDATE SET WeightsJson = @WeightsJson,
                                          UpdatedByActorKey = @UpdatedByActorKey,
                                          UpdatedUtc = @UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (TenantId, WeightsJson, UpdatedByActorKey, UpdatedUtc)
                               VALUES (@TenantId, @WeightsJson, @UpdatedByActorKey, @UpdatedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    weights.TenantId,
                    weights.WeightsJson,
                    weights.UpdatedByActorKey,
                    weights.UpdatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    private static SecurityEvidencePathRankRecord MapRank(RankRow row) =>
        new()
        {
            PathId = row.PathId,
            TenantId = row.TenantId,
            SnapshotId = row.SnapshotId,
            RuleVersion = row.RuleVersion,
            TechnicalExposureScore = row.TechnicalExposureScore,
            PrivilegeDepthScore = row.PrivilegeDepthScore,
            BlastRadiusScore = row.BlastRadiusScore,
            BusinessConsequenceScore = row.BusinessConsequenceScore,
            ConfidenceBandScore = row.ConfidenceBandScore,
            CompositeSortScore = row.CompositeSortScore,
            RankOrder = row.RankOrder,
            ExplanationSummary = row.ExplanationSummary,
            BreakdownJson = row.BreakdownJson,
            ComputedUtc = row.ComputedUtc,
        };

    private sealed class RankRow
    {
        public Guid PathId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid SnapshotId
        {
            get;
            init;
        }

        public string RuleVersion
        {
            get;
            init;
        } = string.Empty;

        public decimal TechnicalExposureScore
        {
            get;
            init;
        }

        public decimal PrivilegeDepthScore
        {
            get;
            init;
        }

        public decimal BlastRadiusScore
        {
            get;
            init;
        }

        public decimal? BusinessConsequenceScore
        {
            get;
            init;
        }

        public decimal ConfidenceBandScore
        {
            get;
            init;
        }

        public decimal CompositeSortScore
        {
            get;
            init;
        }

        public int RankOrder
        {
            get;
            init;
        }

        public string ExplanationSummary
        {
            get;
            init;
        } = string.Empty;

        public string BreakdownJson
        {
            get;
            init;
        } = string.Empty;

        public DateTime ComputedUtc
        {
            get;
            init;
        }
    }

    private sealed class WeightsRow
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string WeightsJson
        {
            get;
            init;
        } = string.Empty;

        public string UpdatedByActorKey
        {
            get;
            init;
        } = string.Empty;

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }
}
