using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestSubscriptionFrameResolverTests
{
    public static TheoryData<DiagramMode> AllDiagramModes { get; } = new(Enum.GetValues<DiagramMode>());

    [Theory]
    [MemberData(nameof(AllDiagramModes))]
    public void ShouldDraw_is_false_for_every_diagram_mode(DiagramMode mode)
    {
        string title = $"Azure inventory ({mode})";

        DiagramForestSubscriptionFrameResolver.ShouldDraw(title).Should().BeFalse();
        DiagramForestSubscriptionFrameResolver
            .Resolve(title, Array.Empty<DiagramResourceGroupPacker.NodePlacementBounds>())
            .Should()
            .BeNull();
    }

    [Fact]
    public void ShouldDraw_throws_when_title_is_null()
    {
        Action act = () => DiagramForestSubscriptionFrameResolver.ShouldDraw(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
