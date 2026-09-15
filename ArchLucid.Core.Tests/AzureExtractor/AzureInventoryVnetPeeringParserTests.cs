using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryVnetPeeringParserTests
{
    [Theory]
    [InlineData("Microsoft.Network/virtualNetworks", true)]
    [InlineData("microsoft.network/virtualnetworks", true)]
    [InlineData("Microsoft.Network/virtualNetworks/subnets", false)]
    [InlineData("Microsoft.Network/virtualNetworks/virtualNetworkPeerings", false)]
    [InlineData(null, false)]
    public void IsVirtualNetworkResourceType_requires_exact_vnet_type(string? resourceType, bool expected)
    {
        AzureInventoryVnetPeeringParser.IsVirtualNetworkResourceType(resourceType).Should().Be(expected);
    }

    [Theory]
    [InlineData("Microsoft.Network/virtualNetworks/virtualNetworkPeerings", true)]
    [InlineData("microsoft.network/virtualnetworks/virtualnetworkpeerings", true)]
    [InlineData("Microsoft.Network/virtualNetworks", false)]
    [InlineData("Microsoft.Network/virtualNetworks/subnets", false)]
    [InlineData(null, false)]
    public void IsPeeringResourceType_detects_peering_child_type(string? resourceType, bool expected)
    {
        AzureInventoryVnetPeeringParser.IsPeeringResourceType(resourceType).Should().Be(expected);
    }

    [Fact]
    public void TryGetParentVirtualNetworkArmId_strips_peering_child_segment()
    {
        const string peeringId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/virtualNetworkPeerings/peer-to-b";

        string? parentId = AzureInventoryVnetPeeringParser.TryGetParentVirtualNetworkArmId(peeringId);

        parentId.Should().Be(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a");
    }

    [Fact]
    public void EnumerateRemoteVnetIds_reads_nested_remote_virtual_network_id()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string json = $$"""
            [
              {
                "name": "peer-to-b",
                "properties": {
                  "remoteVirtualNetwork": { "id": "{{remoteId}}" }
                }
              }
            ]
            """;

        IReadOnlyList<string> remoteIds = AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(json);

        remoteIds.Should().ContainSingle()
            .Which.Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
    }

    [Fact]
    public void EnumerateRemoteVnetIds_skips_peerings_without_remote_id()
    {
        const string json = """
            [
              { "name": "broken", "properties": {} }
            ]
            """;

        AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(json).Should().BeEmpty();
    }

    [Fact]
    public void HasPeeringCollectionEvidence_is_true_for_nested_remote_ids()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryVnetPeeringParser.PeeringsPropertyKey] = """
                [{"properties":{"remoteVirtualNetwork":{"id":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b"}}}]
                """,
        };

        AzureInventoryVnetPeeringParser.HasPeeringCollectionEvidence(
                "Microsoft.Network/virtualNetworks",
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a",
                properties)
            .Should().BeTrue();
    }

    [Fact]
    public void TryGetPeeringsJson_matches_property_key_without_relying_on_comparer()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["VirtualNetworkPeerings"] = "[]",
        };

        AzureInventoryVnetPeeringParser.TryGetPeeringsJson(properties, out string? peeringsJson)
            .Should().BeTrue();
        peeringsJson.Should().Be("[]");
    }
}
