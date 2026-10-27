using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramNsgInboundRuleChipBuilderTests
{
    [Fact]
    public void BuildVisibleChips_reads_destination_port_ranges_when_single_range_is_empty()
    {
        AzureInventoryNsgSecurityRule rule = new()
        {
            Protocol = "TCP",
            DestinationPortRange = " ",
            DestinationPortRanges = ["443", "80"],
            Direction = "Inbound",
            Access = "Allow",
            Priority = "100",
            SourceAddressPrefix = "10.0.0.0/24",
        };

        IReadOnlyList<DiagramNsgInboundRuleChip> chips = InventoryDiagramNsgInboundRuleChipBuilder.BuildVisibleChips([rule]);

        chips.Should().ContainSingle();
        chips[0].Text.Should().Contain("443, 80");
        chips[0].Text.Should().NotContain("Port was not stored");
    }

    [Fact]
    public void BuildVisibleChips_summarizes_multiple_source_prefixes()
    {
        AzureInventoryNsgSecurityRule rule = new()
        {
            Protocol = "TCP",
            DestinationPortRange = "443",
            Direction = "Inbound",
            Access = "Allow",
            Priority = "100",
            SourceAddressPrefixes = ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"],
        };

        IReadOnlyList<DiagramNsgInboundRuleChip> chips = InventoryDiagramNsgInboundRuleChipBuilder.BuildVisibleChips([rule]);

        chips.Should().ContainSingle();
        chips[0].Text.Should().Contain("10.0.0.0/24; 2 other source prefixes were not listed on this chip.");
    }

    [Fact]
    public void BuildVisibleChips_reports_missing_destination_prefix()
    {
        AzureInventoryNsgSecurityRule rule = new()
        {
            Protocol = "TCP",
            DestinationPortRange = "443",
            Direction = "Inbound",
            Access = "Allow",
            Priority = "100",
            SourceAddressPrefix = "10.0.0.0/24",
        };

        IReadOnlyList<DiagramNsgInboundRuleChip> chips = InventoryDiagramNsgInboundRuleChipBuilder.BuildVisibleChips(
            [rule],
            includeMissingDestinationHonesty: true);

        chips.Should().ContainSingle();
        chips[0].Text.Should().Contain("to Destination was not stored");
    }

    [Fact]
    public void BuildVisibleChips_footnotes_rules_missing_priority()
    {
        AzureInventoryNsgSecurityRule listed = new()
        {
            Protocol = "TCP",
            DestinationPortRange = "443",
            Direction = "Inbound",
            Access = "Allow",
            Priority = "100",
            SourceAddressPrefix = "*",
        };
        AzureInventoryNsgSecurityRule missingPriority = new()
        {
            Protocol = "TCP",
            DestinationPortRange = "22",
            Direction = "Inbound",
            Access = "Allow",
            Priority = " ",
            SourceAddressPrefix = "*",
        };

        IReadOnlyList<DiagramNsgInboundRuleChip> chips = InventoryDiagramNsgInboundRuleChipBuilder.BuildVisibleChips(
            [listed, missingPriority]);

        chips.Should().HaveCount(2);
        chips[^1].Text.Should().Be("Priority was not stored for 1 inbound rules.");
    }
}
