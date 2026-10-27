using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramRelationshipLabelTextsTests
{
    [Fact]
    public void FormatPrivateEndpointConnectionLabel_approved_includes_private_access()
    {
        InventoryDiagramRelationshipLabelTexts
            .FormatPrivateEndpointConnectionLabel("Approved")
            .Should()
            .Be("Private access · Approved");
    }

    [Theory]
    [InlineData("Rejected")]
    [InlineData("Disconnected")]
    public void FormatPrivateEndpointConnectionLabel_non_approved_does_not_claim_private_access(string status)
    {
        InventoryDiagramRelationshipLabelTexts
            .FormatPrivateEndpointConnectionLabel(status)
            .Should()
            .Be($"Private endpoint connection: {status}");
    }

    [Fact]
    public void FormatPrivateEndpointConnectionLabel_blank_status_uses_not_stored_sentence()
    {
        InventoryDiagramRelationshipLabelTexts
            .FormatPrivateEndpointConnectionLabel("   ")
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.PrivateEndpointConnectionStatusNotStored);
    }

    [Fact]
    public void FormatPeeringConnectedOffCanvas_mentions_observed_traffic_not_stored()
    {
        InventoryDiagramRelationshipLabelTexts
            .FormatPeeringConnectedOffCanvas("vnet-b")
            .Should()
            .Contain("Observed traffic was not stored.");
    }

    [Fact]
    public void FormatHiddenPublicIpCaption_appends_stored_address_or_not_stored_sentence()
    {
        InventoryDiagramRelationshipLabelTexts
            .FormatHiddenPublicIpCaption("203.0.113.10")
            .Should()
            .Contain("203.0.113.10");

        InventoryDiagramRelationshipLabelTexts
            .FormatHiddenPublicIpCaption(null)
            .Should()
            .Contain(InventoryDiagramRelationshipLabelTexts.PublicIpAddressNotStored);
    }
}
