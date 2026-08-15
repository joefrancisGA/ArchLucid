using ArchLucid.Application.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class InventoryTopologyResourceNodeIndexTests
{
    [Fact]
    public void Resolve_returns_matching_azure_topology_node_ids()
    {
        const string resourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk1";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "azure-node-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "disk1",
                    Properties = new Dictionary<string, string> { ["resourceId"] = resourceId },
                },
            ],
        };

        InventoryTopologyResourceNodeIndex index =
            InventoryTopologyResourceNodeIndex.Build(graph, InventoryTopologyCloudProvider.Azure);

        index.Resolve(resourceId).Should().ContainSingle().Which.Should().Be("azure-node-1");
    }

    [Fact]
    public void Resolve_returns_matching_aws_topology_node_ids()
    {
        const string resourceId = "arn:aws:ec2:us-east-1:123456789012:volume/vol-abc";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "aws-node-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vol-abc",
                    Properties = new Dictionary<string, string> { ["arn"] = resourceId },
                },
            ],
        };

        InventoryTopologyResourceNodeIndex index =
            InventoryTopologyResourceNodeIndex.Build(graph, InventoryTopologyCloudProvider.Aws);

        index.Resolve(resourceId).Should().ContainSingle().Which.Should().Be("aws-node-1");
    }

    [Fact]
    public void Resolve_returns_empty_when_inventory_resource_has_no_graph_match()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "azure-node-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "disk1",
                    Properties = new Dictionary<string, string>
                    {
                        ["resourceId"] =
                            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/other",
                    },
                },
            ],
        };

        InventoryTopologyResourceNodeIndex index =
            InventoryTopologyResourceNodeIndex.Build(graph, InventoryTopologyCloudProvider.Azure);

        index.Resolve("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk1")
            .Should()
            .BeEmpty();
    }
}
