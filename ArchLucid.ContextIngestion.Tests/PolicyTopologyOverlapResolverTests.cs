using ArchLucid.ContextIngestion.Topology;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyTopologyOverlapResolverTests
{
    private readonly PolicyTopologyOverlapResolver _sut = new();

    [Fact]
    public void Overlaps_canonicalizes_slash_spacing_on_policy_reference()
    {
        _sut.Overlaps("parentNet / childSubnet", "parentNet/childSubnet").Should().BeTrue();
    }

    [Fact]
    public void ResolveApplicableTopologyNodeIds_returns_obj_prefix_for_overlapping_hint()
    {
        string? ids = _sut.ResolveApplicableTopologyNodeIds(
            "prod-vnet-policy",
            ["prod-vnet-policy-subnet", "unrelated"]);

        ids.Should().NotBeNull();
        ids.Should().StartWith("obj-");
        ids!.Split(',', StringSplitOptions.RemoveEmptyEntries).Should().HaveCount(1);
    }

    [Fact]
    public void ResolveApplicableTopologyNodeIds_returns_null_when_no_overlap()
    {
        string? ids = _sut.ResolveApplicableTopologyNodeIds("SOC2", ["unrelated-vnet"]);

        ids.Should().BeNull();
    }

    [Fact]
    public void ResolveApplicableTopologyNodeIds_is_stable_across_overlapping_hint_list_order()
    {
        string? firstOrder = _sut.ResolveApplicableTopologyNodeIds(
            "prod",
            ["prod-vnet", "prod-subnet"]);

        string? reversedOrder = _sut.ResolveApplicableTopologyNodeIds(
            "prod",
            ["prod-subnet", "prod-vnet"]);

        firstOrder.Should().NotBeNull();
        reversedOrder.Should().Be(firstOrder);
        firstOrder!.Split(',', StringSplitOptions.RemoveEmptyEntries).Should().HaveCount(2);
    }
}
