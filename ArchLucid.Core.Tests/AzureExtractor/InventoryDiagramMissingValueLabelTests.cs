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
    public void EvidenceCurrency_does_not_match_log_substring_inside_catalog_reference()
    {
        InventoryDiagramEvidenceCurrency? currency =
            InventoryDiagramEvidenceCurrencyLabels.ResolveFromSourceEvidenceReference(
                "azure-resource-graph:catalog-snapshot-2026-01-01");

        currency.Should().BeNull();
    }

    [Fact]
    public void EvidenceCurrency_current_uses_collected_snapshot_prefix()
    {
        InventoryDiagramEvidenceCurrencyLabels
            .Format(InventoryDiagramEvidenceCurrency.Current, "peering")
            .Should()
            .Be("Collected snapshot · peering");
    }

    [Fact]
    public void EvidenceCurrency_uses_not_stored_for_non_matching_reference_token()
    {
        InventoryDiagramEvidenceCurrency? currency =
            InventoryDiagramEvidenceCurrencyLabels.ResolveFromSourceEvidenceReference(
                "azure-inventory-snapshot:2026-01-01");

        currency.Should().BeNull();
        InventoryDiagramEvidenceCurrencyLabels
            .Format(currency, "peering")
            .Should()
            .Be("Evidence currency was not stored · peering");
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
            .Be("Address prefix was not stored. Next hop type None was stored (no next-hop resource). This is not observed traffic.");
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
            .Be("Route to 0.0.0.0/1 uses next hop type Internet. This is not observed traffic.");
    }

    [Fact]
    public void RouteOutline_labels_missing_prefix_for_vnet_local_next_hop()
    {
        InventoryDiagramRouteOutlineSentenceFormatter
            .TryFormat(
                new AzureInventoryRouteTableRoute
                {
                    AddressPrefix = " ",
                    NextHopType = "VnetLocal",
                },
                resolvedNextHopName: null)
            .Should()
            .Be("Address prefix was not stored. Next hop type is VnetLocal.");
    }

    [Fact]
    public void RouteOutline_labels_default_route_when_prefix_is_zero_cidr()
    {
        InventoryDiagramRouteOutlineSentenceFormatter
            .TryFormat(
                new AzureInventoryRouteTableRoute
                {
                    AddressPrefix = "0.0.0.0/0",
                    NextHopType = "VirtualNetworkGateway",
                },
                resolvedNextHopName: null)
            .Should()
            .Be("Default route 0.0.0.0/0 was not drawn. Next hop type is VirtualNetworkGateway.");
    }

    [Fact]
    public void RouteOutline_describes_vnet_local_next_hop_with_stored_prefix()
    {
        InventoryDiagramRouteOutlineSentenceFormatter
            .TryFormat(
                new AzureInventoryRouteTableRoute
                {
                    AddressPrefix = "10.0.0.0/16",
                    NextHopType = "VnetLocal",
                },
                resolvedNextHopName: null)
            .Should()
            .Be("Route to 10.0.0.0/16 uses next hop type VnetLocal. This is not observed traffic.");
    }
}
