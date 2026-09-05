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
    public async Task ExpandAsync_fetches_each_distinct_snapshot_once_for_multiple_seeds()
    {
        Guid snapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = snapshotId,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "seed-a", NodeType = "TopologyResource", Label = "Seed A" },
                new GraphNode { NodeId = "seed-b", NodeType = "TopologyResource", Label = "Seed B" },
                new GraphNode { NodeId = "neighbor-a", NodeType = "PolicyControl", Label = "Neighbor A" },
                new GraphNode { NodeId = "neighbor-b", NodeType = "PolicyControl", Label = "Neighbor B" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "seed-a", ToNodeId = "neighbor-a", EdgeType = "APPLIES_TO" },
                new GraphEdge { FromNodeId = "seed-b", ToNodeId = "neighbor-b", EdgeType = "APPLIES_TO" },
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
            QueryText = "seeds",
            TopK = 8,
        };

        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit
            {
                ChunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshotId, "seed-a"),
                DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotId, "seed-a"),
                CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                SourceType = "KnowledgeGraphNode",
                SourceId = "seed-a",
                Title = "Seed A",
                Text = "seed a text",
                Score = 0.9,
            },
            new RetrievalHit
            {
                ChunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshotId, "seed-b"),
                DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotId, "seed-b"),
                CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                SourceType = "KnowledgeGraphNode",
                SourceId = "seed-b",
                Title = "Seed B",
                Text = "seed b text",
                Score = 0.8,
            },
        ];

        IReadOnlyList<RetrievalHit> expanded = await sut.ExpandAsync(query, hits, CancellationToken.None);

        expanded.Should().Contain(hit => hit.SourceId == "neighbor-a");
        expanded.Should().Contain(hit => hit.SourceId == "neighbor-b");
        graphRepository.Verify(
            r => r.GetByIdAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                snapshotId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExpandAsync_loads_distinct_snapshots_in_parallel_once_each()
    {
        Guid snapshotA = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid snapshotB = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        GraphSnapshot graphA = new()
        {
            GraphSnapshotId = snapshotA,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "seed-a", NodeType = "TopologyResource", Label = "Seed A" },
                new GraphNode { NodeId = "neighbor-a", NodeType = "PolicyControl", Label = "Neighbor A" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "seed-a", ToNodeId = "neighbor-a", EdgeType = "APPLIES_TO" },
            ],
        };
        GraphSnapshot graphB = new()
        {
            GraphSnapshotId = snapshotB,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "seed-b", NodeType = "TopologyResource", Label = "Seed B" },
                new GraphNode { NodeId = "neighbor-b", NodeType = "PolicyControl", Label = "Neighbor B" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "seed-b", ToNodeId = "neighbor-b", EdgeType = "APPLIES_TO" },
            ],
        };

        Mock<ArchLucid.Core.Persistence.Ports.IGraphSnapshotRepository> graphRepository = new();
        graphRepository
            .Setup(r => r.GetByIdAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                snapshotA,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(graphA);
        graphRepository
            .Setup(r => r.GetByIdAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                snapshotB,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(graphB);

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
            QueryText = "seeds",
            TopK = 8,
        };

        IReadOnlyList<RetrievalHit> hits =
        [
            new RetrievalHit
            {
                ChunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshotA, "seed-a"),
                DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotA, "seed-a"),
                CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                SourceType = "KnowledgeGraphNode",
                SourceId = "seed-a",
                Title = "Seed A",
                Text = "seed a text",
                Score = 0.9,
            },
            new RetrievalHit
            {
                ChunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshotB, "seed-b"),
                DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotB, "seed-b"),
                CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                SourceType = "KnowledgeGraphNode",
                SourceId = "seed-b",
                Title = "Seed B",
                Text = "seed b text",
                Score = 0.8,
            },
        ];

        IReadOnlyList<RetrievalHit> expanded = await sut.ExpandAsync(query, hits, CancellationToken.None);

        expanded.Should().Contain(hit => hit.SourceId == "neighbor-a");
        expanded.Should().Contain(hit => hit.SourceId == "neighbor-b");
        graphRepository.Verify(
            r => r.GetByIdAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                snapshotA,
                It.IsAny<CancellationToken>()),
            Times.Once);
        graphRepository.Verify(
            r => r.GetByIdAsync(
                It.IsAny<ArchLucid.Core.Scoping.ScopeContext>(),
                snapshotB,
                It.IsAny<CancellationToken>()),
            Times.Once);
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

    [Fact]
    public async Task ExpandAsync_shared_neighbor_uses_highest_seed_score_not_first_seed()
    {
        Guid snapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = snapshotId,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "seed-a", NodeType = "TopologyResource", Label = "Seed A" },
                new GraphNode { NodeId = "seed-b", NodeType = "TopologyResource", Label = "Seed B" },
                new GraphNode { NodeId = "shared", NodeType = "PolicyControl", Label = "Shared" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "seed-a", ToNodeId = "shared", EdgeType = "APPLIES_TO" },
                new GraphEdge { FromNodeId = "seed-b", ToNodeId = "shared", EdgeType = "APPLIES_TO" },
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
                ChunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshotId, "seed-a"),
                DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotId, "seed-a"),
                CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                SourceType = "KnowledgeGraphNode",
                SourceId = "seed-a",
                Title = "Seed A",
                Text = "seed a text",
                Score = 0.5,
            },
            new RetrievalHit
            {
                ChunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshotId, "seed-b"),
                DocumentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotId, "seed-b"),
                CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                SourceType = "KnowledgeGraphNode",
                SourceId = "seed-b",
                Title = "Seed B",
                Text = "seed b text",
                Score = 0.9,
            },
        ];

        IReadOnlyList<RetrievalHit> expanded = await sut.ExpandAsync(query, hits, CancellationToken.None);

        RetrievalHit sharedNeighbor = expanded.Single(hit => hit.SourceId == "shared");
        sharedNeighbor.Score.Should().BeApproximately(0.9 * 0.85, 0.0001);
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
