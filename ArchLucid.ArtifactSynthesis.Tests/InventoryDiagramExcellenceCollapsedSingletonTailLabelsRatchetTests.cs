using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceCollapsedSingletonTailLabelsRatchetTests
{
    [Fact]
    public void InventoryDiagramExcellence_collapsed_tail_label_uses_summary_title_for_resource_group_caption()
    {
        DiagramNode node = new()
        {
            Label = "Other resource groups (9)",
            ArmResourceGroup = DiagramForestSingletonTailPlanner.CollapsedTailResourceGroupName,
            IsCollapsedResourceGroupTail = true,
        };

        DiagramForestCollapsedSingletonTailLabels.ResolveResourceGroupCaption(node, "fallback")
            .Should().Be("Other resource groups (9)");
    }

    [Fact]
    public void InventoryDiagramExcellence_collapsed_tail_label_parses_neighborhood_resource_count_from_summary_title()
    {
        DiagramNode node = new()
        {
            Label = "Other resource groups (9)",
            IsCollapsedResourceGroupTail = true,
        };

        DiagramForestCollapsedSingletonTailLabels.ResolveNeighborhoodResourceCount([node])
            .Should().Be(9);
    }
}
