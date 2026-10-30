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
    public void ParseRiskyRules_detects_quoted_terraform_wildcard_source()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.security_rule"] =
                "access = allow direction = inbound source_address_prefix = \"*\" destination_port_range = \"22\"",
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
    public void ParseRiskyRules_ignores_private_source_when_port_and_destination_are_wildcards()
    {
        // Simple terraform stores the security_rule body as written, including the
        // azurerm defaults source_port_range = "*" and destination_address_prefix = "*".
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.security_rule"] =
                """
                name                       = "ssh"
                priority                   = 100
                direction                  = "Inbound"
                access                     = "Allow"
                protocol                   = "Tcp"
                source_port_range          = "*"
                destination_port_range     = "22"
                source_address_prefix      = "10.0.0.0/8"
                destination_address_prefix = "*"
                """,
        };

        SegmentationRuleParser.ParseRiskyRules(properties).Should().BeEmpty();
    }

    [Fact]
    public void ParseRiskyRules_still_detects_internet_source_when_port_and_destination_are_wildcards()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.security_rule"] =
                """
                source_port_range          = "*"
                destination_port_range     = "22"
                source_address_prefix      = "*"
                destination_address_prefix = "*"
                """,
        };

        IReadOnlyList<SegmentationRiskyRule> rules = SegmentationRuleParser.ParseRiskyRules(properties);

        rules.Should().ContainSingle();
        rules[0].DestinationPort.Should().Be(22);
    }

    [Fact]
    public void ParseRiskyRules_detects_azure_internet_service_tag_with_destination_wildcard()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["tf.security_rule"] =
                """
                source_port_range          = "*"
                destination_port_range     = "3389"
                source_address_prefix      = "Internet"
                destination_address_prefix = "*"
                """,
        };

        IReadOnlyList<SegmentationRiskyRule> rules = SegmentationRuleParser.ParseRiskyRules(properties);

        rules.Should().ContainSingle();
        rules[0].DestinationPort.Should().Be(3389);
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
