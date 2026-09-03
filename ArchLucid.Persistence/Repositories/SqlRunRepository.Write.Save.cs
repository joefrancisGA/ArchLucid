using System.Data;

using ArchLucid.Core.Persistence;
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
