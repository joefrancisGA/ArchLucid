using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryRouteTableRouteParserTests
{
    [Fact]
    public void Parse_reads_routes_from_json_property()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                """
                [
                  {
                    "name": "to-firewall",
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopIpAddress": "10.0.0.4"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("10.1.0.0/24");
        routes[0].NextHopType.Should().Be("VirtualAppliance");
        routes[0].NextHopIpAddress.Should().Be("10.0.0.4");
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_ip_address_is_percent_encoded_json_reference_scalar_wrapping_plain_ipv6()
    {
        const string nextHopIp = "2001:db8::1";
        string referenceScalar = JsonSerializer.Serialize(new { id = nextHopIp });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopIpAddress": {{JsonSerializer.Serialize(encodedScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_reference_is_percent_encoded_json_reference_scalar_wrapping_plain_ipv6()
    {
        const string nextHopIp = "2001:db8::1";
        string referenceScalar = JsonSerializer.Serialize(new { id = nextHopIp });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopReference": {{JsonSerializer.Serialize(encodedScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_is_percent_encoded_json_reference_scalar_wrapping_plain_ipv6()
    {
        const string nextHopIp = "2001:db8::1";
        string referenceScalar = JsonSerializer.Serialize(new { id = nextHopIp });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": {{JsonSerializer.Serialize(encodedScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_ip_address_is_percent_encoded_json_reference_scalar_wrapping_plain_ipv4()
    {
        const string nextHopIp = "10.0.0.4";
        string referenceScalar = JsonSerializer.Serialize(new { id = nextHopIp });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopIpAddress": {{JsonSerializer.Serialize(encodedScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_ip_address_is_percent_encoded_plain_ipv4_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopIpAddress": {{JsonSerializer.Serialize(encodedIp)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_ip_address_is_percent_encoded_plain_ipv6_scalar()
    {
        const string nextHopIp = "2001:db8::1";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopIpAddress": {{JsonSerializer.Serialize(encodedIp)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_type_when_routes_json_uses_pascal_case_property_name()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                """
                [
                  {
                    "properties": {
                      "addressPrefix": "0.0.0.0/0",
                      "NextHopType": "VirtualNetworkGateway"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_next_hop_is_json_string_scalar_wrapping_id_object()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string nextHopScalar = JsonSerializer.Serialize(new { id = nvaArmId });

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": {{JsonSerializer.Serialize(nextHopScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_percent_encoded_plain_ipv4_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encodedIp,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_percent_encoded_plain_ipv6_scalar()
    {
        const string nextHopIp = "2001:db8::1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encodedIp,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_json_object_with_resource_id_only()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] =
                JsonSerializer.Serialize(new { resourceId = nvaArmId }),
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_percent_encoded_json_reference_scalar_wrapping_plain_ipv6()
    {
        const string nextHopIp = "2001:db8::1";
        string referenceScalar = JsonSerializer.Serialize(new { id = nextHopIp });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encodedScalar,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_json_string_scalar_wrapping_plain_ipv4()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = jsonStringScalar,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_triply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encodedOnce = Uri.EscapeDataString(jsonStringScalar);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        string encodedThrice = Uri.EscapeDataString(encodedTwice);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encodedThrice,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quadruply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encodedOnce = Uri.EscapeDataString(jsonStringScalar);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        string encodedThrice = Uri.EscapeDataString(encodedTwice);
        string encodedFourTimes = Uri.EscapeDataString(encodedThrice);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encodedFourTimes,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 5; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sextuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 6; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 7; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 8; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Theory]
    [InlineData(9)]
    [InlineData(10)]
    [InlineData(11)]
    [InlineData(12)]
    [InlineData(13)]
    [InlineData(14)]
    [InlineData(15)]
    [InlineData(16)]
    [InlineData(17)]
    [InlineData(18)]
    [InlineData(19)]
    [InlineData(20)]
    [InlineData(21)]
    [InlineData(22)]
    public void Parse_leaves_residual_percent_encoding_when_explicit_flattened_next_hop_ip_address_exceeds_eight_pass_decode_cap(
        int escapeDepth)
    {
        const string nextHopIp = "10.0.0.4";
        const int decodePassCap = 8; // AzureInventoryRouteTableRouteParser.PercentDecodeUntilStable

        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < escapeDepth; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string expected = jsonStringScalar;
        for (int i = 0; i < escapeDepth - decodePassCap; i++)
        {
            expected = Uri.EscapeDataString(expected);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(expected);
    }

    [Theory]
    [InlineData(23)]
    [InlineData(24)]
    [InlineData(25)]
    [InlineData(26)]
    [InlineData(27)]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_percent_encoded_json_string_scalar_past_decode_cap(
        int escapeDepth)
    {
        const string nextHopIp = "10.0.0.4";
        string encoded = JsonSerializer.Serialize(nextHopIp);
        for (int i = 0; i < escapeDepth; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain(nextHopIp);
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }


    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_triovigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 23; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattuorvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 24; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quinvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 25; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sexvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 26; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septenvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 27; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octovigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 28; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novemvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 29; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_trigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 30; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_untrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 31; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duotrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 32; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_tretrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 33; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattuortrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 34; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quintrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 35; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sextrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 36; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septentrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 37; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octotrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 38; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novemtrigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 39; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quadragintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 40; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_unquadragintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 41; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duquadragintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 42; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_trequadragintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 43; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattuorquadragintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 44; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 50; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_unquinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 51; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duquinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 52; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_trequinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 53; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattorquinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 54; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quinququinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 55; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sexquinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 56; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septuquinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 57; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octoquinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 58; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novemquinquagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 59; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 60; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_unsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 61; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duosexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 62; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_tresexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 63; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattuorsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 64; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quinsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 65; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sexsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 66; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 67; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octosexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 68; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novemsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 69; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_decemsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 70; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_undecemsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 71; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duodecimsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 72; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_tredecimsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 73; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattuordecimsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 74; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quindecimsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 75; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sedecimsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 76; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septendecimsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 77; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octodecimsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 78; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novendecimsexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 79; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 80; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_unvigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 81; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duovigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 82; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_trevigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 83; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattuorvigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 84; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quinvigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 85; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sexvigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 86; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septenvigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 87; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octovigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 88; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novemvigintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 89; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_nonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 90; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_unnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 91; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duononagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 92; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_triononagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 93; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quadnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 94; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quintnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 95; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sexnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 96; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 97; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 98; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novenonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 99; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_decnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 100; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_undecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 101; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duodecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 102; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_tredecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 103; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattuordecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 104; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quindecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 105; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sedecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 106; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septendecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 107; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octodecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 108; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novemdecnonagintisexagintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 109; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_decvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 110; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_undevigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 111; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_duodecvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 112; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_tredecvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 113; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quattuordecvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 114; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_quindecvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 115; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_sedecvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 116; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_septendecvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 117; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_octodecvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 118; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_novemdecvigintuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 119; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuply_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 120; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyunary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 121; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplybinary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 122; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyternary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 123; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyquaternary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 124; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyquinary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 125; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplysenary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 126; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyseptenary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 127; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyoctonary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 128; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplynonary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 129; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplydenary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 130; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyundenary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 131; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyduodenary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 132; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplytridenary_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 133; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_vigintuplycentuplyquaternary_at_layer_one_hundred_thirty_four_percent_encoded_json_string_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < 134; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_percent_encoded_json_reference_scalar_wrapping_plain_ipv4()
    {
        const string nextHopIp = "10.0.0.4";
        string referenceScalar = JsonSerializer.Serialize(new { id = nextHopIp });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encodedScalar,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_ip_address_is_percent_encoded_json_reference_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string referenceScalar = JsonSerializer.Serialize(new { resourceId = nvaArmId });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encodedScalar,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_next_hop_ip_address_is_percent_encoded_json_string_scalar_wrapping_arm_reference()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string referenceScalar = JsonSerializer.Serialize(new { resourceId = nvaArmId });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHopIpAddress": {{JsonSerializer.Serialize(encodedScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_next_hop_is_percent_encoded_json_string_scalar_wrapping_reference_object_with_percent_encoded_id_key_only()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string nextHopScalar = JsonSerializer.Serialize(new { id = Uri.EscapeDataString(nvaArmId) });
        string encodedScalar = Uri.EscapeDataString(nextHopScalar);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": {{JsonSerializer.Serialize(encodedScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_routes_json_next_hop_is_percent_encoded_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string encodedArmId = Uri.EscapeDataString(nvaArmId);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": {{JsonSerializer.Serialize(encodedArmId)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_is_percent_encoded_plain_ipv4_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": {{JsonSerializer.Serialize(encodedIp)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().BeNull();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_routes_json_next_hop_reference_is_percent_encoded_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string encodedArmId = Uri.EscapeDataString(nvaArmId);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHopReference": {{JsonSerializer.Serialize(encodedArmId)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_reference_is_percent_encoded_plain_ipv4_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopReference": {{JsonSerializer.Serialize(encodedIp)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().BeNull();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_routes_json_next_hop_reference_is_percent_encoded_plain_ipv6_scalar()
    {
        const string nextHopIp = "2001:db8::1";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.1.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopReference": {{JsonSerializer.Serialize(encodedIp)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().BeNull();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_routes_json_next_hop_arm_id_is_percent_encoded_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string encodedArmId = Uri.EscapeDataString(nvaArmId);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHopArmId": {{JsonSerializer.Serialize(encodedArmId)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_next_hop_is_percent_encoded_json_string_scalar_wrapping_resource_id_only_reference_object()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string nextHopScalar = JsonSerializer.Serialize(new { resourceId = nvaArmId });
        string encodedScalar = Uri.EscapeDataString(nextHopScalar);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": {{JsonSerializer.Serialize(encodedScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_reference_json_object_has_metadata_and_resource_id_only()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string referenceJson = JsonSerializer.Serialize(new { tags = Array.Empty<string>(), resourceId = nvaArmId });

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = referenceJson,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_json_object_with_resource_id_only()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] =
                JsonSerializer.Serialize(new { resourceId = nvaArmId }),
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_percent_encoded_json_reference_scalar_with_resource_id_only()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string referenceScalar = JsonSerializer.Serialize(new { resourceId = nvaArmId });
        string encodedScalar = Uri.EscapeDataString(referenceScalar);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = encodedScalar,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_percent_encoded_json_object_with_resource_id_key()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string referenceJson = JsonSerializer.Serialize(new { name = "nva", resourceId = Uri.EscapeDataString(nvaArmId) });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = encodedReference,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_next_hop_is_json_string_scalar_wrapping_resource_id_only_reference_object()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string nextHopScalar = JsonSerializer.Serialize(new { resourceId = nvaArmId });

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": {{JsonSerializer.Serialize(nextHopScalar)}}
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_next_hop_object_uses_resource_id_key_only()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": { "resourceId": "{{nvaArmId}}" }
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_nested_object_uses_pascal_case_id_property()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                $$"""
                [
                  {
                    "properties": {
                      "addressPrefix": "10.0.0.0/8",
                      "nextHopType": "VirtualAppliance",
                      "nextHop": { "Id": "{{nvaArmId}}" }
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_routes_when_flattened_property_key_uses_pascal_case_routes()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["Routes"] =
                """
                [
                  {
                    "properties": {
                      "addressPrefix": "0.0.0.0/0",
                      "nextHopType": "VirtualNetworkGateway"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_routes_when_route_fields_are_on_route_element_without_properties_bag()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                """
                [
                  {
                    "addressPrefix": "0.0.0.0/0",
                    "nextHopType": "VirtualNetworkGateway"
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("0.0.0.0/0");
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_routes_when_routes_json_is_string_scalar_wrapping_route_array()
    {
        string innerRoutes =
            """
            [
              {
                "properties": {
                  "addressPrefix": "0.0.0.0/0",
                  "nextHopType": "VirtualNetworkGateway"
                }
              }
            ]
            """;

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] = JsonSerializer.Serialize(innerRoutes),
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("0.0.0.0/0");
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_routes_when_route_element_uses_pascal_case_properties_bag()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                """
                [
                  {
                    "Properties": {
                      "addressPrefix": "10.2.0.0/24",
                      "nextHopType": "VirtualAppliance",
                      "nextHopIpAddress": "10.0.0.5"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("10.2.0.0/24");
        routes[0].NextHopType.Should().Be("VirtualAppliance");
        routes[0].NextHopIpAddress.Should().Be("10.0.0.5");
    }

    [Fact]
    public void Parse_reads_routes_when_route_element_is_json_string_scalar()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] =
                """
                [
                  "{\"properties\":{\"addressPrefix\":\"0.0.0.0/0\",\"nextHopType\":\"VirtualNetworkGateway\"}}"
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_explicit_flattened_route_when_only_next_hop_type_key_is_present()
    {
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}.nextHopType"] = "VirtualNetworkGateway",
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_routes_json_when_explicit_flattened_route_has_prefix_only()
    {
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}.addressPrefix"] = "0.0.0.0/0",
            ["routes"] =
                """
                [
                  {
                    "properties": {
                      "addressPrefix": "0.0.0.0/0",
                      "nextHopType": "VirtualNetworkGateway"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_routes_json_when_explicit_flattened_route_index_is_placeholder()
    {
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}.addressPrefix"] = string.Empty,
            ["routes"] =
                """
                [
                  {
                    "properties": {
                      "addressPrefix": "0.0.0.0/0",
                      "nextHopType": "VirtualNetworkGateway"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_explicit_flattened_route_properties_when_suffix_casing_differs()
    {
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}.AddressPrefix"] = "10.1.0.0/24",
            [$"{routePrefix}.NextHopType"] = "VirtualAppliance",
            [$"{routePrefix}.NextHopIpAddress"] = "10.0.0.4",
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("10.1.0.0/24");
        routes[0].NextHopType.Should().Be("VirtualAppliance");
        routes[0].NextHopIpAddress.Should().Be("10.0.0.4");
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_reference_object_is_on_next_hop_key()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] =
                JsonSerializer.Serialize(new { id = nvaArmId }),
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_percent_encoded_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string encodedArmId = Uri.EscapeDataString(nvaArmId);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = encodedArmId,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_triply_percent_encoded_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string encodedOnce = Uri.EscapeDataString(nvaArmId);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        string encodedThrice = Uri.EscapeDataString(encodedTwice);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = encodedThrice,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_doubly_percent_encoded_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string encodedOnce = Uri.EscapeDataString(nvaArmId);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = encodedTwice,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_percent_encoded_quote_wrapped_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string encoded = Uri.EscapeDataString("\"" + nvaArmId + "\"");
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_json_string_scalar_wrapping_quoted_string_id()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string nextHopArmIdScalar = JsonSerializer.Serialize(new { id = "\"" + nvaArmId + "\"" });
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = nextHopArmIdScalar,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_json_string_scalar_wrapping_id_object()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string nextHopArmIdScalar = JsonSerializer.Serialize(new { id = nvaArmId });
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = nextHopArmIdScalar,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_is_percent_encoded_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string encodedArmId = Uri.EscapeDataString(nvaArmId);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = encodedArmId,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_is_percent_encoded_plain_ipv6_scalar()
    {
        const string nextHopIp = "2001:db8::1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = encodedIp,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().BeNull();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_ip_address_when_explicit_flattened_next_hop_is_percent_encoded_plain_ipv4_scalar()
    {
        const string nextHopIp = "10.0.0.4";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string encodedIp = Uri.EscapeDataString(nextHopIp);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = encodedIp,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().BeNull();
        routes[0].NextHopIpAddress.Should().Be(nextHopIp);
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_reference_is_percent_encoded_plain_scalar()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string encodedArmId = Uri.EscapeDataString(nvaArmId);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = encodedArmId,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_reference_has_percent_encoded_id()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string referenceJson = JsonSerializer.Serialize(new { id = Uri.EscapeDataString(nvaArmId) });

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = referenceJson,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_arm_id_is_json_string_scalar_wrapping_percent_encoded_reference_object()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string nextHopArmIdScalar = JsonSerializer.Serialize(new { id = Uri.EscapeDataString(nvaArmId) });
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix}"] = nextHopArmIdScalar,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_reference_is_triply_percent_encoded_json_object()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string referenceJson = JsonSerializer.Serialize(new { id = nvaArmId });
        string encodedOnce = Uri.EscapeDataString(referenceJson);
        string encodedTwice = Uri.EscapeDataString(encodedOnce);
        string encodedThrice = Uri.EscapeDataString(encodedTwice);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = encodedThrice,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_reference_is_percent_encoded_json_object()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string referenceJson = JsonSerializer.Serialize(new { id = Uri.EscapeDataString(nvaArmId) });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = encodedReference,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_reference_is_json_string_scalar_wrapping_percent_encoded_reference_with_resource_id_key_only()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string referenceJson = JsonSerializer.Serialize(new { resourceId = Uri.EscapeDataString(nvaArmId) });
        string encodedReference = Uri.EscapeDataString(referenceJson);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] = encodedReference,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_next_hop_arm_id_when_explicit_flattened_next_hop_reference_has_quoted_string_id()
    {
        const string nvaArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkVirtualAppliances/nva1";
        string idValueWithSurroundingQuotes = "\"" + nvaArmId + "\"";
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.0.0.0/8",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix}"] =
                JsonSerializer.Serialize(new { id = idValueWithSurroundingQuotes }),
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopArmId.Should().Be(nvaArmId.ToLowerInvariant());
    }

    [Fact]
    public void Parse_reads_explicit_flattened_route_when_row_is_json_string_scalar_wrapping_route_object()
    {
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string routeObject =
            """
            {
              "properties": {
                "addressPrefix": "10.0.0.0/8",
                "nextHopType": "VirtualNetworkGateway"
              }
            }
            """;

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [routePrefix] = JsonSerializer.Serialize(routeObject),
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("10.0.0.0/8");
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_routes_when_routes_json_is_double_encoded_string_scalar_at_root()
    {
        string innerRoutes =
            """
            [
              {
                "properties": {
                  "addressPrefix": "0.0.0.0/0",
                  "nextHopType": "VirtualNetworkGateway"
                }
              }
            ]
            """;
        string routesJson = JsonSerializer.Serialize(JsonSerializer.Serialize(innerRoutes));

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["routes"] = routesJson,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }

    [Fact]
    public void Parse_reads_explicit_flattened_route_when_row_blob_is_flat_route_object_without_properties_bag()
    {
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [routePrefix] =
                """
                {
                  "addressPrefix": "10.1.0.0/16",
                  "nextHopType": "Internet"
                }
                """,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("10.1.0.0/16");
        routes[0].NextHopType.Should().Be("Internet");
    }

    [Fact]
    public void Parse_reads_explicit_flattened_route_when_row_blob_is_string_scalar_wrapping_flat_route_object()
    {
        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";
        string flatRoute =
            """
            {
              "addressPrefix": "10.2.0.0/24",
              "nextHopType": "VirtualNetworkGateway"
            }
            """;

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [routePrefix] = JsonSerializer.Serialize(flatRoute),
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].AddressPrefix.Should().Be("10.2.0.0/24");
        routes[0].NextHopType.Should().Be("VirtualNetworkGateway");
    }
}
