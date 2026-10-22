using ArchLucid.Core.Budgeting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Budgeting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmTenantWalletDefaultsTests
{
    [Fact]
    public void ApplyOverageMarkup_returns_zero_for_non_positive_estimates()
    {
        LlmTenantWalletDefaults.ApplyOverageMarkup(0m).Should().Be(0m);
        LlmTenantWalletDefaults.ApplyOverageMarkup(-5m).Should().Be(0m);
    }

    [Fact]
    public void ApplyOverageMarkup_applies_one_point_four_times_estimated_usd()
    {
        LlmTenantWalletDefaults.ApplyOverageMarkup(40m).Should().Be(56m);
        LlmTenantWalletDefaults.ApplyOverageMarkup(25m).Should().Be(35m);
    }

    [Fact]
    public void ApplyOverageMarkup_bills_one_cent_when_positive_estimate_rounds_to_zero()
    {
        // LlmCostEstimator: tokens * USD per million / 1_000_000. Terra list rates are $2.50 / $15.00.
        // 200 prompt + 20 completion is $0.0008; 1.4× rounds to $0.00 on a DECIMAL(10,2) wallet.
        decimal actualUsd = (200m * 2.50m + 20m * 15.00m) / 1_000_000m;

        LlmTenantWalletDefaults.ApplyOverageMarkup(actualUsd).Should().Be(0.01m);
    }
}
