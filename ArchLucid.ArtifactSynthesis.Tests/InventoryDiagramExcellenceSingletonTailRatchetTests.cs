using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceSingletonTailRatchetTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Theory]
    [InlineData(DiagramMode.FullSubscription)]
    [InlineData(DiagramMode.Executive)]
    [InlineData(DiagramMode.Network)]
    public void InventoryDiagramExcellence_singleton_tail_collapses_isolated_singleton_rgs_on_subscription_modes(DiagramMode mode)
    {
        DiagramAst ast = InventoryDiagramExcellenceSingletonTailFixture.BuildSubscriptionScoped(mode);
        DiagramForestLayoutResult layout = renderer.Render(ast);

        layout.Succeeded.Should().BeTrue(layout.Error);
        layout.Svg.Should().Contain($"Other resource groups ({DiagramForestSingletonTailPlanner.SingletonThreshold + 1})");
        layout.Svg.Should().NotContain("singleton-0", "isolated singleton cards must fold into the tail summary");
        layout.Svg.Should().Contain("large-vm");
    }

    [Theory]
    [InlineData(DiagramMode.ResourceGroup)]
    [InlineData(DiagramMode.SelectedResources)]
    [InlineData(DiagramMode.DependencyNeighborhood)]
    public void InventoryDiagramExcellence_singleton_tail_skips_hop_focus_modes(DiagramMode mode)
    {
        DiagramAst ast = InventoryDiagramExcellenceSingletonTailFixture.BuildSubscriptionScoped(mode);
        DiagramForestLayoutResult layout = renderer.Render(ast);

        layout.Succeeded.Should().BeTrue(layout.Error);
        layout.Svg.Should().NotContain("Other resource groups");
        layout.Svg.Should().Contain("singleton-0");
    }

    [Fact]
    public void InventoryDiagramExcellence_singleton_tail_keeps_cited_cross_group_singleton()
    {
        DiagramAst ast = InventoryDiagramExcellenceSingletonTailFixture.BuildWithCitedCrossGroupSingleton(DiagramMode.FullSubscription);
        DiagramForestLayoutResult layout = renderer.Render(ast);

        layout.Succeeded.Should().BeTrue(layout.Error);
        layout.Svg.Should().Contain("singleton-cited");
    }

    [Fact]
    public void InventoryDiagramExcellence_singleton_tail_skips_data_flow_mode()
    {
        DiagramAst ast = InventoryDiagramExcellenceSingletonTailFixture.BuildSubscriptionScoped(DiagramMode.DataFlow);
        DiagramForestLayoutResult layout = renderer.Render(ast);

        layout.Succeeded.Should().BeTrue(layout.Error);
        layout.Svg.Should().NotContain("Other resource groups");
        layout.Svg.Should().Contain("singleton-0");
    }
}
