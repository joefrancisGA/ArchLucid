using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

public sealed class GoldenCorpusMermaidTopologyGraphFactoryTests
{
    [Fact]
    public async Task CreateCase70MermaidTrustBoundaryTopologyGraphAsync_ProducesDiagramTopologyWithTrustBoundarySubgraph()
    {
        GraphSnapshot graph = await GoldenCorpusMermaidTopologyGraphFactory
            .CreateCase70MermaidTrustBoundaryTopologyGraphAsync();

        graph.Nodes.Should().Contain(node =>
            node.NodeId == "diagram-subgraph:corp"
            && node.NodeType == GraphNodeTypes.TrustBoundary
            && node.Label == "Corporate network");

        graph.Nodes.Should().Contain(node =>
            node.NodeId == "diagram-node:api"
            && node.NodeType == GraphNodeTypes.TopologyResource);

        graph.Nodes.Should().Contain(node =>
            node.NodeId == "diagram-node:db"
            && node.NodeType == GraphNodeTypes.TopologyResource);

        graph.Nodes.Should().Contain(node =>
            node.NodeId == "diagram-node:user"
            && node.NodeType == GraphNodeTypes.Actor);

        GraphNode apiNode = graph.Nodes.Single(node => node.NodeId == "diagram-node:api");
        apiNode.Properties[StructuredDiagramGraphPropertyKeys.TrustBoundaryLabel]
            .Should().Be("Corporate network");
        apiNode.Properties[StructuredDiagramGraphPropertyKeys.SourceEvidenceItemId]
            .Should().Be(GoldenCorpusMermaidTopologyGraphFactory.Case70DocumentId);

        graph.Edges.Should().Contain(edge =>
            edge.FromNodeId == "diagram-node:api"
            && edge.ToNodeId == "diagram-node:db");

        graph.Edges.Should().Contain(edge =>
            edge.FromNodeId == "diagram-subgraph:corp"
            && edge.ToNodeId == "diagram-node:api");

        graph.Edges.Should().Contain(edge =>
            edge.FromNodeId == "diagram-node:user"
            && edge.ToNodeId == "diagram-node:api");
    }
}
