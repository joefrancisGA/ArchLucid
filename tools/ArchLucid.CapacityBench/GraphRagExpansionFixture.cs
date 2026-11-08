using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.Graph;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace ArchLucid.CapacityBench;

/// <summary>Fixture only: real GraphRAG expansion with an in-memory repository mock.</summary>
internal static class GraphRagExpansionFixture
{
    public static async Task<int> ExecuteAsync(GraphSnapshot snapshot, CancellationToken ct)
    {
        var repository = new Mock<IGraphSnapshotRepository>();
        repository.Setup(r => r.GetByIdAsync(
            It.IsAny<ScopeContext>(), snapshot.GraphSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);
        var options = new Mock<IOptionsMonitor<AdvancedRetrievalOptions>>();
        options.SetupGet(m => m.CurrentValue).Returns(new AdvancedRetrievalOptions
        {
            Enabled = true, EnableGraphRag = true, MaxGraphTraversalHops = 4,
            MaxGraphNeighborNodes = 32
        });
        var expander = new GraphRagNeighborExpander(repository.Object, options.Object,
            NullLogger<GraphRagNeighborExpander>.Instance);
        var query = new RetrievalQuery
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            QueryText = "synthetic fixture seed", TopK = 8
        };
        var hits = new List<RetrievalHit>
        {
            new()
            {
                ChunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshot.GraphSnapshotId, "0"),
                DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshot.GraphSnapshotId, "0"),
                CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                SourceType = "KnowledgeGraphNode", SourceId = "0",
                Title = "Seed", Text = "Fixture seed", Score = 0.9
            }
        };
        IReadOnlyList<RetrievalHit> expanded = await expander.ExpandAsync(query, hits, ct);
        repository.Verify(r => r.GetByIdAsync(It.IsAny<ScopeContext>(),
            snapshot.GraphSnapshotId, It.IsAny<CancellationToken>()), Times.Once);
        if (expanded.Count <= hits.Count || expanded[0].Score < expanded[^1].Score)
            throw new InvalidOperationException("Expansion or ordering contract violated.");
        return expanded.Count;
    }
}
