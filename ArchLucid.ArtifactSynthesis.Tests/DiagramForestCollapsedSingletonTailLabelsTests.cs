using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestCollapsedSingletonTailLabelsTests
{
    [Fact]
    public void ResolveResourceGroupCaption_uses_label_for_collapsed_tail()
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
    public void ResolveNeighborhoodResourceCount_uses_collapsed_count_from_label()
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
