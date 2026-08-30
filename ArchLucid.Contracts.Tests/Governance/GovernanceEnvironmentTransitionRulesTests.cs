using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

public sealed class GovernanceEnvironmentTransitionRulesTests
{
    [Theory]
    [InlineData("dev", "test", true)]
    [InlineData("dev", "prod", false)]
    [InlineData("prod", "test", false)]
    public void IsValidTransition_falls_back_to_static_ladder(string source, string target, bool expected)
    {
        GovernanceEnvironmentTransitionRules.IsValidTransition(source, target).Should().Be(expected);
    }

    [Fact]
    public void IsValidTransition_uses_catalog_when_present()
    {
        GovernanceEnvironmentCatalog catalog = new()
        {
            Environments =
            [
                new GovernanceEnvironmentDefinition { Slug = "a", DisplayName = "A", SortOrder = 0, IsActive = true },
                new GovernanceEnvironmentDefinition { Slug = "b", DisplayName = "B", SortOrder = 1, IsActive = true },
                new GovernanceEnvironmentDefinition { Slug = "c", DisplayName = "C", SortOrder = 2, IsActive = false },
            ],
            Transitions =
            [
                new GovernanceEnvironmentTransition { SourceSlug = "a", TargetSlug = "b" },
            ],
        };

        GovernanceEnvironmentTransitionRules.IsValidTransition("a", "b", catalog).Should().BeTrue();
        GovernanceEnvironmentTransitionRules.IsValidTransition("a", "c", catalog).Should().BeFalse();
        GovernanceEnvironmentTransitionRules.IsValidTransition("b", "a", catalog).Should().BeFalse();
    }

    [Fact]
    public void IsValidTransition_rejects_all_edges_when_catalog_has_no_transitions()
    {
        GovernanceEnvironmentCatalog catalog = new()
        {
            Environments =
            [
                new GovernanceEnvironmentDefinition { Slug = "a", DisplayName = "A", SortOrder = 0, IsActive = true },
                new GovernanceEnvironmentDefinition { Slug = "b", DisplayName = "B", SortOrder = 1, IsActive = true },
            ],
            Transitions = [],
        };

        GovernanceEnvironmentTransitionRules.IsValidTransition("a", "b", catalog).Should().BeFalse();
        GovernanceEnvironmentTransitionRules.IsValidTransition("dev", "test", catalog).Should().BeFalse();
    }
}
