using System.Text.Json;

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
    public void EnumerateConnectedRemoteVnetArmIds_skips_disconnected_and_missing_state()
    {
        const string remoteConnected =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-connected";
        const string remoteDisconnected =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-disconnected";
        const string remoteUnknown =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-unknown";
        string json = $$"""
            [
              {
                "name": "peer-connected",
                "properties": {
                  "peeringState": "Connected",
                  "remoteVirtualNetwork": { "id": "{{remoteConnected}}" }
                }
              },
              {
                "name": "peer-disconnected",
                "properties": {
                  "peeringState": "Disconnected",
                  "remoteVirtualNetwork": { "id": "{{remoteDisconnected}}" }
                }
              },
              {
                "name": "peer-unknown",
                "properties": {
                  "remoteVirtualNetwork": { "id": "{{remoteUnknown}}" }
                }
              }
            ]
            """;

        IReadOnlyList<string> connected =
            AzureInventoryVnetPeeringParser.EnumerateConnectedRemoteVnetArmIds(json);

        connected.Should().ContainSingle()
            .Which.Should().Be(ArmResourceIdNormalizer.Normalize(remoteConnected));
    }

    [Fact]
    public void EnumerateRemoteVnetIds_reads_remote_when_remote_virtual_network_is_json_string_scalar_wrapping_id_object()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string remoteScalar = JsonSerializer.Serialize(new { id = remoteId });
        string json = $$"""
            [
              {
                "name": "peer-to-b",
                "properties": {
                  "remoteVirtualNetwork": {{JsonSerializer.Serialize(remoteScalar)}}
                }
              }
            ]
            """;

        IReadOnlyList<string> remoteIds = AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(json);

        remoteIds.Should().ContainSingle()
            .Which.Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
    }

    [Fact]
    public void EnumerateRemoteVnetIds_reads_remote_when_peering_array_element_is_json_string_scalar_wrapping_peering_object()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string peeringObject =
            $$"""
            {
              "name": "peer-to-b",
              "properties": {
                "remoteVirtualNetwork": { "id": "{{remoteId}}" }
              }
            }
            """;
        string json =
            $$"""
            [
              {{JsonSerializer.Serialize(peeringObject)}}
            ]
            """;

        IReadOnlyList<string> remoteIds = AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(json);

        remoteIds.Should().ContainSingle()
            .Which.Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
    }

    [Fact]
    public void ParsePeerings_reads_peering_state_when_peering_array_element_is_json_string_scalar_wrapping_peering_object()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string peeringObject =
            $$"""
            {
              "name": "peer-to-b",
              "properties": {
                "peeringState": "Connected",
                "remoteVirtualNetwork": { "id": "{{remoteId}}" }
              }
            }
            """;
        string json =
            $$"""
            [
              {{JsonSerializer.Serialize(peeringObject)}}
            ]
            """;

        IReadOnlyList<AzureInventoryVnetPeeringRecord> peerings = AzureInventoryVnetPeeringParser.ParsePeerings(json);

        AzureInventoryVnetPeeringRecord peering = peerings.Should().ContainSingle().Subject;
        peering.RemoteVirtualNetworkArmId.Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
        peering.PeeringState.Should().Be("Connected");
        AzureInventoryVnetPeeringParser.IsConnectedPeeringState(peering.PeeringState).Should().BeTrue();
    }

    [Fact]
    public void EnumerateRemoteVnetIds_reads_remote_when_peerings_json_is_string_scalar_wrapping_peering_array()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string innerPeerings =
            $$"""
            [
              {
                "name": "peer-to-b",
                "properties": {
                  "remoteVirtualNetwork": { "id": "{{remoteId}}" }
                }
              }
            ]
            """;
        string peeringsJson = JsonSerializer.Serialize(innerPeerings);

        IReadOnlyList<string> remoteIds = AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(peeringsJson);

        remoteIds.Should().ContainSingle()
            .Which.Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
    }

    [Fact]
    public void EnumerateRemoteVnetIds_reads_remote_when_peerings_json_is_double_encoded_string_scalar_at_root()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string innerPeerings =
            $$"""
            [
              {
                "name": "peer-to-b",
                "properties": {
                  "remoteVirtualNetwork": { "id": "{{remoteId}}" }
                }
              }
            ]
            """;
        string peeringsJson = JsonSerializer.Serialize(JsonSerializer.Serialize(innerPeerings));

        IReadOnlyList<string> remoteIds = AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(peeringsJson);

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

    [Fact]
    public void EnumerateRemoteVnetIds_reads_remote_vnet_when_peering_json_id_is_percent_encoded_plain_arm_scalar()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string encodedRemoteId = Uri.EscapeDataString(remoteId);

        string json =
            $$"""
            [
              {
                "properties": {
                  "remoteVirtualNetwork": {
                    "id": {{JsonSerializer.Serialize(encodedRemoteId)}}
                  }
                }
              }
            ]
            """;

        IReadOnlyList<string> remoteIds = AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(json);

        remoteIds.Should().ContainSingle();
        remoteIds[0].Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
    }

    [Fact]
    public void TryReadRemoteVnetIdFromProperties_reads_dotted_remote_virtual_network_id_when_value_is_percent_encoded_plain_arm_scalar()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string encodedRemoteId = Uri.EscapeDataString(remoteId);

        Dictionary<string, string?> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryVnetPeeringParser.RemoteVirtualNetworkIdPropertyKey] = encodedRemoteId,
        };

        string? remoteVnetId = AzureInventoryVnetPeeringParser.TryReadRemoteVnetIdFromProperties(properties);

        remoteVnetId.Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
    }

    [Fact]
    public void TryReadRemoteVnetIdFromProperties_reads_remote_virtual_network_json_blob_when_id_inside_blob_is_percent_encoded_plain_arm_scalar()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string encodedRemoteId = Uri.EscapeDataString(remoteId);
        string blob =
            "{\"remoteVirtualNetwork\":{\"id\":" + JsonSerializer.Serialize(encodedRemoteId) + "}}";

        Dictionary<string, string?> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["remoteVirtualNetwork"] = blob,
        };

        string? remoteVnetId = AzureInventoryVnetPeeringParser.TryReadRemoteVnetIdFromProperties(properties);

        remoteVnetId.Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
    }

    [Fact]
    public void EnumerateConnectedRemoteVnetArmIds_reads_connected_peering_when_peering_json_id_is_percent_encoded_plain_arm_scalar()
    {
        const string remoteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        string encodedRemoteId = Uri.EscapeDataString(remoteId);

        string json =
            $$"""
            [
              {
                "properties": {
                  "peeringState": "Connected",
                  "remoteVirtualNetwork": {
                    "id": {{JsonSerializer.Serialize(encodedRemoteId)}}
                  }
                }
              }
            ]
            """;

        IReadOnlyList<string> connected =
            AzureInventoryVnetPeeringParser.EnumerateConnectedRemoteVnetArmIds(json);

        connected.Should().ContainSingle();
        connected[0].Should().Be(ArmResourceIdNormalizer.Normalize(remoteId));
    }
}
