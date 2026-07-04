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

    [Fact]
    public async Task ExpandAsync_appends_second_hop_neighbors_when_hop_budget_allows()
    {
        Guid snapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        GraphSnapshot snapshot = BuildLinearChainSnapshot(snapshotId, ["seed", "hop1", "hop2"]);

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
                MaxGraphTraversalHops = 2,
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
                Score = 1.0,
            },
        ];

        IReadOnlyList<RetrievalHit> expanded = await sut.ExpandAsync(query, hits, CancellationToken.None);

        expanded.Should().HaveCount(3);
        expanded.Single(hit => hit.SourceId == "hop2").Score.Should().BeApproximately(0.7225, 0.0001);
    }

    private static GraphSnapshot BuildLinearChainSnapshot(Guid graphSnapshotId, IReadOnlyList<string> nodeIds)
    {
        List<GraphNode> nodes = nodeIds
            .Select(id => new GraphNode { NodeId = id, NodeType = "TopologyResource", Label = id })
            .ToList();

        List<GraphEdge> edges = [];

        for (int index = 0; index < nodeIds.Count - 1; index++)
        {
            edges.Add(new GraphEdge
            {
                FromNodeId = nodeIds[index],
                ToNodeId = nodeIds[index + 1],
                EdgeType = "CONTAINS",
            });
        }

        return new GraphSnapshot
        {
            GraphSnapshotId = graphSnapshotId,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = edges,
        };
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
