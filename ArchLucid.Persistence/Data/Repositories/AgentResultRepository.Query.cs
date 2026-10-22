using System.Data;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class AgentResultRepository
{
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
