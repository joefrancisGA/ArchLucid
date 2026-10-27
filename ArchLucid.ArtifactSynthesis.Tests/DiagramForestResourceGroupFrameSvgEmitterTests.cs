using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Suite", "ArtifactSynthesis")]
public sealed class DiagramForestResourceGroupFrameSvgEmitterTests
{
    [Fact]
    public void EmitFrame_labels_missing_resource_group_name_on_canvas()
    {
        XNamespace svg = "http://www.w3.org/2000/svg";
        var frame = new DiagramResourceGroupPacker.ResourceGroupFrameBounds(
            GroupName: "   ",
            FrameCellId: "rg-shared",
            X: 10,
            Y: 20,
            Width: 100,
            Height: 80);

        XElement group = DiagramForestResourceGroupFrameSvgEmitter.EmitLayer(svg, [frame]).Elements().Single();

        group.Descendants(svg + "text")
            .Single(element => element.Attribute("class")?.Value == "rg-frame-label")
            .Value
            .Should()
            .Be(DiagramForestResourceGroupFrameSvgEmitter.ResourceGroupNameNotStoredCaption);
    }
}
