using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryNsgSecurityRuleParserTests
{
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

    [Fact]
    public void Parse_reads_explicit_flattened_rule_properties_when_suffix_casing_differs()
    {
        string rulePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{rulePrefix}.Protocol"] = "TCP",
            [$"{rulePrefix}.DestinationPortRange"] = "443",
            [$"{rulePrefix}.Direction"] = "Inbound",
            [$"{rulePrefix}.Access"] = "Allow",
        };

        IReadOnlyList<AzureInventoryNsgSecurityRule> rules = AzureInventoryNsgSecurityRuleParser.Parse(properties);

        rules.Should().ContainSingle();
        rules[0].Protocol.Should().Be("TCP");
        rules[0].DestinationPortRange.Should().Be("443");
        rules[0].Direction.Should().Be("Inbound");
        rules[0].Access.Should().Be("Allow");
    }
}
