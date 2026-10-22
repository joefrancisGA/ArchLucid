using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryVnetCustomDnsIndexTests
{
    private const string VnetArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";

    [Fact]
    public void VnetUsesCustomDns_true_when_flattened_dns_servers_use_indexed_property_keys()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["dhcpOptions.dnsServers.0"] = "10.0.0.4",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "inventory must accept dhcpOptions.dnsServers.{index} flattened property keys");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_flattened_dhcpOptions_property_key_uses_pascal_case()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["DhcpOptions"] = """{"dnsServers":["10.0.0.4"]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "inventory must accept DhcpOptions flattened property key casing variants");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_flat_dhcpOptions_dnsServers_key_uses_pascal_case()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["DhcpOptions.DnsServers"] = "10.0.0.4",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "inventory must accept DhcpOptions.DnsServers flattened property key casing variants");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_json_is_bare_dns_server_array()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """["10.0.0.4"]""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue();
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_json_lists_scalar_dns_server_string()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":"10.0.0.4"}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue();
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_lists_non_azure_server()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":["10.0.0.4"]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue();
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_lists_object_shaped_dns_servers()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":[{"ipAddress":"10.0.0.4"}]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "inventory must accept dhcpOptions dnsServers elements shaped as objects with ipAddress");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_only_azure_default_resolver()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":["168.63.129.16"]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse();
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_flat_dns_servers_list_custom_resolver_after_default_only_json()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":["168.63.129.16"]}""",
                    ["dhcpOptions.dnsServers"] = "10.0.0.4",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "flattened custom DNS must not be ignored when dhcpOptions JSON lists only the Azure default resolver");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_custom_dns_is_on_subnet_resource_row()
    {
        string subnetArm = $"{VnetArm}/subnets/app";

        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = subnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks/subnets",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":["10.0.0.4"]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "custom DNS on a subnet inventory row must attribute to the parent virtual network");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_json_uses_pascal_case_dns_servers_property()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"DnsServers":["10.0.0.4"]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "inventory dhcpOptions JSON must accept DnsServers casing variants from ARM exports");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_is_json_string_scalar_wrapping_object()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = JsonSerializer.Serialize("""{"dnsServers":["10.0.0.4"]}"""),
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "double-encoded dhcpOptions JSON strings must still surface custom DNS resolvers");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_flat_dns_servers_is_json_array_of_only_azure_default()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions.dnsServers"] = """["168.63.129.16"]""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "flattened dhcpOptions.dnsServers JSON arrays must not be comma-split into bracketed pseudo-addresses");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_flat_dns_servers_is_json_array_with_custom_resolver()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions.dnsServers"] = """["10.0.0.4"]""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue();
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_flat_dns_servers_list_default_and_custom_resolvers()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions.dnsServers"] = "168.63.129.16,10.0.0.4",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue();
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_indexed_flat_dns_server_is_packed_uint32_string_for_azure_default()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions.dnsServers.0"] = "2822734096",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "flattened indexed DNS values must decode packed uint32 strings before default-server comparison");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_dhcpOptions_json_array_lists_scientific_notation_packed_uint32_for_azure_default()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":[2.822734096e9]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "dhcpOptions dnsServers numeric elements must decode scientific-notation packed uint32 values before default-server comparison");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_indexed_flat_dns_server_is_packed_uint32_hex_string_for_azure_default()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions.dnsServers.0"] = "0xA83F8110",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "flattened indexed DNS values must decode hex packed uint32 strings before default-server comparison");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_indexed_flat_dns_server_is_scientific_notation_packed_uint32_for_azure_default()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions.dnsServers.0"] = "2.822734096e9",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "flattened indexed DNS values must decode scientific-notation packed uint32 strings before default-server comparison");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_indexed_dns_server_is_json_string_scalar_wrapping_azure_default()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["dhcpOptions.dnsServers.0"] = "\"168.63.129.16\"",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "indexed flattened DNS values must unwrap JSON string scalars before default-server comparison");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_dhcpOptions_json_array_lists_json_string_scalar_wrapping_azure_default()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":["\"168.63.129.16\""]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "dhcpOptions dnsServers array elements must unwrap JSON string scalars before default-server comparison");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_dhcpOptions_json_scalar_dns_server_is_json_string_scalar_wrapping_azure_default()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":"\"168.63.129.16\""}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "scalar dnsServers strings in dhcpOptions JSON must unwrap JSON string scalars before default-server comparison");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_json_array_lists_packed_uint32_address()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":[168430090]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "mixed-type dhcpOptions projections may pack DNS servers as uint32 values");
    }

    [Fact]
    public void VnetUsesCustomDns_false_when_dhcpOptions_json_array_lists_numeric_octets_for_azure_default_only()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":[168,63,129,16]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeFalse(
            "numeric octet sequences must still recognize Azure default DNS");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_json_array_lists_two_numeric_octet_sequences()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":[10,0,0,4,8,8,8,8]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "mixed-type projections may flatten multiple DNS servers as back-to-back numeric octets");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_json_array_lists_numeric_octets()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = """{"dnsServers":[10,0,0,4]}""",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "mixed-type dhcpOptions projections may list DNS servers as numeric octets");
    }

    [Fact]
    public void VnetUsesCustomDns_true_when_dhcpOptions_property_is_json_string_scalar_wrapping_custom_dns_address()
    {
        AzureInventoryVnetCustomDnsIndex index = AzureInventoryVnetCustomDnsIndex.Build(
        [
            new AzureInventoryVnetCustomDnsResourceProperties
            {
                AzureResourceId = VnetArm,
                ResourceType = "Microsoft.Network/virtualNetworks",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["dhcpOptions"] = "\"10.0.0.4\"",
                },
            },
        ]);

        index.VnetUsesCustomDns(VnetArm).Should().BeTrue(
            "dhcpOptions JSON string scalars that wrap a single DNS address must still be read as custom DNS");
    }
}
