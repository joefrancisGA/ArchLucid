using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Graph;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests.Graph;

[Trait("Category", "Unit")]
public sealed class GraphRagNeighborExpanderTests
{
    [Fact]
    public void CollectOneHopNeighbors_returns_connected_nodes()
    {
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "a", NodeType = "TopologyResource", Label = "A" },
                new GraphNode { NodeId = "b", NodeType = "TopologyResource", Label = "B" },
                new GraphNode { NodeId = "c", NodeType = "TopologyResource", Label = "C" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "a", ToNodeId = "b", EdgeType = "CONTAINS" },
                new GraphEdge { FromNodeId = "c", ToNodeId = "a", EdgeType = "PROTECTS" },
            ],
        };

        IReadOnlyList<GraphNode> neighbors = GraphRagNeighborExpander.CollectOneHopNeighbors(snapshot, "a", 8);

        neighbors.Select(n => n.NodeId).Should().BeEquivalentTo(["b", "c"]);
    }

    [Fact]
    public async Task ExpandAsync_appends_neighbor_hits_for_graph_seeds()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = snapshotId,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "seed", NodeType = "TopologyResource", Label = "Seed" },
                new GraphNode { NodeId = "neighbor", NodeType = "PolicyControl", Label = "Neighbor" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "seed", ToNodeId = "neighbor", EdgeType = "APPLIES_TO" },
            ],
        };

        Mock<ArchLucid.Core.Persistence.Ports.IGraphSnapshotRepository> graphRepository = new();
        graphRepository
            .Setup(r => r.GetByIdAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                snapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        GraphRagNeighborExpander sut = new(
            graphRepository.Object,
            new MockOptionsMonitor<AdvancedRetrievalOptions>(new AdvancedRetrievalOptions
            {
                Enabled = true,
                EnableGraphRag = true,
            }),
            Mock.Of<ILogger<GraphRagNeighborExpander>>());

        RetrievalQuery query = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            QueryText = "seed",
            TopK = 8,
        };

        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit
            {
                ChunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshotId, "seed"),
                DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotId, "seed"),
                CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                SourceType = "KnowledgeGraphNode",
                SourceId = "seed",
                Title = "Seed",
                Text = "seed text",
                Score = 0.9,
            },
        ];

        IReadOnlyList<RetrievalHit> expanded = await sut.ExpandAsync(query, hits, CancellationToken.None);

        expanded.Should().HaveCount(2);
        expanded.Should().Contain(hit => hit.SourceId == "neighbor");
    }

    private sealed class MockOptionsMonitor<T>(T value) : IOptionsMonitor<T> where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
