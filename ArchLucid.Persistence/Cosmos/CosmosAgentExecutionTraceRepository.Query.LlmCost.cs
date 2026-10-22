using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Azure.Cosmos;

namespace ArchLucid.Persistence.Cosmos;

public sealed partial class CosmosAgentExecutionTraceRepository
{
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

        List<string> normalized = AgentExecutionTraceQueryPatchCore.NormalizeRunIds(runIds);

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

    private async Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> QueryLlmCostSlicesByRunIdAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);

        QueryDefinition query = CosmosAgentTraceQueryCore.RunIdLlmCostSliceQuery(runId);

        using FeedIterator<AgentTraceLlmCostProjection> iterator =
            container.GetItemQueryIterator<AgentTraceLlmCostProjection>(
                query,
                requestOptions: CosmosAgentTraceQueryCore.PartitionedByRunId(runId));

        List<AgentExecutionTraceLlmCostSlice> slices = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceLlmCostProjection> page = await iterator.ReadNextAsync(cancellationToken);

            foreach (AgentTraceLlmCostProjection row in page.Resource)
            {
                slices.Add(CosmosAgentTraceQueryCore.MapLlmCostProjection(row));
            }
        }

        return slices;
    }
}
