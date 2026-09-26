using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityEvidenceCutPointRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityEvidenceCutPointRepository
{
    public async Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListBySnapshotAsync(
        ProjectSnapshotScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        const string sql = """
                           SELECT c.CutPointId, c.TenantId, c.SnapshotId, c.RuleVersion, c.CutKind, c.CutKey,
                                  c.FromNodeId, c.ToNodeId, c.EdgeType, c.PathsCollapsedCount, c.OperationalCostClass,
                                  c.LeverageScore, c.CutOrder, c.EvidenceReferencesJson, c.CollapsedPathIdsJson,
                                  c.SuggestedPatternKey, c.CloudResourceId, c.ResourceType, c.ComputedUtc
                           FROM dbo.SecurityEvidenceCutPoints c
                           WHERE c.TenantId = @TenantId
                             AND c.SnapshotId = @SnapshotId
                             AND EXISTS (
                                 SELECT 1
                                 FROM dbo.SecurityEvidencePaths p
                                 WHERE p.TenantId = c.TenantId
                                   AND p.SnapshotId = c.SnapshotId
                                   AND p.WorkspaceId = @WorkspaceId
                                   AND p.ProjectId = @ProjectId
                             )
                           ORDER BY c.CutOrder, c.CutPointId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<CutPointRow> rows = await conn.QueryAsync<CutPointRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    scope.SnapshotId,
                },
                cancellationToken: cancellationToken));

        return rows.Select(MapCutPoint).ToList();
    }

    public async Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT c.CutPointId, c.TenantId, c.SnapshotId, c.RuleVersion, c.CutKind, c.CutKey,
                                  c.FromNodeId, c.ToNodeId, c.EdgeType, c.PathsCollapsedCount, c.OperationalCostClass,
                                  c.LeverageScore, c.CutOrder, c.EvidenceReferencesJson, c.CollapsedPathIdsJson,
                                  c.SuggestedPatternKey, c.CloudResourceId, c.ResourceType, c.ComputedUtc
                           FROM dbo.SecurityEvidenceCutPoints c
                           WHERE c.TenantId = @TenantId
                             AND c.CollapsedPathIdsJson LIKE @PathIdLike
                           ORDER BY c.LeverageScore DESC, c.CutOrder, c.CutPointId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<CutPointRow> rows = await conn.QueryAsync<CutPointRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    PathIdLike = $"%{pathId:D}%",
                },
                cancellationToken: cancellationToken));

        return rows
            .Select(MapCutPoint)
            .Where(record => CollapsedPathIdsContains(record, pathId))
            .ToList();
    }

    public async Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListByPathIdInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT c.CutPointId, c.TenantId, c.SnapshotId, c.RuleVersion, c.CutKind, c.CutKey,
                                  c.FromNodeId, c.ToNodeId, c.EdgeType, c.PathsCollapsedCount, c.OperationalCostClass,
                                  c.LeverageScore, c.CutOrder, c.EvidenceReferencesJson, c.CollapsedPathIdsJson,
                                  c.SuggestedPatternKey, c.CloudResourceId, c.ResourceType, c.ComputedUtc
                           FROM dbo.SecurityEvidenceCutPoints c
                           INNER JOIN dbo.SecurityEvidencePaths p
                               ON p.TenantId = c.TenantId AND p.SnapshotId = c.SnapshotId
                           WHERE c.TenantId = @TenantId
                             AND p.WorkspaceId = @WorkspaceId
                             AND p.ProjectId = @ProjectId
                             AND c.CollapsedPathIdsJson LIKE @PathIdLike
                             AND EXISTS (
                                 SELECT 1
                                 FROM dbo.SecurityEvidencePaths targetPath
                                 WHERE targetPath.TenantId = @TenantId
                                   AND targetPath.WorkspaceId = @WorkspaceId
                                   AND targetPath.ProjectId = @ProjectId
                                   AND targetPath.PathId = @PathId
                             )
                           ORDER BY c.LeverageScore DESC, c.CutOrder, c.CutPointId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<CutPointRow> rows = await conn.QueryAsync<CutPointRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    PathId = pathId,
                    PathIdLike = $"%{pathId:D}%",
                },
                cancellationToken: cancellationToken));

        return rows
            .Select(MapCutPoint)
            .Where(record => CollapsedPathIdsContains(record, pathId))
            .DistinctBy(record => record.CutPointId)
            .ToList();
    }

    public async Task ReplaceCutPointsForSnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(cutPoints);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction tx = conn.BeginTransaction();

        const string deleteSql = """
                                 DELETE FROM dbo.SecurityEvidenceCutPoints
                                 WHERE TenantId = @TenantId AND SnapshotId = @SnapshotId;
                                 """;

        await conn.ExecuteAsync(
            new CommandDefinition(
                deleteSql,
                new { TenantId = tenantId, SnapshotId = snapshotId },
                transaction: tx,
                cancellationToken: cancellationToken));

        if (cutPoints.Count == 0)
        {
            tx.Commit();
            return;
        }

        const string insertSql = """
                                 INSERT INTO dbo.SecurityEvidenceCutPoints
                                 (
                                     CutPointId, TenantId, SnapshotId, RuleVersion, CutKind, CutKey,
                                     FromNodeId, ToNodeId, EdgeType, PathsCollapsedCount, OperationalCostClass,
                                     LeverageScore, CutOrder, EvidenceReferencesJson, CollapsedPathIdsJson,
                                     SuggestedPatternKey, CloudResourceId, ResourceType, ComputedUtc
                                 )
                                 VALUES
                                 (
                                     @CutPointId, @TenantId, @SnapshotId, @RuleVersion, @CutKind, @CutKey,
                                     @FromNodeId, @ToNodeId, @EdgeType, @PathsCollapsedCount, @OperationalCostClass,
                                     @LeverageScore, @CutOrder, @EvidenceReferencesJson, @CollapsedPathIdsJson,
                                     @SuggestedPatternKey, @CloudResourceId, @ResourceType, @ComputedUtc
                                 );
                                 """;

        foreach (SecurityEvidenceCutPointRecord cutPoint in cutPoints)
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertSql,
                    new
                    {
                        cutPoint.CutPointId,
                        cutPoint.TenantId,
                        cutPoint.SnapshotId,
                        cutPoint.RuleVersion,
                        CutKind = (int)cutPoint.CutKind,
                        cutPoint.CutKey,
                        cutPoint.FromNodeId,
                        cutPoint.ToNodeId,
                        cutPoint.EdgeType,
                        cutPoint.PathsCollapsedCount,
                        OperationalCostClass = (int)cutPoint.OperationalCostClass,
                        cutPoint.LeverageScore,
                        cutPoint.CutOrder,
                        cutPoint.EvidenceReferencesJson,
                        cutPoint.CollapsedPathIdsJson,
                        cutPoint.SuggestedPatternKey,
                        cutPoint.CloudResourceId,
                        cutPoint.ResourceType,
                        cutPoint.ComputedUtc,
                    },
                    transaction: tx,
                    cancellationToken: cancellationToken));
        }

        tx.Commit();
    }

    public async Task ReplaceCutPointsForSnapshotInScopeAsync(
        ProjectScopeKey scope,
        Guid snapshotId,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(cutPoints);

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using System.Data.IDbTransaction tx = conn.BeginTransaction();

        const string scopeExistsSql = """
                                      SELECT COUNT(1)
                                      FROM dbo.SecurityEvidencePaths
                                      WHERE TenantId = @TenantId
                                        AND WorkspaceId = @WorkspaceId
                                        AND ProjectId = @ProjectId
                                        AND SnapshotId = @SnapshotId;
                                      """;

        int scopedPathCount = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                scopeExistsSql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, SnapshotId = snapshotId },
                transaction: tx,
                cancellationToken: cancellationToken));

        if (scopedPathCount == 0 && cutPoints.Count > 0)
            throw new InvalidOperationException("Scoped cut-point replacement target snapshot has no paths in the project.");

        const string deleteSql = """
                                 DELETE c
                                 FROM dbo.SecurityEvidenceCutPoints c
                                 WHERE c.TenantId = @TenantId
                                   AND c.SnapshotId = @SnapshotId
                                   AND EXISTS (
                                       SELECT 1
                                       FROM dbo.SecurityEvidencePaths p
                                       WHERE p.TenantId = c.TenantId
                                         AND p.SnapshotId = c.SnapshotId
                                         AND p.WorkspaceId = @WorkspaceId
                                         AND p.ProjectId = @ProjectId
                                   );
                                 """;

        await conn.ExecuteAsync(
            new CommandDefinition(
                deleteSql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, SnapshotId = snapshotId },
                transaction: tx,
                cancellationToken: cancellationToken));

        const string insertSql = """
                                 INSERT INTO dbo.SecurityEvidenceCutPoints
                                 (
                                     CutPointId, TenantId, SnapshotId, RuleVersion, CutKind, CutKey,
                                     FromNodeId, ToNodeId, EdgeType, PathsCollapsedCount, OperationalCostClass,
                                     LeverageScore, CutOrder, EvidenceReferencesJson, CollapsedPathIdsJson,
                                     SuggestedPatternKey, CloudResourceId, ResourceType, ComputedUtc
                                 )
                                 VALUES
                                 (
                                     @CutPointId, @TenantId, @SnapshotId, @RuleVersion, @CutKind, @CutKey,
                                     @FromNodeId, @ToNodeId, @EdgeType, @PathsCollapsedCount, @OperationalCostClass,
                                     @LeverageScore, @CutOrder, @EvidenceReferencesJson, @CollapsedPathIdsJson,
                                     @SuggestedPatternKey, @CloudResourceId, @ResourceType, @ComputedUtc
                                 );
                                 """;

        foreach (SecurityEvidenceCutPointRecord cutPoint in cutPoints)
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertSql,
                    new
                    {
                        cutPoint.CutPointId,
                        TenantId = scope.TenantId,
                        SnapshotId = snapshotId,
                        cutPoint.RuleVersion,
                        CutKind = (int)cutPoint.CutKind,
                        cutPoint.CutKey,
                        cutPoint.FromNodeId,
                        cutPoint.ToNodeId,
                        cutPoint.EdgeType,
                        cutPoint.PathsCollapsedCount,
                        OperationalCostClass = (int)cutPoint.OperationalCostClass,
                        cutPoint.LeverageScore,
                        cutPoint.CutOrder,
                        cutPoint.EvidenceReferencesJson,
                        cutPoint.CollapsedPathIdsJson,
                        cutPoint.SuggestedPatternKey,
                        cutPoint.CloudResourceId,
                        cutPoint.ResourceType,
                        cutPoint.ComputedUtc,
                    },
                    transaction: tx,
                    cancellationToken: cancellationToken));
        }

        tx.Commit();
    }

    private static bool CollapsedPathIdsContains(SecurityEvidenceCutPointRecord record, Guid pathId)
    {
        try
        {
            List<Guid>? pathIds = System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(record.CollapsedPathIdsJson);

            return pathIds is not null && pathIds.Contains(pathId);
        }
        catch (System.Text.Json.JsonException)
        {
            return false;
        }
    }

    private static SecurityEvidenceCutPointRecord MapCutPoint(CutPointRow row) =>
        new()
        {
            CutPointId = row.CutPointId,
            TenantId = row.TenantId,
            SnapshotId = row.SnapshotId,
            RuleVersion = row.RuleVersion,
            CutKind = (SecurityEvidenceCutPointKind)row.CutKind,
            CutKey = row.CutKey,
            FromNodeId = row.FromNodeId,
            ToNodeId = row.ToNodeId,
            EdgeType = row.EdgeType,
            PathsCollapsedCount = row.PathsCollapsedCount,
            OperationalCostClass = (SecurityEvidenceCutPointOperationalCostClass)row.OperationalCostClass,
            LeverageScore = row.LeverageScore,
            CutOrder = row.CutOrder,
            EvidenceReferencesJson = row.EvidenceReferencesJson,
            CollapsedPathIdsJson = row.CollapsedPathIdsJson,
            SuggestedPatternKey = row.SuggestedPatternKey,
            CloudResourceId = row.CloudResourceId,
            ResourceType = row.ResourceType,
            ComputedUtc = row.ComputedUtc,
        };

    private sealed class CutPointRow
    {
        public Guid CutPointId
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

        public int CutKind
        {
            get;
            init;
        }

        public string CutKey
        {
            get;
            init;
        } = string.Empty;

        public string? FromNodeId
        {
            get;
            init;
        }

        public string? ToNodeId
        {
            get;
            init;
        }

        public string? EdgeType
        {
            get;
            init;
        }

        public int PathsCollapsedCount
        {
            get;
            init;
        }

        public int OperationalCostClass
        {
            get;
            init;
        }

        public decimal LeverageScore
        {
            get;
            init;
        }

        public int CutOrder
        {
            get;
            init;
        }

        public string EvidenceReferencesJson
        {
            get;
            init;
        } = string.Empty;

        public string CollapsedPathIdsJson
        {
            get;
            init;
        } = string.Empty;

        public string? SuggestedPatternKey
        {
            get;
            init;
        }

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public string? ResourceType
        {
            get;
            init;
        }

        public DateTime ComputedUtc
        {
            get;
            init;
        }
    }
}
