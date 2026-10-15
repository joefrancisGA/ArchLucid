using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryNetworkSecurityPerimeterResourceTypesTests
{
    [Fact]
    public void TryParsePerimeterIdFromResourceAssociationId_returns_parent_perimeter()
    {
        const string associationId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityPerimeters/databricks-nsp/resourceAssociations/storage-1";
        const string perimeterId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityPerimeters/databricks-nsp";

        bool parsed = AzureInventoryNetworkSecurityPerimeterResourceTypes.TryParsePerimeterIdFromResourceAssociationId(
            associationId,
            out string? found);

        parsed.Should().BeTrue();
        found.Should().Be(perimeterId);
    }

    [Theory]
    [InlineData("Microsoft.Network/networkSecurityPerimeters", true)]
    [InlineData("microsoft.network/networksecurityperimeters", true)]
    [InlineData(
        "Microsoft.Network/networkSecurityPerimeters/databricks-nsp/resourceAssociations/storage-1",
        false)]
    [InlineData("Microsoft.Network/networkSecurityPerimeters/profiles/default", false)]
    public void IsPerimeterResourceType_matches_only_parent_resource(string armType, bool expected)
    {
        AzureInventoryNetworkSecurityPerimeterResourceTypes.IsPerimeterResourceType(armType)
            .Should()
            .Be(expected);
    }

    [Theory]
    [InlineData(
        "Microsoft.Network/networkSecurityPerimeters/databricks-nsp/resourceAssociations/storage-1",
        true)]
    [InlineData("Microsoft.Network/networkSecurityPerimeters/profiles/default", true)]
    [InlineData("Microsoft.Network/networkSecurityPerimeters", false)]
    public void IsDiagramOmitChildType_matches_nsp_children(string armType, bool expected)
    {
        AzureInventoryNetworkSecurityPerimeterResourceTypes.IsDiagramOmitChildType(armType)
            .Should()
            .Be(expected);
    }
}
