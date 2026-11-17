using ArchLucid.Application.InfraEvidence.Mermaid;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceInventoryPngExportHonestyTests
{
    [Theory]
    [InlineData("inventory-forest", true)]
    [InlineData("graphviz-fdp", true)]
    [InlineData("mermaid-dagre", false)]
    public void UsesGraphvizInventoryPngRaster_matches_layout_engine(string layoutEngine, bool expected)
    {
        InfraEvidenceInventoryPngExportHonesty.UsesGraphvizInventoryPngRaster(layoutEngine).Should().Be(expected);
    }

    [Fact]
    public void DescribeGraphvizPngRaster_names_engine()
    {
        InfraEvidenceInventoryPngExportHonesty.DescribeGraphvizPngRaster("graphviz-fdp")
            .Should()
            .Contain("Graphviz")
            .And.Contain("graphviz-fdp");
    }
}
