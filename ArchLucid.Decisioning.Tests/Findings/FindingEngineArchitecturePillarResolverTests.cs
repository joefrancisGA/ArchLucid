using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingEngineArchitecturePillarResolverTests
{
    [Theory]
    [InlineData("Security", "Security")]
    [InlineData("Compliance", "DataAndCompliance")]
    [InlineData("Cost", "CostEffectiveness")]
    [InlineData("CostOptimization", "CostEffectiveness")]
    public void TryResolveStorageKey_maps_architecture_categories(string category, string expectedKey)
    {
        bool resolved = FindingEngineArchitecturePillarResolver.TryResolveStorageKey(category, out string storageKey);

        resolved.Should().BeTrue();
        storageKey.Should().Be(expectedKey);
    }

    [Theory]
    [InlineData("Requirement")]
    [InlineData("Topology")]
    [InlineData("Policy")]
    [InlineData("")]
    public void TryResolveStorageKey_returns_false_for_review_integrity_or_blank_categories(string category)
    {
        bool resolved = FindingEngineArchitecturePillarResolver.TryResolveStorageKey(category, out string storageKey);

        resolved.Should().BeFalse();
        storageKey.Should().BeEmpty();
    }
}
