using ArchLucid.Core.GoToMarket;

using FluentAssertions;

namespace ArchLucid.Core.Tests.GoToMarket;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SyntheticAggregateRoiBulletinSampleTests
{
    [Fact]
    public void ForQuarter_returns_sufficient_sample_with_fixed_counts()
    {
        RoiBulletinAggregateReadResult r = SyntheticAggregateRoiBulletinSample.ForQuarter("Q1-2026");

        r.IsSufficientSample.Should().BeTrue();
        r.QuarterLabel.Should().Be("Q1-2026");
        r.TenantCount.Should().Be(SyntheticAggregateRoiBulletinSample.SyntheticTenantCount);
        r.MeanBaselineHours.Should().Be(SyntheticAggregateRoiBulletinSample.MeanBaselineHours);
        r.MedianBaselineHours.Should().Be(SyntheticAggregateRoiBulletinSample.MedianBaselineHours);
        r.P90BaselineHours.Should().Be(SyntheticAggregateRoiBulletinSample.P90BaselineHours);
    }
}
