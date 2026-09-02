using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentResultRepository(
    IDbConnectionFactory connectionFactory,
    IAgentResultEnrichmentRepository agentResultEnrichmentRepository) : IAgentResultRepository
{
    private readonly IAgentResultEnrichmentRepository _agentResultEnrichmentRepository =
        agentResultEnrichmentRepository ?? throw new ArgumentNullException(nameof(agentResultEnrichmentRepository));

    /// <summary>
    ///     Persists one agent result row. Duplicate <c>(RunId, TaskId)</c> inserts fail with
    ///     <see cref="ArchLucid.Core.Persistence.AgentResultDuplicateConflictException" /> (see TB-201 unique index).
    /// </summary>
    public async Task CreateAsync(
        AgentResult result,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(result);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                AgentResultWriteSql.Insert,
                AgentResultInsertParameters.Create(result),
                transaction,
                cancellationToken: cancellationToken));
        }
        catch (SqlException ex) when (IsUniqueViolation(ex))
        {
            throw new AgentResultDuplicateConflictException(result.RunId, result.TaskId, ex);
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task CreateManyAsync(
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(results);

        if (results.Count == 0)
            return;

        AgentResultRepositoryCore.RequireSingleRun(results);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken)
                .ConfigureAwait(false);

        IDbTransaction? localTransaction = null;

        try
        {
            // Only own a transaction when we also own the connection; otherwise the caller's unit of work governs.
            if (transaction is null && ownsConnection)
            {
                localTransaction = conn.BeginTransaction();
                transaction = localTransaction;
            }

            await AgentResultInsertBatch.ExecuteAsync(conn, transaction, results, cancellationToken)
                .ConfigureAwait(false);

            localTransaction?.Commit();
        }
        catch (SqlException ex) when (IsUniqueViolation(ex))
        {
            throw new AgentResultDuplicateConflictException(results[0].RunId, results[0].TaskId, ex);
        }
        finally
        {
            localTransaction?.Dispose();
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task ReplaceForRunTaskAsync(
        AgentResult replacement,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(replacement);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                AgentResultWriteSql.DeleteByRunTask,
                AgentResultInsertParameters.RunTaskKey(replacement.RunId, replacement.TaskId),
                transaction,
                cancellationToken: cancellationToken));

            await conn.ExecuteAsync(new CommandDefinition(
                AgentResultWriteSql.Insert,
                AgentResultInsertParameters.Create(replacement),
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    /// <inheritdoc />
    public async Task DeleteForRunTaskAsync(
        string runId,
        string taskId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                AgentResultWriteSql.DeleteByRunTask,
                AgentResultInsertParameters.RunTaskKey(runId, taskId),
                transaction,
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<IReadOnlyList<AgentResult>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        IEnumerable<string> rows = await QueryRunScopedAsync<string>(
            AgentResultStatementFactory.BuildSelectResultJsonByRunId(),
            scope,
            runId,
            connection,
            transaction,
            cancellationToken);

        List<AgentResult> results = AgentResultJsonRowReader.ReadAll(rows, runId);

        return AgentResultEnrichmentMerger.Apply(
            results,
            await LoadEnrichmentsAsync(results, cancellationToken));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> GetAgentTypeMarkersByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        IEnumerable<AgentResultMarkerRow> rows = await QueryRunScopedAsync<AgentResultMarkerRow>(
            AgentResultStatementFactory.BuildSelectAgentTypeMarkersByRunId(),
            scope,
            runId,
            connection: null,
            transaction: null,
            cancellationToken);

        return AgentResultProjectionMapper.MapMarkers(rows);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> GetRollupProjectionByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        IEnumerable<AgentResultRollupProjectionRow> rows = await QueryRunScopedAsync<AgentResultRollupProjectionRow>(
            AgentResultStatementFactory.BuildSelectRollupProjectionByRunId(),
            scope,
            runId,
            connection: null,
            transaction: null,
            cancellationToken);

        List<AgentResult> projected = AgentResultProjectionMapper.MapRollupProjection(rows, runId);

        return AgentResultEnrichmentMerger.ApplyRollup(
            projected,
            await LoadEnrichmentsAsync(projected, cancellationToken));
    }

    public async Task<IReadOnlyList<EvidenceProposalListItem>> ListEvidenceProposalsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        IEnumerable<AgentResultEvidenceProposalRow> rows;

        try
        {
            rows = await conn.QueryAsync<AgentResultEvidenceProposalRow>(new CommandDefinition(
                AgentResultStatementFactory.BuildListEvidenceProposals(),
                PersistenceTenantScope.RunChildScopeParameters(scope),
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        return rows.Select(AgentResultProjectionMapper.MapEvidenceProposal).ToList();
    }

    public async Task<EvidenceProposalListItem?> TryGetEvidenceProposalAsync(
        ScopeContext scope,
        string resultId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resultId);
        PersistenceTenantScope.RequireRunChildScope(scope);

        DynamicParameters parameters = new(PersistenceTenantScope.RunChildScopeParameters(scope));
        parameters.Add("ResultId", resultId);

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        try
        {
            AgentResultEvidenceProposalRow? row =
                await conn.QuerySingleOrDefaultAsync<AgentResultEvidenceProposalRow>(new CommandDefinition(
                    AgentResultStatementFactory.BuildSelectEvidenceProposalByResultId(),
                    parameters,
                    cancellationToken: cancellationToken));

            return row is null ? null : AgentResultProjectionMapper.MapEvidenceProposal(row);
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    private static bool IsUniqueViolation(SqlException exception) =>
        AgentResultRepositoryCore.IsUniqueViolation(exception);

    private async Task<IEnumerable<TRow>> QueryRunScopedAsync<TRow>(
        string sql,
        ScopeContext scope,
        string runId,
        IDbConnection? connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        DynamicParameters parameters = new(PersistenceTenantScope.RunChildScopeParameters(scope));
        parameters.Add("RunId", SqlRunIdMapping.ToSqlRunId(runId));

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, connection, cancellationToken);

        try
        {
            return await conn.QueryAsync<TRow>(
                new CommandDefinition(sql, parameters, transaction, cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    private Task<IReadOnlyDictionary<string, AgentResultEnrichmentRecord>> LoadEnrichmentsAsync(
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken) =>
        _agentResultEnrichmentRepository.GetByResultIdsAsync(
            results.Select(static r => r.ResultId).ToList(),
            cancellationToken);
}
