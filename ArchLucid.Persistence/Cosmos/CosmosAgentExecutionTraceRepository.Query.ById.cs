using ArchLucid.Contracts.Agents;
using ArchLucid.Persistence.Data.Repositories;

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
    public async Task<IReadOnlyList<AgentExecutionTrace>> GetByTaskIdAsync(
        string taskId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);
        QueryDefinition query = CosmosAgentTraceQueryCore.TaskIdQuery(taskId);

        using FeedIterator<AgentTraceDocument> iterator = container.GetItemQueryIterator<AgentTraceDocument>(query);
        List<AgentExecutionTrace> list = [];

        while (iterator.HasMoreResults)
        {
            FeedResponse<AgentTraceDocument> page = await iterator.ReadNextAsync(cancellationToken);

            list.AddRange(page.Select(CosmosAgentTraceDocumentMapper.Deserialize));
        }

        return list;
    }

    private async Task<AgentTraceDocument?> FindDocumentByTraceIdAsync(string traceId, CancellationToken ct)
    {
        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        QueryDefinition query = CosmosAgentTraceQueryCore.TraceIdQuery(traceId);

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
