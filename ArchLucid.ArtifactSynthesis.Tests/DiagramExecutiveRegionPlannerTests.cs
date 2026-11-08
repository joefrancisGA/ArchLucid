using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramExecutiveRegionPlannerTests
{
    [Fact]
    public void BuildSingleRegionCaption_returns_caption_when_all_nodes_share_one_region()
    {
        GraphNode source = new()
        {
            NodeId = "vm-1",
            NodeType = "TopologyResource",
            Label = "vm",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["arm.location"] = "eastus",
            },
        };

        DiagramNode diagramNode = new()
        {
            NodeId = "diagram-vm-1",
            SeedNodeId = source.NodeId,
            Label = "vm",
        };

        string? caption = DiagramExecutiveRegionPlanner.BuildSingleRegionCaption([source], [diagramNode]);

        caption.Should().Contain("eastus");
        caption.Should().Contain("Region swimlanes appear when two or more regions are present.");
    }

    [Fact]
    public void BuildSingleRegionCaption_appends_unlocated_resource_count()
    {
        GraphNode located = new()
        {
            NodeId = "vm-1",
            Properties = new Dictionary<string, string> { ["arm.location"] = "eastus" },
        };
        GraphNode unlocated = new() { NodeId = "rollup-1" };

        string? caption = DiagramExecutiveRegionPlanner.BuildSingleRegionCaption(
            [located, unlocated],
            [
                new DiagramNode { SeedNodeId = located.NodeId },
                new DiagramNode { SeedNodeId = unlocated.NodeId },
            ]);

        caption.Should().Contain("1 resource(s) had no stored region");
    }

    [Fact]
    public void BuildSingleRegionCaption_returns_null_when_multiple_regions_exist()
    {
        GraphNode east = new()
        {
            NodeId = "east",
            Properties = new Dictionary<string, string> { ["arm.location"] = "eastus" },
        };
        GraphNode west = new()
        {
            NodeId = "west",
            Properties = new Dictionary<string, string> { ["arm.location"] = "westus" },
        };

        string? caption = DiagramExecutiveRegionPlanner.BuildSingleRegionCaption(
            [east, west],
            [
                new DiagramNode { SeedNodeId = east.NodeId },
                new DiagramNode { SeedNodeId = west.NodeId },
            ]);

        caption.Should().BeNull();
    }
}
