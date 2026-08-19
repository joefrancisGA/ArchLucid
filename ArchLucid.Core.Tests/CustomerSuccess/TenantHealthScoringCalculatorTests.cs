using ArchLucid.Core.CustomerSuccess;

using FluentAssertions;

namespace ArchLucid.Core.Tests.CustomerSuccess;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantHealthScoringCalculatorTests
{
    [Fact]
    public void Engagement_boosts_for_commits_and_multiple_actors_and_caps_at_five()
    {
        decimal one = TenantHealthScoringCalculator.EngagementScore(0, 0, 1);
        one.Should().Be(1.0M);

        decimal withCommit = TenantHealthScoringCalculator.EngagementScore(3, 1, 1);
        withCommit.Should().BeGreaterThan(3.0M);

        decimal heavy = TenantHealthScoringCalculator.EngagementScore(20, 3, 5);
        heavy.Should().Be(5.0M);
    }

    [Fact]
    public void Quality_is_neutral_without_signals()
    {
        TenantHealthScoringCalculator.QualityScore(0, 0).Should().Be(3.0M);
    }

    [Fact]
    public void Quality_tracks_trusted_ratio()
    {
        TenantHealthScoringCalculator.QualityScore(10, 8).Should().Be(5.0M);
        TenantHealthScoringCalculator.QualityScore(10, 5).Should().Be(4.0M);
        TenantHealthScoringCalculator.QualityScore(10, 1).Should().Be(2.0M);
    }

    [Fact]
    public void Composite_matches_weighted_formula()
    {
        decimal c = TenantHealthScoringCalculator.CompositeScore(4, 3, 3, 3, 3);
        c.Should().Be(3.30M);
    }
}
