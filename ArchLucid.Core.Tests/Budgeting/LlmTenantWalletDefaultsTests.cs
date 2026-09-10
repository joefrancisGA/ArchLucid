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
}
