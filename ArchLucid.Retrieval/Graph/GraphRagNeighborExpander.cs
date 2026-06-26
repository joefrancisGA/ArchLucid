using System.Diagnostics;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Graph;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Graph;

/// <inheritdoc cref="IGraphRagNeighborExpander" />
public sealed class GraphRagNeighborExpander(
    IGraphSnapshotRepository graphSnapshotRepository,
    IOptionsMonitor<AdvancedRetrievalOptions> optionsMonitor,
    ILogger<GraphRagNeighborExpander> logger) : IGraphRagNeighborExpander
{
    private const double NeighborScoreFactor = 0.85;

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IOptionsMonitor<AdvancedRetrievalOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<GraphRagNeighborExpander> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalHit>> ExpandAsync(
        RetrievalQuery query,
        IReadOnlyList<RetrievalHit> hits,
        CancellationToken cancellationToken)
    {
        AdvancedRetrievalOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled || !options.EnableGraphRag || hits is null || hits.Count == 0)
            return hits ?? [];

        List<RetrievalHit> graphHits = hits
            .Where(static hit => string.Equals(hit.CorpusKind, nameof(CorpusKind.KnowledgeGraphNode), StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (graphHits.Count == 0)
            return hits;

        long startTicks = Stopwatch.GetTimestamp();
        int maxNeighbors = options.GetEffectiveMaxGraphNeighborNodes();
        List<RetrievalHit> expanded = hits.ToList();
        HashSet<string> existingChunkIds = expanded
            .Select(static hit => hit.ChunkId)
            .ToHashSet(StringComparer.Ordinal);

        ScopeContext scope = new()
        {
            TenantId = query.TenantId,
            WorkspaceId = query.WorkspaceId,
            ProjectId = query.ProjectId,
        };

        foreach (RetrievalHit seed in graphHits)
        {
            if (!KnowledgeGraphNodeEmbeddingTextComposer.TryParseGraphSnapshotId(seed.DocumentId, out Guid graphSnapshotId))
                continue;

            GraphSnapshot? snapshot;

            try
            {
                snapshot = await _graphSnapshotRepository
                    .GetByIdAsync(scope, graphSnapshotId, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(
                    ex,
                    "Graph-RAG neighbor expansion skipped for snapshot {GraphSnapshotId}.",
                    graphSnapshotId);

                continue;
            }

            if (snapshot is null)
                continue;

            IReadOnlyList<GraphNode> neighbors = CollectOneHopNeighbors(snapshot, seed.SourceId, maxNeighbors);

            foreach (GraphNode neighbor in neighbors)
            {
                string chunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(graphSnapshotId, neighbor.NodeId);

                if (!existingChunkIds.Add(chunkId))
                    continue;

                expanded.Add(new RetrievalHit
                {
                    ChunkId = chunkId,
                    DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(graphSnapshotId, neighbor.NodeId),
                    CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                    SourceType = "KnowledgeGraphNodeNeighbor",
                    SourceId = neighbor.NodeId,
                    Title = neighbor.Label ?? neighbor.NodeId,
                    Text = KnowledgeGraphNodeEmbeddingTextComposer.Compose(neighbor),
                    Score = seed.Score * NeighborScoreFactor,
                });
            }
        }

        IReadOnlyList<RetrievalHit> ordered = expanded
            .OrderByDescending(static hit => hit.Score)
            .ToList();

        int neighborsAdded = GraphRagRetrievalTelemetry.CountFromHits(ordered).NeighborsAdded;
        double expansionLatencyMilliseconds = Stopwatch.GetElapsedTime(startTicks).TotalMilliseconds;

        GraphRagExpansionLatencyAmbient.Set(expansionLatencyMilliseconds);
        ArchLucidInstrumentation.RecordGraphRagExpansion(neighborsAdded, expansionLatencyMilliseconds);

        return ordered;
    }

    internal static IReadOnlyList<GraphNode> CollectOneHopNeighbors(
        GraphSnapshot snapshot,
        string seedNodeId,
        int maxNeighbors)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentException.ThrowIfNullOrWhiteSpace(seedNodeId);

        HashSet<string> neighborIds = [];

        foreach (GraphEdge edge in snapshot.Edges)
        {
            if (string.Equals(edge.FromNodeId, seedNodeId, StringComparison.OrdinalIgnoreCase))
                neighborIds.Add(edge.ToNodeId);

            if (string.Equals(edge.ToNodeId, seedNodeId, StringComparison.OrdinalIgnoreCase))
                neighborIds.Add(edge.FromNodeId);

            if (neighborIds.Count >= maxNeighbors)
                break;
        }

        return snapshot.Nodes
            .Where(node => neighborIds.Contains(node.NodeId))
            .Take(maxNeighbors)
            .ToList();
    }
}
