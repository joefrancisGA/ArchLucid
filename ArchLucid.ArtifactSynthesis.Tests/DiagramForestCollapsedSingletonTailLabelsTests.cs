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

    [Fact]
    public void BuildCollapsedSingletonTailInvitationLine_mentions_sample_and_total()
    {
        DiagramNode node = new()
        {
            Label = "Other resource groups (9)",
            IsCollapsedResourceGroupTail = true,
            CollapsedResourceGroupTailMemberNames = ["rg-a", "rg-b", "rg-c"],
        };

        DiagramForestCollapsedSingletonTailLabels.BuildCollapsedSingletonTailInvitationLine(node)
            .Should()
            .Contain("3 of 9");
    }
}
