using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlSecurityEvidencePathRepository
{
    public async Task<IReadOnlyList<SecurityEvidencePathWithHops>> ListWithHopsBySnapshotAsync(
        ProjectSnapshotScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        const string sql = """
            SELECT PathId, TenantId, WorkspaceId, ProjectId, SnapshotId, PathKind, PathConfidenceBand,
                CanonicalHopHashSha256, WeakestHopOrdinal, WeakestHopReason, CrownJewelAssertionId, CreatedUtc, UpdatedUtc
            FROM dbo.SecurityEvidencePaths
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
              AND SnapshotId = @SnapshotId ORDER BY CreatedUtc, PathId;

            SELECT h.HopRowId, h.PathId, h.TenantId, h.HopOrdinal, h.FromNodeId, h.ToNodeId, h.EdgeType,
                h.ProvenanceKind, h.HopConfidenceBand, h.InferenceSource, h.EvidenceReference, h.CloudResourceId
            FROM dbo.SecurityEvidencePathHops h
            INNER JOIN dbo.SecurityEvidencePaths p ON p.TenantId = h.TenantId AND p.PathId = h.PathId
            WHERE p.TenantId = @TenantId AND p.WorkspaceId = @WorkspaceId AND p.ProjectId = @ProjectId
              AND p.SnapshotId = @SnapshotId ORDER BY h.PathId, h.HopOrdinal;
            """;
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        using SqlMapper.GridReader reader = await conn.QueryMultipleAsync(new CommandDefinition(sql,
            new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, scope.SnapshotId },
            commandTimeout: DapperCommandTimeoutSeconds.Report, cancellationToken: cancellationToken));
        List<PathRow> paths = (await reader.ReadAsync<PathRow>()).ToList();
        ILookup<Guid, SecurityEvidencePathHopRecord> hops = (await reader.ReadAsync<HopRow>())
            .Select(MapHop).ToLookup(hop => hop.PathId);
        return paths.Select(path => new SecurityEvidencePathWithHops(MapPath(path), hops[path.PathId].ToList())).ToList();
    }

    public async Task<IReadOnlyList<SecurityEvidencePathInsertResult>> InsertBatchIfNotExistsAsync(
        IReadOnlyList<SecurityEvidencePathWithHops> paths,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(paths);
        if (paths.Count == 0)
            return [];

        List<SecurityEvidencePathGuard.ValidatedPath> validated = paths
            .Select(path => SecurityEvidencePathGuard.ValidateAndMaterialize(path.Path, path.Hops)).ToList();
        foreach (SecurityEvidencePathGuard.ValidatedPath path in validated)
            if (path.Hops.Any(hop => hop.TenantId != path.Path.TenantId))
                throw new InvalidOperationException("Path hops must belong to the path tenant.");

        // Deduplicate before staging so the INSERT cannot collide with itself.
        List<SecurityEvidencePathGuard.ValidatedPath> distinct = validated.DistinctBy(path => BatchKey(path.Path)).ToList();
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        if (conn is not SqlConnection sqlConn)
            throw new InvalidOperationException("Path batch insert requires SqlConnection.");
        using SqlTransaction tx = sqlConn.BeginTransaction();
        await CreatePathStagingTablesAsync(sqlConn, tx, cancellationToken);
        await SqlBufferedBulkCopy.WriteAsync(sqlConn, tx, "#PathHeaders", distinct.Select(item => new
        {
            item.Path.PathId, item.Path.TenantId, item.Path.WorkspaceId, item.Path.ProjectId, item.Path.SnapshotId,
            PathKind = (int)item.Path.PathKind, PathConfidenceBand = (int)item.Path.PathConfidenceBand,
            item.Path.CanonicalHopHashSha256, item.Path.WeakestHopOrdinal, item.Path.WeakestHopReason,
            item.Path.CrownJewelAssertionId, item.Path.CreatedUtc, item.Path.UpdatedUtc,
        }), cancellationToken);
        await SqlBufferedBulkCopy.WriteAsync(sqlConn, tx, "#PathHops", distinct.SelectMany(item => item.Hops.Select(hop => new
        {
            hop.HopRowId, item.Path.PathId, item.Path.TenantId, hop.HopOrdinal, hop.FromNodeId, hop.ToNodeId,
            hop.EdgeType, ProvenanceKind = (int)hop.ProvenanceKind, HopConfidenceBand = (int)hop.HopConfidenceBand,
            hop.InferenceSource, hop.EvidenceReference, hop.CloudResourceId,
        })), cancellationToken);

        const string insertSql = """
            INSERT INTO dbo.SecurityEvidencePaths
                (PathId, TenantId, WorkspaceId, ProjectId, SnapshotId, PathKind, PathConfidenceBand,
                 CanonicalHopHashSha256, WeakestHopOrdinal, WeakestHopReason, CrownJewelAssertionId, CreatedUtc, UpdatedUtc)
            OUTPUT inserted.PathId INTO #CreatedPaths
            SELECT s.PathId, s.TenantId, s.WorkspaceId, s.ProjectId, s.SnapshotId, s.PathKind, s.PathConfidenceBand,
                s.CanonicalHopHashSha256, s.WeakestHopOrdinal, s.WeakestHopReason, s.CrownJewelAssertionId, s.CreatedUtc, s.UpdatedUtc
            FROM #PathHeaders s
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.SecurityEvidencePaths p WITH (UPDLOCK, HOLDLOCK)
                WHERE p.TenantId = s.TenantId AND p.SnapshotId = s.SnapshotId
                  AND p.CanonicalHopHashSha256 = s.CanonicalHopHashSha256);

            INSERT INTO dbo.SecurityEvidencePathHops
                (HopRowId, PathId, TenantId, HopOrdinal, FromNodeId, ToNodeId, EdgeType,
                 ProvenanceKind, HopConfidenceBand, InferenceSource, EvidenceReference, CloudResourceId)
            SELECT h.HopRowId, h.PathId, h.TenantId, h.HopOrdinal, h.FromNodeId, h.ToNodeId, h.EdgeType,
                h.ProvenanceKind, h.HopConfidenceBand, h.InferenceSource, h.EvidenceReference, h.CloudResourceId
            FROM #PathHops h INNER JOIN #CreatedPaths c ON c.PathId = h.PathId;

            SELECT p.PathId, p.TenantId, p.WorkspaceId, p.ProjectId, p.SnapshotId, p.CanonicalHopHashSha256,
                CAST(CASE WHEN c.PathId IS NULL THEN 0 ELSE 1 END AS bit) AS Created
            FROM #PathHeaders s
            INNER JOIN dbo.SecurityEvidencePaths p ON p.TenantId = s.TenantId AND p.SnapshotId = s.SnapshotId
                AND p.CanonicalHopHashSha256 = s.CanonicalHopHashSha256
            LEFT JOIN #CreatedPaths c ON c.PathId = p.PathId;
            """;
        Dictionary<(Guid, Guid, string), BatchInsertRow> persisted = (await sqlConn.QueryAsync<BatchInsertRow>(
            new CommandDefinition(insertSql, transaction: tx, commandTimeout: DapperCommandTimeoutSeconds.Report,
                cancellationToken: cancellationToken))).ToDictionary(row =>
                    (row.TenantId, row.SnapshotId, Convert.ToHexString(row.CanonicalHopHashSha256)));

        HashSet<(Guid, Guid, string)> seen = [];
        List<SecurityEvidencePathInsertResult> result = [];
        foreach (SecurityEvidencePathGuard.ValidatedPath item in validated)
        {
            var key = BatchKey(item.Path);
            BatchInsertRow row = persisted[key];
            if (row.WorkspaceId != item.Path.WorkspaceId || row.ProjectId != item.Path.ProjectId)
                throw new InvalidOperationException("Existing path does not belong to the requested project scope.");
            result.Add(new() { PathId = row.PathId, Created = seen.Add(key) && row.Created });
        }
        tx.Commit();
        return result;
    }

    private static (Guid, Guid, string) BatchKey(SecurityEvidencePathRecord path) =>
        (path.TenantId, path.SnapshotId, Convert.ToHexString(path.CanonicalHopHashSha256));

    private sealed class BatchInsertRow
    {
        public Guid PathId { get; init; }
        public Guid TenantId { get; init; }
        public Guid WorkspaceId { get; init; }
        public Guid ProjectId { get; init; }
        public Guid SnapshotId { get; init; }
        public byte[] CanonicalHopHashSha256 { get; init; } = [];
        public bool Created { get; init; }
    }

    // Parameters would execute SELECT INTO inside sp_executesql and drop the temp tables on return.
    [TenantScopeExempt(TenantScopeExemptReason.Operational,
        "SELECT TOP (0) copies column definitions only into session-local staging tables; no tenant rows are read. All data operations retain scoped joins.")]
    private static Task CreatePathStagingTablesAsync(
        SqlConnection connection, SqlTransaction transaction, CancellationToken cancellationToken)
    {
        const string stageSql = """
            SELECT TOP (0) PathId, TenantId, WorkspaceId, ProjectId, SnapshotId, PathKind, PathConfidenceBand,
                CanonicalHopHashSha256, WeakestHopOrdinal, WeakestHopReason, CrownJewelAssertionId, CreatedUtc, UpdatedUtc
            INTO #PathHeaders FROM dbo.SecurityEvidencePaths;
            SELECT TOP (0) HopRowId, PathId, TenantId, HopOrdinal, FromNodeId, ToNodeId, EdgeType,
                ProvenanceKind, HopConfidenceBand, InferenceSource, EvidenceReference, CloudResourceId
            INTO #PathHops FROM dbo.SecurityEvidencePathHops;
            CREATE TABLE #CreatedPaths (PathId uniqueidentifier NOT NULL PRIMARY KEY);
            """;
        return connection.ExecuteAsync(new CommandDefinition(stageSql, transaction: transaction,
            commandTimeout: DapperCommandTimeoutSeconds.Report, cancellationToken: cancellationToken));
    }
}
