using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryNsgSecurityRuleParserTests
{
    [Fact]
    public void Parse_reads_source_address_prefixes_array_from_json_property()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["securityRules"] =
                """
                [
                  {
                    "name": "allow-array",
                    "properties": {
                      "protocol": "TCP",
                      "destinationPortRange": "443",
                      "direction": "Inbound",
                      "access": "Allow",
                      "priority": 100,
                      "sourceAddressPrefixes": ["10.0.1.0/24", "10.0.2.0/24"],
                      "destinationAddressPrefix": "*"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryNsgSecurityRule> rules = AzureInventoryNsgSecurityRuleParser.Parse(properties);

        rules.Should().ContainSingle();
        rules[0].SourceAddressPrefixes.Should().Equal("10.0.1.0/24", "10.0.2.0/24");
    }

    [Fact]
    public void Parse_reads_security_rules_from_json_property()
    {
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["securityRules"] =
                """
                [
                  {
                    "name": "allow-https",
                    "properties": {
                      "protocol": "TCP",
                      "destinationPortRange": "443",
                      "direction": "Inbound",
                      "access": "Allow",
                      "priority": 100,
                      "sourceAddressPrefix": "*",
                      "destinationAddressPrefix": "*"
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryNsgSecurityRule> rules = AzureInventoryNsgSecurityRuleParser.Parse(properties);

        rules.Should().ContainSingle();
        rules[0].Protocol.Should().Be("TCP");
        rules[0].DestinationPortRange.Should().Be("443");
        rules[0].Direction.Should().Be("Inbound");
        rules[0].Access.Should().Be("Allow");
    }
}
