using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests.Graph;

[Trait("Category", "Unit")]
public sealed class LouvainGraphCommunityDetectorTests
{
    [Fact]
    public void DetectCommunities_groups_connected_components()
    {
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            Nodes =
            [
                new GraphNode { NodeId = "a", Label = "A" },
                new GraphNode { NodeId = "b", Label = "B" },
                new GraphNode { NodeId = "c", Label = "C" },
                new GraphNode { NodeId = "d", Label = "D" },
            ],
            Edges =
            [
                new GraphEdge { FromNodeId = "a", ToNodeId = "b" },
                new GraphEdge { FromNodeId = "c", ToNodeId = "d" },
            ],
        };

        LouvainGraphCommunityDetector sut = new();

        IReadOnlyList<GraphCommunity> communities = sut.DetectCommunities(snapshot);

        communities.Should().HaveCount(2);

        GraphCommunity first = communities.Single(community =>
            community.MemberNodeIds.Contains("a") && community.MemberNodeIds.Contains("b"));

        first.MemberNodeIds.Should().BeEquivalentTo(["a", "b"]);

        GraphCommunity second = communities.Single(community =>
            community.MemberNodeIds.Contains("c") && community.MemberNodeIds.Contains("d"));

        second.MemberNodeIds.Should().BeEquivalentTo(["c", "d"]);
    }

    [Fact]
    public void DetectCommunities_returns_empty_when_no_nodes()
    {
        LouvainGraphCommunityDetector sut = new();

        sut.DetectCommunities(new GraphSnapshot()).Should().BeEmpty();
    }
}

[Trait("Category", "Unit")]
public sealed class KnowledgeGraphCommunityRetrievalDocumentBuilderTests
{
    [Fact]
    public void BuildFromCommunities_creates_knowledge_graph_community_documents()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid workspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = snapshotId,
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "a", Label = "Web tier" },
                new GraphNode { NodeId = "b", Label = "SQL tier" },
            ],
        };

        IReadOnlyList<RetrievalDocument> documents = KnowledgeGraphCommunityRetrievalDocumentBuilder.BuildFromCommunities(
            snapshot,
            tenantId,
            workspaceId,
            projectId,
            [
                new GraphCommunitySummary
                {
                    CommunityId = "community-0",
                    MemberNodeIds = ["a", "b"],
                    Summary = "Web and data tiers form the core workload.",
                },
            ]);

        documents.Should().ContainSingle();
        documents[0].CorpusKind.Should().Be(CorpusKind.KnowledgeGraphCommunity);
        documents[0].Content.Should().Contain("Web and data tiers");
        documents[0].DocumentId.Should().Be($"graph-{snapshotId:N}-community-community-0");
    }
}

[Trait("Category", "Unit")]
public sealed class GraphCommunitySummarizationServiceTests
{
    [Fact]
    public async Task BuildCommunityDocumentsAsync_returns_empty_when_flag_off()
    {
        Mock<IGraphCommunityDetector> detector = new();
        Mock<IGraphCommunitySummaryCompletionClient> completionClient = new();
        IOptionsMonitor<AdvancedRetrievalOptions> options = new MockOptionsMonitor<AdvancedRetrievalOptions>(
            new AdvancedRetrievalOptions { Enabled = true, EnableCommunitySummarization = false });

        GraphCommunitySummarizationService sut = new(
            detector.Object,
            completionClient.Object,
            options,
            Mock.Of<ILogger<GraphCommunitySummarizationService>>());

        IReadOnlyList<RetrievalDocument> documents = await sut.BuildCommunityDocumentsAsync(
            new GraphSnapshot
            {
                Nodes = [new GraphNode { NodeId = "a", Label = "A" }],
            },
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            CancellationToken.None);

        documents.Should().BeEmpty();
        detector.Verify(d => d.DetectCommunities(It.IsAny<GraphSnapshot>()), Times.Never);
    }

    [Fact]
    public async Task BuildCommunityDocumentsAsync_uses_llm_for_multi_node_communities()
    {
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode { NodeId = "a", Label = "A", NodeType = "Resource" },
                new GraphNode { NodeId = "b", Label = "B", NodeType = "Resource" },
            ],
            Edges = [new GraphEdge { FromNodeId = "a", ToNodeId = "b" }],
        };

        Mock<IGraphCommunityDetector> detector = new();
        detector
            .Setup(d => d.DetectCommunities(snapshot))
            .Returns([
                new GraphCommunity
                {
                    CommunityId = "community-0",
                    MemberNodeIds = ["a", "b"],
                },
            ]);

        Mock<IGraphCommunitySummaryCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.SummarizeCommunityAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Shared security boundary.");

        IOptionsMonitor<AdvancedRetrievalOptions> options = new MockOptionsMonitor<AdvancedRetrievalOptions>(
            new AdvancedRetrievalOptions { Enabled = true, EnableCommunitySummarization = true });

        GraphCommunitySummarizationService sut = new(
            detector.Object,
            completionClient.Object,
            options,
            Mock.Of<ILogger<GraphCommunitySummarizationService>>());

        IReadOnlyList<RetrievalDocument> documents = await sut.BuildCommunityDocumentsAsync(
            snapshot,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            CancellationToken.None);

        documents.Should().ContainSingle();
        documents[0].Content.Should().Contain("Shared security boundary");
        completionClient.Verify(c => c.SummarizeCommunityAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
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
