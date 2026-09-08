using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
[Trait("Suite", "Configuration")]
public sealed class LlmMonthlyTenantDollarBudgetOptionsTests
{
    [Fact]
    public void ResolveHardCutoffUsdPerUtcMonth_uses_plan_overlay_when_present()
    {
        LlmMonthlyTenantDollarBudgetOptions options = new()
        {
            HardCutoffUsdPerUtcMonth = 75m,
            ByPlan =
            {
                ["architect"] = new LlmMonthlyTenantPlanBudgetOptions
                {
                    IncludedUsdPerUtcMonth = 20m,
                    HardCutoffUsdPerUtcMonth = 35m,
                },
            },
        };

        options.ResolveHardCutoffUsdPerUtcMonth("architect").Should().Be(35m);
        options.ResolveIncludedUsdPerUtcMonth("architect").Should().Be(20m);
        options.ResolveHardCutoffUsdPerUtcMonth("team").Should().Be(75m);
        options.ResolveHardCutoffUsdPerUtcMonth(null).Should().Be(75m);
    }
}
