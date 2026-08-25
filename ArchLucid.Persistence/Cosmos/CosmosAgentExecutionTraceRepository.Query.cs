using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Scoping;

using Microsoft.Azure.Cosmos;

namespace ArchLucid.Persistence.Cosmos;

public sealed partial class CosmosAgentExecutionTraceRepository
{
    /// <inheritdoc />
    public async Task<AgentExecutionTrace?> GetByTraceIdAsync(string traceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(traceId);

        AgentTraceDocument? doc = await FindDocumentByTraceIdAsync(traceId, cancellationToken);

        return doc is null ? null : CosmosAgentTraceDocumentMapper.Deserialize(doc);
    }

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
    public async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> GetLlmCostSlicesByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        return await QueryLlmCostSlicesByRunIdAsync(runId, cancellationToken);
    }

    public async Task<IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>> GetLlmCostSlicesByRunIdsAsync(
        ScopeContext scope,
        IReadOnlyCollection<string> runIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        List<string> normalized = runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        _ = scope;

        // Each slice query is a single-partition lookup keyed by runId, so fan out rather than
        // paying one sequential round-trip per run.
        IReadOnlyList<AgentExecutionTraceLlmCostSlice>[] sliceGroups = await BoundedParallelMap.MapAsync(
            normalized,
            LlmCostSliceFanOutMaxConcurrent,
            async (runId, ct) => await QueryLlmCostSlicesByRunIdAsync(runId, ct),
            cancellationToken);

        Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> map =
            new(StringComparer.OrdinalIgnoreCase);

        // MapAsync preserves input order, so index i corresponds to normalized[i].
        for (int i = 0; i < normalized.Count; i++)
        {
            map[normalized[i]] = sliceGroups[i];
        }

        return map;
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

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);
        int clampedOffset = Math.Max(0, offset);
        int clampedLimit = Math.Clamp(limit, 1, 500);

        QueryDefinition countQuery = new QueryDefinition("SELECT VALUE COUNT(1) FROM c WHERE c.runId = @runId")
            .WithParameter("@runId", runId);

        int total = 0;
        using FeedIterator<int> countIt = container.GetItemQueryIterator<int>(
            countQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        if (countIt.HasMoreResults)
        {
            FeedResponse<int> countPage = await countIt.ReadNextAsync(cancellationToken);
            total = countPage.Resource.FirstOrDefault();
        }

        // Project denormalized summary scalars only — do not SELECT TraceJson on the list path.
        QueryDefinition pageQuery = new QueryDefinition(
                """
                SELECT c.id, c.runId, c.taskId, c.createdUtc, c.agentType, c.parseSucceeded,
                       c.inputTokenCount, c.outputTokenCount, c.estimatedCostUsd,
                       c.modelDeploymentName, c.modelAlias, c.qualityWarning, c.qualityRejected,
                       c.blobUploadFailed
                FROM c
                WHERE c.runId = @runId
                ORDER BY c.createdUtc
                OFFSET @off LIMIT @lim
                """)
            .WithParameter("@runId", runId)
            .WithParameter("@off", clampedOffset)
            .WithParameter("@lim", clampedLimit);

        using FeedIterator<AgentTraceSummaryProjection> iterator =
            container.GetItemQueryIterator<AgentTraceSummaryProjection>(
                pageQuery,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        List<AgentExecutionTraceSummary> summaries = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceSummaryProjection> page = await iterator.ReadNextAsync(cancellationToken);

            summaries.AddRange(page.Select(CosmosAgentTraceDocumentMapper.MapSummaryProjection));
        }

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

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition countQuery = new QueryDefinition("SELECT VALUE COUNT(1) FROM c WHERE c.runId = @runId")
            .WithParameter("@runId", runId);

        using FeedIterator<int> countIt = container.GetItemQueryIterator<int>(
            countQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        if (!countIt.HasMoreResults)
            return 0;

        FeedResponse<int> countPage = await countIt.ReadNextAsync(cancellationToken);

        return countPage.Resource.FirstOrDefault();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByTaskIdAsync(
        string taskId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.taskId = @taskId ORDER BY c.createdUtc")
            .WithParameter("@taskId", taskId);

        using FeedIterator<AgentTraceDocument> iterator = container.GetItemQueryIterator<AgentTraceDocument>(query);
        List<AgentExecutionTrace> list = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceDocument> page = await iterator.ReadNextAsync(cancellationToken);

            list.AddRange(page.Select(CosmosAgentTraceDocumentMapper.Deserialize));
        }

        return list;
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

        List<string> normalized = runIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

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

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition query = new QueryDefinition(
                """
                SELECT c.agentType, c.modelDeploymentName
                FROM c
                WHERE c.runId = @runId
                """)
            .WithParameter("@runId", runId);

        using FeedIterator<AgentTypeDeploymentProjection> iterator =
            container.GetItemQueryIterator<AgentTypeDeploymentProjection>(
                query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

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

    private async Task<(IReadOnlyList<AgentExecutionTrace> Traces, int TotalCount)> QueryRunPageAsync(
        string runId,
        int offset,
        int limit,
        CancellationToken ct)
    {
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        int clampedOffset = Math.Max(0, offset);
        int clampedLimit = Math.Clamp(limit, 1, 500);

        QueryDefinition countQuery = new QueryDefinition("SELECT VALUE COUNT(1) FROM c WHERE c.runId = @runId")
            .WithParameter("@runId", runId);

        int total = 0;
        using FeedIterator<int> countIt = container.GetItemQueryIterator<int>(
            countQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        if (countIt.HasMoreResults)
        {
            FeedResponse<int> countPage = await countIt.ReadNextAsync(ct);
            total = countPage.Resource.FirstOrDefault();
        }

        QueryDefinition pageQuery = new QueryDefinition(
                """
                SELECT * FROM c
                WHERE c.runId = @runId
                ORDER BY c.createdUtc
                OFFSET @off LIMIT @lim
                """)
            .WithParameter("@runId", runId)
            .WithParameter("@off", clampedOffset)
            .WithParameter("@lim", clampedLimit);

        using FeedIterator<AgentTraceDocument> iterator = container.GetItemQueryIterator<AgentTraceDocument>(
            pageQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        List<AgentExecutionTrace> traces = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceDocument> page = await iterator.ReadNextAsync(ct);

            traces.AddRange(page.Select(CosmosAgentTraceDocumentMapper.Deserialize));
        }

        return (traces, total);
    }

    private async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> QueryLlmCostSlicesByRunIdAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition query = new QueryDefinition(
                """
                SELECT c.inputTokenCount, c.outputTokenCount, c.modelDeploymentName
                FROM c
                WHERE c.runId = @runId
                """)
            .WithParameter("@runId", runId);

        using FeedIterator<AgentTraceLlmCostProjection> iterator =
            container.GetItemQueryIterator<AgentTraceLlmCostProjection>(
                query,
                requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(runId) });

        List<AgentExecutionTraceLlmCostSlice> slices = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceLlmCostProjection> page = await iterator.ReadNextAsync(cancellationToken);

            foreach (AgentTraceLlmCostProjection row in page.Resource)
            {
                slices.Add(
                    new AgentExecutionTraceLlmCostSlice
                    {
                        ModelDeploymentName = row.ModelDeploymentName,
                        InputTokenCount = row.InputTokenCount,
                        OutputTokenCount = row.OutputTokenCount,
                        ReasoningTokenCount = null,
                    });
            }
        }

        return slices;
    }

    private async Task<AgentTraceDocument?> FindDocumentByTraceIdAsync(string traceId, CancellationToken ct)
    {
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        QueryDefinition query = new QueryDefinition("SELECT * FROM c WHERE c.id = @id").WithParameter("@id", traceId);

        using FeedIterator<AgentTraceDocument> iterator = container.GetItemQueryIterator<AgentTraceDocument>(query);

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceDocument> page = await iterator.ReadNextAsync(ct);
            AgentTraceDocument? doc = page.Resource.FirstOrDefault();

            if (doc is not null)
                return doc;
        }

        return null;
    }
}
