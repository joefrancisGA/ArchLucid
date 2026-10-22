using ArchLucid.ArtifactSynthesis.Compilers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExecutiveAlwaysShowTiersTests
{
    [Fact]
    public void All_exposes_four_tiers_with_distinct_keys_and_arm_types()
    {
        ExecutiveAlwaysShowTiers.All.Select(tier => tier.Key).Should().Equal(
            ExecutiveAlwaysShowTiers.WorkloadsKey,
            ExecutiveAlwaysShowTiers.DatabasesKey,
            ExecutiveAlwaysShowTiers.StorageKey,
            ExecutiveAlwaysShowTiers.IntegrationKey);

        List<string> armTypes = ExecutiveAlwaysShowTiers.All.SelectMany(tier => tier.ArmTypes).ToList();
        armTypes.Should().OnlyHaveUniqueItems();
        armTypes.Should().Contain("Microsoft.Compute/virtualMachines");
        armTypes.Should().Contain("Microsoft.Sql/servers/databases");
        armTypes.Should().Contain("Microsoft.Storage/storageAccounts");
        armTypes.Should().Contain("Microsoft.DataFactory/factories");
        armTypes.Should().Contain("Microsoft.Databricks/workspaces");
    }

    [Theory]
    [InlineData("Microsoft.Compute/virtualMachines", ExecutiveAlwaysShowTiers.WorkloadsKey)]
    [InlineData("microsoft.sql/servers/databases", ExecutiveAlwaysShowTiers.DatabasesKey)]
    [InlineData("Microsoft.Storage/storageAccounts", ExecutiveAlwaysShowTiers.StorageKey)]
    [InlineData("Microsoft.DataFactory/factories", ExecutiveAlwaysShowTiers.IntegrationKey)]
    [InlineData("Microsoft.Databricks/workspaces", ExecutiveAlwaysShowTiers.IntegrationKey)]
    public void TryResolveByArmType_is_case_insensitive(string armType, string expectedKey)
    {
        ExecutiveAlwaysShowTiers.TryResolveByArmType(armType)!.Key.Should().Be(expectedKey);
    }

    [Theory]
    [InlineData("Microsoft.Network/networkInterfaces")]
    [InlineData("Microsoft.ManagedIdentity/userAssignedIdentities")]
    [InlineData(null)]
    [InlineData("  ")]
    public void TryResolveByArmType_returns_null_for_non_tier_types(string? armType)
    {
        ExecutiveAlwaysShowTiers.TryResolveByArmType(armType).Should().BeNull();
    }

    [Fact]
    public void ParseHiddenKeys_normalizes_case_trims_dedupes_and_drops_unknown_tokens()
    {
        ExecutiveAlwaysShowTiers.ParseHiddenKeys(" Storage, workloads ,storage,,bogus ")
            .Should()
            .Equal(ExecutiveAlwaysShowTiers.StorageKey, ExecutiveAlwaysShowTiers.WorkloadsKey);

        ExecutiveAlwaysShowTiers.ParseHiddenKeys(null).Should().BeEmpty();
        ExecutiveAlwaysShowTiers.ParseHiddenKeys("").Should().BeEmpty();
        ExecutiveAlwaysShowTiers.ParseHiddenKeys("bogus").Should().BeEmpty();
    }

    [Fact]
    public void IsKnownKey_matches_catalog_keys_only()
    {
        ExecutiveAlwaysShowTiers.IsKnownKey("databases").Should().BeTrue();
        ExecutiveAlwaysShowTiers.IsKnownKey("DATABASES").Should().BeTrue();
        ExecutiveAlwaysShowTiers.IsKnownKey("identity").Should().BeFalse();
        ExecutiveAlwaysShowTiers.IsKnownKey(null).Should().BeFalse();
    }

    [Fact]
    public void ExecutiveMaxTotalNodes_covers_summary_nodes_plus_every_tier_at_budget_with_rollup()
    {
        int expected = DiagramAstFromGraphCompilerConstants.ExecutiveMaxResourceNodes
            + (ExecutiveAlwaysShowTiers.All.Count * (DiagramAstFromGraphCompilerConstants.ExecutiveAlwaysShowTierMaxNodes + 1));

        DiagramAstFromGraphCompilerConstants.ExecutiveMaxTotalNodes.Should().Be(expected);
    }
}
