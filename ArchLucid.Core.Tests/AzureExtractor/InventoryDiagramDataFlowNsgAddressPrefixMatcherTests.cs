using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowNsgAddressPrefixMatcherTests
{
    [Fact]
    public void IsWildcard_treats_missing_empty_and_star_as_wildcard()
    {
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsWildcard(null).Should().BeTrue();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsWildcard(string.Empty).Should().BeTrue();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsWildcard("   ").Should().BeTrue();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsWildcard("*").Should().BeTrue();
    }

    [Fact]
    public void IsCidrOrIp_accepts_ipv4_addresses_and_cidrs_and_rejects_service_tags()
    {
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsCidrOrIp("10.0.0.5").Should().BeTrue();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsCidrOrIp("10.0.0.0/24").Should().BeTrue();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsCidrOrIp("VirtualNetwork").Should().BeFalse();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsCidrOrIp("Internet").Should().BeFalse();
    }

    [Fact]
    public void Contains_matches_address_inside_cidr_or_exact_ip()
    {
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.Contains("10.0.1.0/24", "10.0.1.42").Should().BeTrue();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.Contains("10.0.1.0/24", "10.0.2.1").Should().BeFalse();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.Contains("10.0.1.42", "10.0.1.42").Should().BeTrue();
    }

    [Fact]
    public void Overlaps_detects_intersecting_cidrs()
    {
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.Overlaps("10.0.1.0/24", "10.0.1.128/25").Should().BeTrue();
        InventoryDiagramDataFlowNsgAddressPrefixMatcher.Overlaps("10.0.1.0/24", "10.0.2.0/24").Should().BeFalse();
    }
}
