using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class InsightDensityJudgeBudgetCapTests
{
    [Fact]
    public void Resolve_returns_zero_when_configured_cap_is_zero()
    {
        InsightDensityJudgeBudgetCap.Resolve(0, 100m, 0.10m).Should().Be(0);
    }

    [Fact]
    public void Resolve_returns_configured_cap_when_remaining_or_estimate_is_null()
    {
        InsightDensityJudgeBudgetCap.Resolve(40, null, 0.10m).Should().Be(40);
        InsightDensityJudgeBudgetCap.Resolve(40, 5m, null).Should().Be(40);
    }

    [Fact]
    public void Resolve_returns_zero_when_remaining_usd_is_zero()
    {
        InsightDensityJudgeBudgetCap.Resolve(40, 0m, 0.10m).Should().Be(0);
    }

    [Fact]
    public void Resolve_shrinks_to_floor_of_remaining_over_estimate()
    {
        InsightDensityJudgeBudgetCap.Resolve(40, 0.29m, 0.10m).Should().Be(2);
    }

    [Fact]
    public void Resolve_never_exceeds_configured_cap()
    {
        InsightDensityJudgeBudgetCap.Resolve(40, 1000m, 0.10m).Should().Be(40);
        InsightDensityJudgeBudgetCap.Resolve(40, 1000m, 0.10m).Should().BeLessThan(41);
    }

    [Fact]
    public void Resolve_returns_configured_cap_when_estimate_is_non_positive()
    {
        InsightDensityJudgeBudgetCap.Resolve(40, 10m, 0m).Should().Be(40);
        InsightDensityJudgeBudgetCap.Resolve(40, 10m, -1m).Should().Be(40);
    }
}
