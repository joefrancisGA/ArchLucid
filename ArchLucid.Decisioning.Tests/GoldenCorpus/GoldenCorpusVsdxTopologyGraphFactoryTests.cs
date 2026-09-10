using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

public sealed class GoldenCorpusVsdxTopologyGraphFactoryTests
{
    [Fact]
    public async Task CreateCase71VsdxTopologyGraphAsync_ProducesDiagramTopologyWithoutUnlabeledShape()
    {
        GraphSnapshot graph = await GoldenCorpusVsdxTopologyGraphFactory.CreateCase71VsdxTopologyGraphAsync();

        graph.Nodes.Should().Contain(node =>
            node.NodeId == "diagram-node:1"
            && node.NodeType == GraphNodeTypes.TopologyResource
            && node.Label == "API Gateway");

        graph.Nodes.Should().Contain(node =>
            node.NodeId == "diagram-node:2"
            && node.NodeType == GraphNodeTypes.TopologyResource
            && node.Label == "SQL Database");

        graph.Nodes.Should().NotContain(node => node.NodeId == "diagram-node:3");

        graph.Edges.Should().Contain(edge =>
            edge.FromNodeId == "diagram-node:1"
            && edge.ToNodeId == "diagram-node:2");
    }
}
