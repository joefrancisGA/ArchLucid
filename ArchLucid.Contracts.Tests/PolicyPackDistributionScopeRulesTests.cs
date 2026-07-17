using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPackDistributionScopeRulesTests
{
    [Theory]
    [InlineData(PolicyPackType.BuiltIn, PolicyPackDistributionScope.Platform)]
    [InlineData(PolicyPackType.PlatformDefault, PolicyPackDistributionScope.Platform)]
    [InlineData(PolicyPackType.TenantCustom, PolicyPackDistributionScope.OrganizationPrivate)]
    [InlineData(PolicyPackType.WorkspaceCustom, PolicyPackDistributionScope.OrganizationPrivate)]
    [InlineData(PolicyPackType.ProjectCustom, PolicyPackDistributionScope.OrganizationPrivate)]
    public void ResolveForPackType_maps_authorship_to_distribution(string packType, string expectedScope)
    {
        PolicyPackDistributionScopeRules.ResolveForPackType(packType).Should().Be(expectedScope);
    }

    [Fact]
    public void RejectReservedScope_throws_for_marketplace()
    {
        Action act = () => PolicyPackDistributionScopeRules.RejectReservedScope(PolicyPackDistributionScope.Marketplace);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void EnsureCanPromoteToGlobalCatalog_blocks_organization_private()
    {
        PolicyPack pack = new()
        {
            DistributionScope = PolicyPackDistributionScope.OrganizationPrivate,
            PackType = PolicyPackType.ProjectCustom,
            Name = "private",
            Description = "d",
        };

        Action act = () => PolicyPackDistributionScopeRules.EnsureCanPromoteToGlobalCatalog(pack);

        act.Should().Throw<PolicyPackCrossTenantDistributionBlockedException>();
    }

    [Fact]
    public void EnsureDistributionScopeUnchanged_rejects_widening()
    {
        PolicyPack persisted = new()
        {
            DistributionScope = PolicyPackDistributionScope.OrganizationPrivate,
            Name = "a",
            Description = "d",
        };
        PolicyPack proposed = new()
        {
            DistributionScope = PolicyPackDistributionScope.Platform,
            Name = "a",
            Description = "d",
        };

        Action act = () => PolicyPackDistributionScopeRules.EnsureDistributionScopeUnchanged(persisted, proposed);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void EnsureCanPromoteToGlobalCatalog_blocks_organization_private_even_for_built_in_pack_type()
    {
        PolicyPack pack = new()
        {
            DistributionScope = PolicyPackDistributionScope.OrganizationPrivate,
            PackType = PolicyPackType.BuiltIn,
            Name = "private",
            Description = "d",
        };

        PolicyPackDistributionScopeRules.CanPromoteToGlobalCatalog(pack).Should().BeFalse();
    }

    [Fact]
    public void EnsureCanPromoteToGlobalCatalog_allows_platform_default_with_platform_scope()
    {
        PolicyPack pack = new()
        {
            DistributionScope = PolicyPackDistributionScope.Platform,
            PackType = PolicyPackType.PlatformDefault,
            Name = "platform",
            Description = "d",
        };

        PolicyPackDistributionScopeRules.CanPromoteToGlobalCatalog(pack).Should().BeTrue();
    }

    [Fact]
    public void EnsureCanPromoteToGlobalCatalog_blocks_custom_pack_type_even_with_platform_scope()
    {
        PolicyPack pack = new()
        {
            DistributionScope = PolicyPackDistributionScope.Platform,
            PackType = PolicyPackType.ProjectCustom,
            Name = "tampered",
            Description = "d",
        };

        PolicyPackDistributionScopeRules.CanPromoteToGlobalCatalog(pack).Should().BeFalse();
    }
}
