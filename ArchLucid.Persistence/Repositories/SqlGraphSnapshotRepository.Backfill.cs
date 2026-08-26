using System.Data;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.RelationalRead;

using Dapper;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlGraphSnapshotRepository
{
    /// <summary>
    ///     Inserts relational graph slices that are still empty while JSON columns contain data (idempotent per slice).
    /// </summary>
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Backfill scope lookup by GraphSnapshotId surrogate key before slice insert.")]
    internal static async Task BackfillRelationalSlicesAsync(
        GraphSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);

        Guid graphSnapshotId = snapshot.GraphSnapshotId;

        int nodesCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.GraphSnapshotNodes WHERE GraphSnapshotId = @GraphSnapshotId",
            new { GraphSnapshotId = graphSnapshotId },
            ct);

        int warningsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.GraphSnapshotWarnings WHERE GraphSnapshotId = @GraphSnapshotId",
            new { GraphSnapshotId = graphSnapshotId },
            ct);

        int edgesCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.GraphSnapshotEdges WHERE GraphSnapshotId = @GraphSnapshotId",
            new { GraphSnapshotId = graphSnapshotId },
            ct);

        int edgePropsCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.GraphSnapshotEdgeProperties WHERE GraphSnapshotId = @GraphSnapshotId",
            new { GraphSnapshotId = graphSnapshotId },
            ct);

        bool needsRelationalSlices = (nodesCount == 0 && snapshot.Nodes.Count > 0)
                                     || (warningsCount == 0 && snapshot.Warnings.Count > 0)
                                     || (edgesCount == 0 && snapshot.Edges.Count > 0)
                                     || (edgesCount > 0 && edgePropsCount == 0 && snapshot.Edges.Count > 0);

        if (!needsRelationalSlices)
            return;

        const string scopeSql = """
                                SELECT
                                    COALESCE(gs.TenantId, cs.TenantId) AS TenantId,
                                    COALESCE(gs.WorkspaceId, cs.WorkspaceId) AS WorkspaceId,
                                    COALESCE(gs.ScopeProjectId, cs.ScopeProjectId) AS ScopeProjectId
                                FROM dbo.GraphSnapshots AS gs
                                LEFT JOIN dbo.ContextSnapshots AS cs ON gs.ContextSnapshotId = cs.SnapshotId
                                WHERE gs.GraphSnapshotId = @GraphSnapshotId;
                                """;

        GraphSnapshotDenormScopeRow? scopeHdr =
            await connection.QuerySingleOrDefaultAsync<GraphSnapshotDenormScopeRow>(
                new CommandDefinition(scopeSql, new { GraphSnapshotId = graphSnapshotId }, transaction,
                    cancellationToken: ct));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ScopeProjectId is null)
            throw new InvalidOperationException(
                $"dbo.GraphSnapshots row {graphSnapshotId} (and ContextSnapshots join fallback) lacks denormalized RLS scope "
                + "(tenant/workspace/scope-project); cannot backfill graph relational tables.");

        ScopeContext scopeFill = new()
        {
            TenantId = scopeHdr.TenantId!.Value, WorkspaceId = scopeHdr.WorkspaceId!.Value, ProjectId = scopeHdr.ScopeProjectId!.Value
        };

        if (nodesCount == 0 && snapshot.Nodes.Count > 0)
            await InsertNodesAndPropertiesAsync(snapshot, connection, transaction, scopeFill, ct);

        if (warningsCount == 0 && snapshot.Warnings.Count > 0)
            await InsertWarningsAsync(snapshot, connection, transaction, scopeFill, ct);

        if (edgesCount == 0 && snapshot.Edges.Count > 0)
        {
            await InsertIndexedEdgesAsync(connection, transaction, snapshot, scopeFill, ct);
            await InsertEdgePropertiesAsync(snapshot, connection, transaction, scopeFill, ct);
        }
        else if (edgesCount > 0 && edgePropsCount == 0 && snapshot.Edges.Count > 0)
            await InsertEdgePropertiesAsync(snapshot, connection, transaction, scopeFill, ct);
    }

    /// <summary>Nullable row for COALESCE-loaded graph snapshot RLS scope during JSON→relational backfill.</summary>
    private sealed record GraphSnapshotDenormScopeRow(Guid? TenantId, Guid? WorkspaceId, Guid? ScopeProjectId);
}
