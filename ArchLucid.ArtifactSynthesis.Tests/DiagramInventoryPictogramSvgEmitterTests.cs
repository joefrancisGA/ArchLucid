using System.Xml.Linq;
using ArchLucid.ArtifactSynthesis.Layout;
using FluentAssertions;
using Xunit;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DiagramInventoryPictogramSvgEmitterTests
{
    [Fact]
    public void Emit_includes_accessibility_title_for_category_pictogram()
    {
        XNamespace svg = "http://www.w3.org/2000/svg";
        XElement group = DiagramInventoryPictogramSvgEmitter.Emit(
            svg,
            DiagramInventoryPictogramKind.Compute,
            24,
            0,
            0);

        XElement? title = group.Element(svg + "title");
        title.Should().NotBeNull();
        title!.Value.Should().Be("Compute category pictogram (not a Microsoft product icon).");
    }
}
