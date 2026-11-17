using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramForestSubscriptionFrameResolverTests
{
    public static TheoryData<DiagramMode, bool> SubscriptionScopeExpectations { get; } = new()
    {
        { DiagramMode.Executive, true },
        { DiagramMode.Architecture, true },
        { DiagramMode.Network, true },
        { DiagramMode.Security, true },
        { DiagramMode.Identity, true },
        { DiagramMode.Data, true },
        { DiagramMode.DataFlow, true },
        { DiagramMode.DataArchitecture, true },
        { DiagramMode.FullSubscription, true },
        { DiagramMode.ResourceGroup, false },
        { DiagramMode.SelectedResources, false },
        { DiagramMode.DependencyNeighborhood, false },
    };

    [Theory]
    [MemberData(nameof(SubscriptionScopeExpectations))]
    public void ShouldDraw_matches_subscription_scoped_modes(DiagramMode mode, bool expected)
    {
        string title = $"Azure inventory ({mode})";

        DiagramForestSubscriptionFrameResolver.ShouldDraw(title).Should().Be(expected);
    }

    [Fact]
    public void Resolve_returns_bounds_for_subscription_scoped_title()
    {
        DiagramForestNestedFrameBounds? bounds = DiagramForestSubscriptionFrameResolver.Resolve(
            "Azure inventory (FullSubscription)",
            [
                new DiagramResourceGroupPacker.NodePlacementBounds(
                    new DiagramNode { NodeId = "a", Label = "a" },
                    10,
                    20,
                    100,
                    80,
                    "cell",
                    null,
                    false),
            ]);

        bounds.Should().NotBeNull();
        bounds!.FrameId.Should().Be("sub-frame");
        bounds.Label.Should().Be("Subscription name was not stored.");
    }

    [Fact]
    public void Resolve_labels_whitespace_subscription_suffix_as_stored_empty()
    {
        DiagramForestNestedFrameBounds? bounds = DiagramForestSubscriptionFrameResolver.Resolve(
            "Azure inventory (FullSubscription) —    ",
            [
                new DiagramResourceGroupPacker.NodePlacementBounds(
                    new DiagramNode { NodeId = "a", Label = "a" },
                    10,
                    20,
                    100,
                    80,
                    "cell",
                    null,
                    false),
            ]);

        bounds.Should().NotBeNull();
        bounds!.Label.Should().Be("Subscription name was stored empty.");
    }

    [Fact]
    public void ShouldDraw_throws_when_title_is_null()
    {
        Action act = () => DiagramForestSubscriptionFrameResolver.ShouldDraw(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
