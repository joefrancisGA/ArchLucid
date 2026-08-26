using System.Data;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class AgentExecutionTraceRepository
{
    /// <inheritdoc />
    public async Task<AgentExecutionTrace?> GetByTraceIdAsync(
        string traceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string? rowJson = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            AgentExecutionTraceSql.SelectTraceJsonByTraceId,
            new
            {
                TraceId = traceId
            },
            cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.DeserializeOptionalTrace(rowJson);
    }

    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<string> rows = await connection.QueryAsync<string>(new CommandDefinition(
            AgentExecutionTraceQueryShapes.SelectTraceJsonByRunId,
            AgentExecutionTraceQueryParameters.ForRun(scope, runId),
            cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.DeserializeTraces(rows, $"run '{runId}'");
    }

    public async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> GetLlmCostSlicesByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTraceLlmCostSlice> rows =
            await connection.QueryAsync<AgentExecutionTraceLlmCostSlice>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectLlmCostSlicesByRunId,
                AgentExecutionTraceQueryParameters.ForRun(scope, runId),
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>> GetLlmCostSlicesByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyCollection<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = AgentExecutionTraceQueryParameters.NormalizeRunIds(runIds);

        if (normalized.Count == 0)
            return new Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>(StringComparer.OrdinalIgnoreCase);

        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTraceLlmCostSliceRow> rows =
            await connection.QueryAsync<AgentExecutionTraceLlmCostSliceRow>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectLlmCostSlicesByRunIds,
                AgentExecutionTraceQueryParameters.ForRuns(scope, normalized),
                cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.GroupCostSlices(rows, normalized);
    }

    public async Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> GetPagedByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTracePageRow> rows =
            await connection.QueryAsync<AgentExecutionTracePageRow>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectTraceJsonPagedByRunId,
                AgentExecutionTraceQueryParameters.ForRunPage(scope, runId, offset, limit),
                cancellationToken: cancellationToken));

        List<AgentExecutionTracePageRow> list = rows.ToList();

        IReadOnlyList<AgentExecutionTrace> traces = AgentExecutionTraceProjectionMapper.DeserializeTraces(
            list.Select(static row => row.TraceJson),
            $"run '{runId}' (paged)");

        return (traces, ReadTotalCount(list, static row => row.TotalCount));
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<AgentExecutionTraceSummary> Summaries, int TotalCount)> GetPagedSummariesByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTraceSummaryPageRow> rows =
            await connection.QueryAsync<AgentExecutionTraceSummaryPageRow>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectSummariesPagedByRunId,
                AgentExecutionTraceQueryParameters.ForRunPage(scope, runId, offset, limit),
                cancellationToken: cancellationToken));

        List<AgentExecutionTraceSummaryPageRow> list = rows.ToList();

        return (
            AgentExecutionTraceProjectionMapper.MapSummaries(list),
            ReadTotalCount(list, static row => row.TotalCount));
    }

    /// <inheritdoc />
    public async Task<int> CountByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            AgentExecutionTraceQueryShapes.CountByRunId,
            AgentExecutionTraceQueryParameters.ForRun(scope, runId),
            cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByTaskIdAsync(
        string taskId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<string> rows = await connection.QueryAsync<string>(new CommandDefinition(
            AgentExecutionTraceQueryShapes.SelectTraceJsonByTaskId,
            new
            {
                TaskId = taskId
            },
            cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.DeserializeTraces(rows, $"task '{taskId}'");
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetDistinctAgentTypesWithLlmResourceFallbackAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string normalizedRunId = runId.Trim();

        IReadOnlyDictionary<string, IReadOnlyList<string>> map =
            await GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
                scope,
                [normalizedRunId],
                cancellationToken);

        return map.TryGetValue(normalizedRunId, out IReadOnlyList<string>? agentTypes) ? agentTypes : [];
    }

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, IReadOnlyList<string>>> GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyList<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = AgentExecutionTraceQueryParameters.NormalizeRunIds(runIds);

        if (normalized.Count == 0)
            return new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase);

        PersistenceTenantScope.RequireRunChildScope(scope);

        using IDbConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgentExecutionTraceLlmFallbackRow> rows =
            await connection.QueryAsync<AgentExecutionTraceLlmFallbackRow>(new CommandDefinition(
                AgentExecutionTraceQueryShapes.SelectDistinctAgentTypesWithLlmFallbackByRunIds,
                AgentExecutionTraceQueryParameters.ForRunsWithLlmFallbackPrefix(scope, normalized),
                cancellationToken: cancellationToken));

        return AgentExecutionTraceProjectionMapper.GroupFallbackAgentTypes(rows, normalized);
    }

    /// <summary>
    ///     Reads the window-aggregate total repeated on every page row; an empty page means no matching rows at all.
    /// </summary>
    private static int ReadTotalCount<TRow>(List<TRow> page, Func<TRow, int> totalCountSelector) =>
        page.Count > 0 ? totalCountSelector(page[0]) : 0;
}
