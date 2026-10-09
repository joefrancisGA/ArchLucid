using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramMissingValueLabelTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void EvidenceCurrency_uses_explicit_missing_label_for_blank_reference(string? relationshipLabel)
    {
        InventoryDiagramEvidenceCurrency? currency =
            InventoryDiagramEvidenceCurrencyLabels.ResolveFromSourceEvidenceReference(relationshipLabel);

        currency.Should().BeNull();
        InventoryDiagramEvidenceCurrencyLabels
            .Format(currency, "relationship")
            .Should()
            .Be("Evidence currency was not stored · relationship");
    }

    [Fact]
    public void RouteOutline_uses_explicit_missing_prefix_for_none_next_hop()
    {
        InventoryDiagramRouteOutlineSentenceFormatter
            .TryFormat(
                new AzureInventoryRouteTableRoute
                {
                    AddressPrefix = " ",
                    NextHopType = "None",
                },
                resolvedNextHopName: null)
            .Should()
            .Be("Address prefix was not stored");
    }
}
