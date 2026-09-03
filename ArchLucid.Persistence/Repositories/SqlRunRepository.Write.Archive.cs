using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlRunRepository
{
    /// <inheritdoc />
    [TenantScopeExempt(TenantScopeExemptReason.Operational, "Tenant-catalog retention archival; updates runs by CreatedUtc cutoff within the active catalog.")]
    public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(DateTimeOffset cutoffUtc,
        CancellationToken ct) =>
        await ArchiveRunsCreatedBeforeCoreAsync(RunRepositorySql.ArchiveRunsCreatedBefore, new { Cutoff = cutoffUtc.UtcDateTime }, ct)
            .ConfigureAwait(false);

    /// <inheritdoc />
    public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeForScopeAsync(
        ScopeContext scope,
        DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        return await ArchiveRunsCreatedBeforeCoreAsync(
            RunRepositorySql.ArchiveRunsCreatedBeforeInScope,
            new
            {
                Cutoff = cutoffUtc.UtcDateTime,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId
            },
            ct).ConfigureAwait(false);
    }

    private async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeCoreAsync(
        string sql,
        object parameters,
        CancellationToken ct)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        try
        {
            await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
                new CommandDefinition(sql, parameters, tran, cancellationToken: ct)).ConfigureAwait(false);

            List<ArchivedRunScopeRow> rows = (await multi.ReadAsync<ArchivedRunScopeRow>().ConfigureAwait(false)).ToList();
            RunArchiveChildCascadeCounts childCascade = (await multi.ReadAsync<RunArchiveChildCascadeCounts>().ConfigureAwait(false)).Single();

            await tran.CommitAsync(ct).ConfigureAwait(false);

            return new RunArchiveBatchResult { UpdatedCount = rows.Count, ArchivedRuns = rows, ChildCascade = childCascade };
        }
        catch
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
    }

    /// <inheritdoc />
    [TenantScopeExempt(TenantScopeExemptReason.Operational, "Tenant-catalog retention archival; archives explicit run ids within the active catalog.")]
    public async Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(IReadOnlyList<Guid> runIds, CancellationToken ct)
    {
        if (runIds.Count == 0)
            return new RunArchiveByIdsResult();

        List<Guid> distinctOrdered = RunArchiveByIdsOutcome.DistinctInRequestOrder(runIds);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        List<ArchivedRunScopeRow> archived;
        List<Guid> alreadyArchivedRunIds;
        RunArchiveChildCascadeCounts childCascade;

        try
        {
            await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
                new CommandDefinition(RunRepositorySql.ArchiveRunsByIds, new
                {
                    RunIds = distinctOrdered
                }, tran, cancellationToken: ct)).ConfigureAwait(false);

            archived = (await multi.ReadAsync<ArchivedRunScopeRow>().ConfigureAwait(false)).ToList();
            alreadyArchivedRunIds = (await multi.ReadAsync<Guid>().ConfigureAwait(false)).ToList();
            childCascade = (await multi.ReadAsync<RunArchiveChildCascadeCounts>().ConfigureAwait(false)).Single();

            await tran.CommitAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }

        return RunArchiveByIdsOutcome.Assemble(distinctOrdered, archived, alreadyArchivedRunIds, childCascade);
    }
}
