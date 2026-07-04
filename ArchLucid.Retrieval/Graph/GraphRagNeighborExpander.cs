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
        int maxHops = options.GetEffectiveMaxGraphTraversalHops();
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

            IReadOnlyList<GraphRagNeighborHop> neighbors = GraphRagBoundedNeighborCollector.Collect(
                snapshot,
                seed.SourceId,
                maxHops,
                maxNeighbors);

            foreach (GraphRagNeighborHop neighborHop in neighbors)
            {
                GraphNode neighbor = neighborHop.Node;
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
                    Score = seed.Score * Math.Pow(NeighborScoreFactor, neighborHop.HopDistance),
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
}
