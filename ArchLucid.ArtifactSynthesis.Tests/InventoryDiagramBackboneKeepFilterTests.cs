using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramBackboneKeepFilterTests
{
    [Fact]
    public void Filter_keeps_vms_and_sql_databases_and_drops_nsgs()
    {
        DiagramPeelCatalogSnapshot catalog = DiagramPeelCatalogDefaultSeed.BuildSnapshot();
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                CreateNode("vm-1", "Microsoft.Compute/virtualMachines"),
                CreateNode("db-1", "Microsoft.Sql/servers/databases"),
                CreateNode("nsg-1", "Microsoft.Network/networkSecurityGroups"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "e1",
                    FromNodeId = "vm-1",
                    ToNodeId = "db-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0d,
                },
                new GraphEdge
                {
                    EdgeId = "e2",
                    FromNodeId = "vm-1",
                    ToNodeId = "nsg-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Weight = 1.0d,
                },
            ],
        };

        GraphSnapshot filtered = InventoryDiagramBackboneKeepFilter.Filter(graph, catalog);

        filtered.Nodes.Select(node => node.NodeId).Should().BeEquivalentTo(["vm-1", "db-1"]);
        filtered.Edges.Should().ContainSingle(edge =>
            string.Equals(edge.FromNodeId, "vm-1", StringComparison.Ordinal)
            && string.Equals(edge.ToNodeId, "db-1", StringComparison.Ordinal));
    }

    private static GraphNode CreateNode(string nodeId, string armType)
    {
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = nodeId,
            SourceType = "azure-inventory-snapshot",
        };
        node.Properties["arm.type"] = armType;

        return node;
    }
}
