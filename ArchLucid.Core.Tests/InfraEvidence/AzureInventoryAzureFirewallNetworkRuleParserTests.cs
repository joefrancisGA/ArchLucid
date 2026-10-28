using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAzureFirewallNetworkRuleParserTests
{
    [Fact]
    public void Parse_reads_network_rule_collections_json()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = """
                [
                  {
                    "properties": {
                      "priority": 200,
                      "rules": [
                        {
                          "properties": {
                            "name": "allow-internet",
                            "priority": 100,
                            "action": { "type": "Allow" },
                            "sourceAddresses": ["*"],
                            "destinationAddresses": ["*"],
                            "destinationPorts": ["*"],
                            "ipProtocols": ["TCP"]
                          }
                        }
                      ]
                    }
                  }
                ]
                """,
        };

        IReadOnlyList<AzureInventoryAzureFirewallNetworkRule> rules =
            AzureInventoryAzureFirewallNetworkRuleParser.Parse(properties);

        rules.Should().ContainSingle();
        rules[0].Action.Should().Be("Allow");
        rules[0].DestinationAddresses.Should().Contain("*");
    }

    [Fact]
    public void Evaluate_allow_rule_matches_internet_flow()
    {
        AzureInventoryAzureFirewallNetworkRule rule = new()
        {
            Priority = 100,
            Action = "Allow",
            SourceAddresses = ["*"],
            DestinationAddresses = ["*"],
            DestinationPorts = ["*"],
            Protocols = ["TCP"],
        };

        AzureInventoryNetworkEdgeControlDecision decision =
            AzureInventoryAzureFirewallNetworkRuleEvaluator.Evaluate(
                [rule],
                hasUnevaluatedApplicationRules: false,
                sourceAddress: "*",
                destinationAddress: "*",
                destinationPort: 443,
                protocol: "TCP");

        decision.Should().Be(AzureInventoryNetworkEdgeControlDecision.Allow);
    }

    [Fact]
    public void Evaluate_deny_rule_blocks_flow()
    {
        AzureInventoryAzureFirewallNetworkRule rule = new()
        {
            Priority = 100,
            Action = "Deny",
            SourceAddresses = ["*"],
            DestinationAddresses = ["*"],
            DestinationPorts = ["*"],
            Protocols = ["TCP"],
        };

        AzureInventoryNetworkEdgeControlDecision decision =
            AzureInventoryAzureFirewallNetworkRuleEvaluator.Evaluate(
                [rule],
                hasUnevaluatedApplicationRules: false,
                sourceAddress: "*",
                destinationAddress: "*",
                destinationPort: 443,
                protocol: "TCP");

        decision.Should().Be(AzureInventoryNetworkEdgeControlDecision.Deny);
    }

    [Fact]
    public void HasApplicationRuleCollections_false_when_property_is_whitespace_only()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "   ",
        };

        AzureInventoryAzureFirewallNetworkRuleParser.HasApplicationRuleCollections(properties).Should().BeFalse();
    }

    [Fact]
    public void HasNetworkRuleCollections_false_when_property_is_empty_json_array()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey] = "[]",
        };

        AzureInventoryAzureFirewallNetworkRuleParser.HasNetworkRuleCollections(properties).Should().BeFalse();
        AzureInventoryAzureFirewallNetworkRuleParser.Parse(properties).Should().BeEmpty();
    }

    [Fact]
    public void HasApplicationRuleCollections_false_when_property_is_empty_json_array()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryAzureFirewallNetworkRuleParser.ApplicationRuleCollectionsPropertyKey] = "[]",
        };

        AzureInventoryAzureFirewallNetworkRuleParser.HasApplicationRuleCollections(properties).Should().BeFalse();
    }
}
