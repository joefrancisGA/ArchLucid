using ArchLucid.Core.CustomerSuccess;

using FluentAssertions;

namespace ArchLucid.Core.Tests.CustomerSuccess;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantHealthScoringCalculatorTests
{
    [Theory]
    [InlineData(0, 0, 1, 10)]
    [InlineData(3, 0, 1, 30)]
    [InlineData(3, 1, 1, 34)]
    [InlineData(3, 0, 2, 34)]
    [InlineData(3, 0, 3, 34)]
    [InlineData(3, 0, 4, 36)]
    [InlineData(3, 1, 4, 40)]
    [InlineData(20, 3, 5, 50)]
    public void Engagement_applies_exact_boosts_at_the_actor_boundaries(
        int runs,
        int commits,
        int actors,
        int expectedTenths)
    {
        decimal score = TenantHealthScoringCalculator.EngagementScore(runs, commits, actors);

        score.Should().Be(expectedTenths / 10m);
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
