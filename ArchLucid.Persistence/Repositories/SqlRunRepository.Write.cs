using System.Data;

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

    public async Task SaveAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(run);
        PersistenceTenantScope.RequireEntityTenant(run.TenantId);

        const string sql = RunRepositorySql.Insert;

        object insertParams = RunRecordParameters.Insert(run);

        if (connection is not null)
        {
            if (RunRepositoryCore.ShouldConsumeTrialRunAllowanceOnCreate(run))
                await _tenantRepository.TryIncrementActiveTrialRunAsync(run.TenantId, ct, connection, transaction).ConfigureAwait(false);

            byte[] stamp = await connection.QuerySingleAsync<byte[]>(
                new CommandDefinition(sql, insertParams, transaction, cancellationToken: ct)).ConfigureAwait(false);
            run.RowVersion = stamp;

            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await owned.BeginTransactionAsync(ct).ConfigureAwait(false);

        try
        {
            if (RunRepositoryCore.ShouldConsumeTrialRunAllowanceOnCreate(run))
                await _tenantRepository.TryIncrementActiveTrialRunAsync(run.TenantId, ct, owned, tran).ConfigureAwait(false);

            byte[] ownedStamp =
                await owned.QuerySingleAsync<byte[]>(new CommandDefinition(sql, insertParams, tran, cancellationToken: ct)).ConfigureAwait(false);
            run.RowVersion = ownedStamp;
            await tran.CommitAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
    }

    public async Task UpdateAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(run);
        PersistenceTenantScope.RequireEntityTenant(run.TenantId);

        const string sql = RunRepositorySql.Update;

        if (connection is not null)
        {
            await EnsureCommittedRunHeaderAnchorsUnchangedAsync(connection, transaction, run, ct).ConfigureAwait(false);
            await ApplyUpdateAsync(connection, transaction, run, sql, ct).ConfigureAwait(false);

            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await EnsureCommittedRunHeaderAnchorsUnchangedAsync(owned, null, run, ct).ConfigureAwait(false);
        await ApplyUpdateAsync(owned, null, run, sql, ct).ConfigureAwait(false);
    }

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

    /// <inheritdoc />
    public async Task<RunStaleUncommittedPurgeBatchResult> HardDeleteStaleUncommittedRunsBatchAsync(
        DateTimeOffset createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        int safeBatch = RunRepositoryCore.ClampPurgeBatchSize(batchSize);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        IEnumerable<ArchivedRunScopeRow> rows = await connection.QueryAsync<ArchivedRunScopeRow>(
            new CommandDefinition(
                "dbo.Archival_PurgeStaleUncommittedRunsBatch",
                new
                {
                    CutoffUtc = createdBeforeUtc.UtcDateTime,
                    BatchSize = safeBatch
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct)).ConfigureAwait(false);

        List<ArchivedRunScopeRow> list = rows.AsList();

        return new RunStaleUncommittedPurgeBatchResult { Deleted = list };
    }

    /// <inheritdoc />
    public async Task<RunSamplePurgeBatchResult> HardDeleteSampleRunsBatchAsync(
        Guid? tenantId,
        DateTimeOffset? createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        int safeBatch = RunRepositoryCore.ClampPurgeBatchSize(batchSize);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        IEnumerable<ArchivedRunScopeRow> rows = await connection.QueryAsync<ArchivedRunScopeRow>(
            new CommandDefinition(
                "dbo.SampleRunPurgeBatch",
                new
                {
                    TenantId = tenantId,
                    CreatedBeforeUtc = createdBeforeUtc?.UtcDateTime,
                    BatchSize = safeBatch
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct)).ConfigureAwait(false);

        List<ArchivedRunScopeRow> list = rows.AsList();

        return new RunSamplePurgeBatchResult { Deleted = list };
    }

    private static async Task EnsureCommittedRunHeaderAnchorsUnchangedAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        RunRecord run,
        CancellationToken ct)
    {
        RunRecord? persisted = await LoadRunForAnchorGuardAsync(connection, transaction, run, ct).ConfigureAwait(false);
        CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, run);
    }

    private static async Task<RunRecord?> LoadRunForAnchorGuardAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        RunRecord run,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);

        return await connection.QuerySingleOrDefaultAsync<RunRecord>(
            new CommandDefinition(
                RunRepositorySql.SelectAnchorGuardByScopedId,
                RunRecordParameters.AnchorGuardKey(run),
                transaction,
                cancellationToken: ct)).ConfigureAwait(false);
    }

    private static async Task ApplyUpdateAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        RunRecord run,
        string sql,
        CancellationToken ct)
    {
        byte[]? newStamp;

        try
        {
            newStamp = await connection.QuerySingleOrDefaultAsync<byte[]>(
                new CommandDefinition(
                    sql,
                    RunRecordParameters.Update(run),
                    transaction,
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == CommittedRunHeaderAnchorRegistry.TriggerErrorNumber)
        {
            throw new RunEvidenceAnchorImmutableException(run.RunId);
        }

        if (newStamp is null)
        {
            if (run.RowVersion is not null)
                throw new RunConcurrencyConflictException(run.RunId);

            throw new InvalidOperationException($"Run '{run.RunId:D}' was not found for update.");
        }

        run.RowVersion = newStamp;
    }

    /// <inheritdoc />
    public async Task<bool> TrySetOperatorGovernanceDispositionAsync(
        ScopeContext scope,
        Guid runId,
        string decision,
        string? rationale,
        string actorUserId,
        DateTime occurredUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        RunRepositoryCore.ValidateOperatorGovernanceDispositionArgs(runId, decision, actorUserId);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                RunRepositorySql.UpdateOperatorGovernanceDisposition,
                RunRecordParameters.ForOperatorGovernanceDisposition(
                    scope,
                    runId,
                    decision,
                    rationale,
                    actorUserId,
                    occurredUtc),
                cancellationToken: ct)).ConfigureAwait(false);

        return rows > 0;
    }
}
