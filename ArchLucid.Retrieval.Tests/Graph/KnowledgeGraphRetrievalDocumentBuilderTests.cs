using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Graph;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class KnowledgeGraphRetrievalDocumentBuilderTests
{
    [Fact]
    public void BuildFromGraphSnapshot_creates_knowledge_graph_node_documents()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid workspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = snapshotId,
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "resource-1",
                    NodeType = "TopologyResource",
                    Label = "App Service",
                    Category = "compute",
                    ReasoningTrace = "Hosts the web tier.",
                },
            ],
            Edges = [],
        };

        IReadOnlyList<Models.RetrievalDocument> documents = KnowledgeGraphRetrievalDocumentBuilder.BuildFromGraphSnapshot(
            snapshot,
            tenantId,
            workspaceId,
            projectId);

        documents.Should().ContainSingle();
        documents[0].CorpusKind.Should().Be(CorpusKind.KnowledgeGraphNode);
        documents[0].Content.Should().Contain("App Service");
        documents[0].DocumentId.Should().Be($"graph-{snapshotId:N}-node-resource-1");
    }
}
