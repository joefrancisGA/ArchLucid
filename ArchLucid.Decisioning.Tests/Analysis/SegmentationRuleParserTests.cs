using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class SegmentationRuleParserTests
{
    [Fact]
    public void ParseRiskyRules_detects_internet_to_22()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.security_rule"] =
                "access = allow direction = inbound source_address_prefix = * destination_port_range = 22",
        };

        IReadOnlyList<SegmentationRiskyRule> rules = SegmentationRuleParser.ParseRiskyRules(properties);

        rules.Should().ContainSingle();
        rules[0].DestinationPort.Should().Be(22);
    }

    [Fact]
    public void ParseRiskyRules_ignores_private_cidr_only_22()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.security_rule"] =
                "access = allow direction = inbound source_address_prefix = 10.0.0.0/8 destination_port_range = 22",
        };

        SegmentationRuleParser.ParseRiskyRules(properties).Should().BeEmpty();
    }

    [Fact]
    public void ParseRiskyRules_returns_empty_when_no_rules_blob()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = "azurerm_network_security_group",
        };

        SegmentationRuleParser.ParseRiskyRules(properties).Should().BeEmpty();
    }
}
