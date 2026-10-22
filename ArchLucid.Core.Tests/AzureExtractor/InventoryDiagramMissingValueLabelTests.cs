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

    [Fact]
    public void RouteOutline_labels_missing_next_hop_type_when_name_does_not_resolve()
    {
        InventoryDiagramRouteOutlineSentenceFormatter
            .TryFormat(
                new AzureInventoryRouteTableRoute
                {
                    AddressPrefix = "10.0.0.0/24",
                    NextHopType = null,
                },
                resolvedNextHopName: null)
            .Should()
            .Be("Next hop type was not stored");
    }

    [Fact]
    public void RouteOutline_labels_missing_next_hop_name_for_stored_virtual_appliance_type()
    {
        InventoryDiagramRouteOutlineSentenceFormatter
            .TryFormat(
                new AzureInventoryRouteTableRoute
                {
                    AddressPrefix = "10.0.0.0/24",
                    NextHopType = "VirtualAppliance",
                },
                resolvedNextHopName: null)
            .Should()
            .Be("Next hop name was not stored for VirtualAppliance on 10.0.0.0/24.");
    }

    [Fact]
    public void RouteOutline_describes_internet_next_hop_with_stored_prefix()
    {
        InventoryDiagramRouteOutlineSentenceFormatter
            .TryFormat(
                new AzureInventoryRouteTableRoute
                {
                    AddressPrefix = "0.0.0.0/1",
                    NextHopType = "Internet",
                },
                resolvedNextHopName: null)
            .Should()
            .Be("Traffic to 0.0.0.0/1 is sent directly to the internet.");
    }
}
