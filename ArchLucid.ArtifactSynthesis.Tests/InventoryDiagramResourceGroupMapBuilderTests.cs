using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramResourceGroupMapBuilderTests
{
    [Fact]
    public void TryBuild_collapses_leaf_nodes_to_one_node_per_resource_group()
    {
        GraphSnapshot graph = BuildMultiGroupGraph(resourceGroupCount: 3, nodesPerGroup: 4);

        bool collapsed = InventoryDiagramResourceGroupMapBuilder.TryBuild(graph, maxMapNodes: 400, out GraphSnapshot map);

        collapsed.Should().BeTrue();
        map.Nodes.Should().HaveCount(3);
        map.Nodes.Select(node => node.Properties["arm.resourceGroup"]).Should().BeEquivalentTo(
            ["rg-0", "rg-1", "rg-2"],
            options => options.WithStrictOrdering());
        map.Nodes.Should().OnlyContain(node =>
            string.Equals(
                node.Properties["arm.type"],
                InventoryDiagramResourceGroupMapBuilder.ArmResourceType,
                StringComparison.Ordinal));
        map.Edges.Should().HaveCount(2);
        map.Edges.Select(edge => (edge.FromNodeId, edge.ToNodeId)).Should().BeEquivalentTo(
            [("rg-map:rg-0", "rg-map:rg-1"), ("rg-map:rg-1", "rg-map:rg-2")]);
    }

    [Fact]
    public void TryBuild_rejects_single_resource_group_and_maps_over_node_budget()
    {
        GraphSnapshot singleGroup = BuildMultiGroupGraph(resourceGroupCount: 1, nodesPerGroup: 20);
        GraphSnapshot tooManyGroups = BuildMultiGroupGraph(resourceGroupCount: 5, nodesPerGroup: 1);

        InventoryDiagramResourceGroupMapBuilder.TryBuild(singleGroup, maxMapNodes: 400, out _).Should().BeFalse();
        InventoryDiagramResourceGroupMapBuilder.TryBuild(tooManyGroups, maxMapNodes: 4, out _).Should().BeFalse();
    }

    private static GraphSnapshot BuildMultiGroupGraph(int resourceGroupCount, int nodesPerGroup)
    {
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        int edgeIndex = 0;
        GraphNode? previous = null;

        for (int groupIndex = 0; groupIndex < resourceGroupCount; groupIndex++)
        {
            string resourceGroup = $"rg-{groupIndex}";

            for (int nodeIndex = 0; nodeIndex < nodesPerGroup; nodeIndex++)
            {
                string nodeId = $"node-{groupIndex}-{nodeIndex}";
                string armId =
                    $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/Microsoft.Network/virtualNetworks/vnet-{groupIndex}-{nodeIndex}";

                GraphNode node = new()
                {
                    NodeId = nodeId,
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = $"vnet-{groupIndex}-{nodeIndex}",
                    SourceType = "azure-inventory-snapshot",
                    SourceId = armId,
                };

                node.Properties["arm.id"] = armId;
                node.Properties["arm.type"] = "Microsoft.Network/virtualNetworks";
                node.Properties["arm.resourceGroup"] = resourceGroup;
                node.Properties["arm.subscriptionId"] = "sub";
                nodes.Add(node);

                if (previous is not null && nodeIndex == 0 && groupIndex > 0)
                {
                    edges.Add(new GraphEdge
                    {
                        EdgeId = $"edge-{edgeIndex++}",
                        FromNodeId = previous.NodeId,
                        ToNodeId = nodeId,
                        EdgeType = GraphEdgeTypes.ConnectsTo,
                        Weight = 1.0d,
                    });
                }

                previous = node;
            }
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges = edges,
        };
    }
}
