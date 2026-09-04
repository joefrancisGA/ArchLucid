using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlFindingsSnapshotRepository
{
    public async Task SaveAsync(
        FindingsSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (connection is not null)
        {
            await SaveCoreAsync(snapshot, connection, transaction, ct);
            return;
        }

        await using SqlConnection owned = await _writeConnectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            await SaveCoreAsync(snapshot, owned, tx, ct);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    /// <summary>
    ///     Inserts relational finding rows when <c>FindingRecords</c> is still empty (idempotent).
    /// </summary>
    internal static async Task BackfillRelationalSlicesAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);

        int recordCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            FindingsSnapshotWriteSql.CountFindingRecordsBySnapshotId,
            new { snapshot.FindingsSnapshotId },
            ct);

        if (recordCount > 0 || snapshot.Findings.Count == 0)
            return;

        FindingsSnapshotMigrator.Apply(snapshot);

        FindingsSnapshotScopeTripleRow? scopeHdr =
            await connection.QuerySingleOrDefaultAsync<FindingsSnapshotScopeTripleRow>(
                new CommandDefinition(
                    FindingsSnapshotWriteSql.SelectScopeTripleForBackfill,
                    new { snapshot.FindingsSnapshotId },
                    transaction,
                    cancellationToken: ct));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ProjectId is null)
            throw new InvalidOperationException(
                $"dbo.FindingsSnapshots row {snapshot.FindingsSnapshotId} lacks denormalized RLS scope (tenant/workspace/project); cannot backfill FindingRecords.");

        await FindingRelationalWriter.InsertSnapshotFindingsAsync(
            snapshot,
            connection,
            transaction,
            new FindingRelationalScope(
                scopeHdr.TenantId!.Value,
                scopeHdr.WorkspaceId!.Value,
                scopeHdr.ProjectId!.Value),
            ct);
    }

    private async Task SaveCoreAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        FindingsSnapshotRepositoryCore.PrepareSnapshotForSave(snapshot);

        FindingRelationalScope scope =
            FindingRelationalScope.FromScopeContext(_scopeContextProvider.GetCurrentScope());

        await FindingsSnapshotHeaderWriter.InsertAsync(snapshot, connection, transaction, scope, ct);
        await FindingRelationalWriter.InsertSnapshotFindingsAsync(snapshot, connection, transaction, scope, ct);
    }
}
