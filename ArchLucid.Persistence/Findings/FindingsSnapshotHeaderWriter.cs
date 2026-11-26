using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Inserts the <c>dbo.FindingsSnapshots</c> header row. <c>FindingsJson</c> is still written alongside the relational
///     slices so legacy readers and JSON-only fallback paths keep working.
/// </summary>
internal static class FindingsSnapshotHeaderWriter
{
    public static async Task InsertAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        FindingRelationalScope scope,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(scope);

        DynamicParameters args = new(new
        {
            snapshot.FindingsSnapshotId,
            snapshot.RunId,
            snapshot.ContextSnapshotId,
            snapshot.GraphSnapshotId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            snapshot.SchemaVersion,
            GenerationStatus = snapshot.GenerationStatus.ToString(),
            FindingsJson = JsonEntitySerializer.Serialize(snapshot),
            ChecklistCoverageJson = ChecklistCoverageJsonCodec.Serialize(snapshot.ChecklistCoverage),
            InsightDensityDemotedCount = snapshot.InsightDensityCuration?.DemotedToChecklistCount,
            InsightDensityRetainedCount = snapshot.InsightDensityCuration?.RetainedFindingCount,
        });
        args.Add(nameof(snapshot.CreatedUtc), snapshot.CreatedUtc, DbType.DateTime2, scale: 7);

        await connection.ExecuteAsync(
            new CommandDefinition(FindingsSnapshotWriteSql.InsertHeader, args, transaction, cancellationToken: ct));
    }
}
