using System.Data;

using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlContextSnapshotRepository
{
    /// <summary>
    ///     Inserts relational slices that are still empty while JSON columns contain data (idempotent per slice).
    /// </summary>
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Backfill scope lookup by SnapshotId surrogate key before slice insert.")]
    internal static async Task BackfillRelationalSlicesAsync(
        ContextSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);

        Guid snapshotId = snapshot.SnapshotId;
        object countParam = new { SnapshotId = snapshotId };

        int canonicalCount = await SqlRelationalSliceBackfillCore.CountSliceRowsAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ContextSnapshotCanonicalObjects WHERE SnapshotId = @SnapshotId",
            countParam,
            ct);

        int warningsCount = await SqlRelationalSliceBackfillCore.CountSliceRowsAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ContextSnapshotWarnings WHERE SnapshotId = @SnapshotId",
            countParam,
            ct);

        int errorsCount = await SqlRelationalSliceBackfillCore.CountSliceRowsAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ContextSnapshotErrors WHERE SnapshotId = @SnapshotId",
            countParam,
            ct);

        int hashesCount = await SqlRelationalSliceBackfillCore.CountSliceRowsAsync(
            connection,
            transaction,
            "SELECT COUNT(1) FROM dbo.ContextSnapshotSourceHashes WHERE SnapshotId = @SnapshotId",
            countParam,
            ct);

        bool needsRelationalSlices = SqlRelationalSliceBackfillCore.SliceNeedsBackfill(canonicalCount, snapshot.CanonicalObjects.Count)
                                     || SqlRelationalSliceBackfillCore.SliceNeedsBackfill(warningsCount, snapshot.Warnings.Count)
                                     || SqlRelationalSliceBackfillCore.SliceNeedsBackfill(errorsCount, snapshot.Errors.Count)
                                     || SqlRelationalSliceBackfillCore.SliceNeedsBackfill(hashesCount, snapshot.SourceHashes.Count);

        if (!needsRelationalSlices)
            return;

        const string scopeSql = """
                                SELECT
                                    COALESCE(cs.TenantId, r.TenantId) AS TenantId,
                                    COALESCE(cs.WorkspaceId, r.WorkspaceId) AS WorkspaceId,
                                    COALESCE(cs.ScopeProjectId, r.ScopeProjectId) AS ScopeProjectId
                                FROM dbo.ContextSnapshots AS cs
                                LEFT JOIN dbo.Runs AS r ON cs.RunId = r.RunId
                                WHERE cs.SnapshotId = @SnapshotId;
                                """;

        ContextSnapshotDenormScopeRow? scopeHdr =
            await connection.QuerySingleOrDefaultAsync<ContextSnapshotDenormScopeRow>(
                new CommandDefinition(scopeSql, new { SnapshotId = snapshotId }, transaction, cancellationToken: ct));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ScopeProjectId is null)
            throw new InvalidOperationException(
                $"dbo.ContextSnapshots row {snapshotId} (and Runs join fallback) lacks denormalized RLS scope; "
                + "cannot backfill ContextSnapshot relational children.");

        ScopeContext scopeFill = new()
        {
            TenantId = scopeHdr.TenantId!.Value, WorkspaceId = scopeHdr.WorkspaceId!.Value, ProjectId = scopeHdr.ScopeProjectId!.Value
        };

        if (SqlRelationalSliceBackfillCore.SliceNeedsBackfill(canonicalCount, snapshot.CanonicalObjects.Count))
            await InsertContextCanonicalRelationalAsync(snapshot, connection, transaction, scopeFill, ct);

        if (SqlRelationalSliceBackfillCore.SliceNeedsBackfill(warningsCount, snapshot.Warnings.Count))
            await InsertContextWarningsRelationalAsync(snapshot, connection, transaction, scopeFill, ct);

        if (SqlRelationalSliceBackfillCore.SliceNeedsBackfill(errorsCount, snapshot.Errors.Count))
            await InsertContextErrorsRelationalAsync(snapshot, connection, transaction, scopeFill, ct);

        if (SqlRelationalSliceBackfillCore.SliceNeedsBackfill(hashesCount, snapshot.SourceHashes.Count))
            await InsertContextSourceHashesRelationalAsync(snapshot, connection, transaction, scopeFill, ct);
    }

    private sealed record ContextSnapshotDenormScopeRow(Guid? TenantId, Guid? WorkspaceId, Guid? ScopeProjectId);
}
