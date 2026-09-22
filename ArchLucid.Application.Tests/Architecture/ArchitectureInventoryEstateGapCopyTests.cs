using ArchLucid.Application.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureInventoryEstateGapCopyTests
{
    [Fact]
    public void FormatUnboundLine_returns_estate_gap_when_inventory_is_unbound()
    {
        ArchitectureInventoryEstateGapCopy.FormatUnboundLine(false)
            .Should().Be(ArchitectureInventoryEstateGapCopy.UnboundEstateGapLine);
    }

    [Fact]
    public void FormatUnboundLine_returns_null_when_bound_or_not_applicable()
    {
        ArchitectureInventoryEstateGapCopy.FormatUnboundLine(true).Should().BeNull();
        ArchitectureInventoryEstateGapCopy.FormatUnboundLine(null).Should().BeNull();
    }

    [Fact]
    public void FormatCareerExportMarkdown_includes_inventory_estate_section_when_unbound()
    {
        string markdown = ArchitectureInventoryEstateGapCopy.FormatCareerExportMarkdown(false);

        markdown.Should().Contain(ArchitectureInventoryEstateGapCopy.CareerExportHeading);
        markdown.Should().Contain(ArchitectureInventoryEstateGapCopy.UnboundEstateGapLine);
    }
}
