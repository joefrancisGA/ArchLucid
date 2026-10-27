using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Azure.Cosmos;

namespace ArchLucid.Persistence.Cosmos;

public sealed partial class CosmosAgentExecutionTraceRepository
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        (IReadOnlyList<AgentExecutionTrace> traces, _) = await QueryRunPageAsync(runId, 0, 500, cancellationToken);

        return traces;
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> GetPagedByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        return await QueryRunPageAsync(runId, offset, limit, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<AgentExecutionTraceSummary> Summaries, int TotalCount)> GetPagedSummariesByRunIdAsync(
        ScopeContext scope,
        string runId,
        int offset,
        int limit,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        IReadOnlyList<AgentExecutionTrace> merged =
            await LoadMergedTracesByRunIdAsync(runId, cancellationToken);

        (IReadOnlyList<AgentExecutionTrace> page, int total) =
            AgentExecutionTraceQueryPatchCore.PageInMemory(merged, offset, limit);

        List<AgentExecutionTraceSummary> summaries = page
            .Select(AgentExecutionTraceSummary.FromTrace)
            .ToList();

        return (summaries, total);
    }

    /// <inheritdoc />
    public async Task<int> CountByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return await AgentExecutionTraceQueryPatchCore.LoadMergedTraceCountByRunIdAsync(
            runId,
            async (lookupKey, ct) =>
            {
                Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
                return await ReadRunIdCountForPartitionAsync(container, lookupKey, ct);
            },
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetDistinctAgentTypesWithLlmResourceFallbackAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        IReadOnlyList<AgentTypeDeploymentProjection> rows =
            await QueryAgentTypeDeploymentProjectionsByRunIdAsync(runId, cancellationToken);

        return DistinctFallbackAgentTypes(rows);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, IReadOnlyList<string>>> GetDistinctAgentTypesWithLlmResourceFallbackByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyList<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = AgentExecutionTraceQueryPatchCore.NormalizeRunIds(runIds);

        Dictionary<string, IReadOnlyList<string>> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (string rid in normalized)
        {
            IReadOnlyList<AgentTypeDeploymentProjection> rows =
                await QueryAgentTypeDeploymentProjectionsByRunIdAsync(rid, cancellationToken);
            map[rid] = DistinctFallbackAgentTypes(rows);
        }

        return map;
    }

    private static IReadOnlyList<string> DistinctFallbackAgentTypes(IReadOnlyList<AgentTypeDeploymentProjection> rows)
    {
        return rows
            .Where(static row => AgentExecutionTraceDegradationProbe.LlmResourceFallbackModelDeployment(row.ModelDeploymentName))
            .Select(static row => row.AgentType)
            .Where(static agentType => !string.IsNullOrWhiteSpace(agentType))
            .Select(static agentType => agentType!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static agentType => agentType, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private async Task<IReadOnlyList<AgentTypeDeploymentProjection>> QueryAgentTypeDeploymentProjectionsByRunIdAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Dictionary<string, AgentTypeDeploymentProjection> merged = new(StringComparer.OrdinalIgnoreCase);

        foreach (string lookupKey in TechnologyLedgerRunIdLookup.EnumerateRunIdRepositoryLookupKeys(runId))
        {
            IReadOnlyList<AgentTypeDeploymentProjection> rows =
                await QueryAgentTypeDeploymentProjectionsForPartitionRunIdAsync(lookupKey, cancellationToken);

            foreach (AgentTypeDeploymentProjection row in rows)
            {
                string agentType = row.AgentType ?? string.Empty;
                merged.TryAdd(agentType, row);
            }
        }

        return merged.Values.ToList();
    }

    private async Task<IReadOnlyList<AgentTypeDeploymentProjection>> QueryAgentTypeDeploymentProjectionsForPartitionRunIdAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition query = CosmosAgentTraceQueryCore.RunIdAgentTypeDeploymentQuery(runId);

        using FeedIterator<AgentTypeDeploymentProjection> iterator =
            container.GetItemQueryIterator<AgentTypeDeploymentProjection>(
                query,
                requestOptions: CosmosAgentTraceQueryCore.PartitionedByRunId(runId));

        List<AgentTypeDeploymentProjection> rows = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTypeDeploymentProjection> page = await iterator.ReadNextAsync(cancellationToken);

            rows.AddRange(page);
        }

        return rows;
    }

    private sealed class AgentTypeDeploymentProjection
    {
        public string? AgentType
        {
            get;
            init;
        }

        public string? ModelDeploymentName
        {
            get;
            init;
        }
    }

    private Task<IReadOnlyList<AgentExecutionTrace>> LoadMergedTracesByRunIdAsync(
        string runId,
        CancellationToken cancellationToken) =>
        AgentExecutionTraceQueryPatchCore.LoadMergedTracesByRunIdAsync(
            runId,
            QueryTracesForPartitionRunIdAsync,
            cancellationToken);

    private async Task<IReadOnlyList<AgentExecutionTrace>> QueryTracesForPartitionRunIdAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition query = CosmosAgentTraceQueryCore.RunIdFullDocumentPageQuery(
            runId,
            0,
            AgentExecutionTraceQueryPatchCore.MaxPageSize);

        using FeedIterator<AgentTraceDocument> iterator = container.GetItemQueryIterator<AgentTraceDocument>(
            query,
            requestOptions: CosmosAgentTraceQueryCore.PartitionedByRunId(runId));

        List<AgentExecutionTrace> traces = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceDocument> page = await iterator.ReadNextAsync(cancellationToken);

            traces.AddRange(page.Select(CosmosAgentTraceDocumentMapper.Deserialize));
        }

        return traces;
    }

    private async Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> QueryRunPageAsync(
        string runId,
        int offset,
        int limit,
        CancellationToken ct)
    {
        IReadOnlyList<AgentExecutionTrace> merged = await LoadMergedTracesByRunIdAsync(runId, ct);

        (IReadOnlyList<AgentExecutionTrace> page, int total) =
            AgentExecutionTraceQueryPatchCore.PageInMemory(merged, offset, limit);

        return (page, total);
    }

    private static async Task<int> ReadRunIdCountForPartitionAsync(
        Container container,
        string runId,
        CancellationToken cancellationToken)
    {
        QueryDefinition countQuery = CosmosAgentTraceQueryCore.RunIdCountQuery(runId);

        using FeedIterator<int> countIt = container.GetItemQueryIterator<int>(
            countQuery,
            requestOptions: CosmosAgentTraceQueryCore.PartitionedByRunId(runId));

        if (!countIt.HasMoreResults)
            return 0;

        FeedResponse<int> countPage = await countIt.ReadNextAsync(cancellationToken);

        return countPage.Resource.FirstOrDefault();
    }
}
