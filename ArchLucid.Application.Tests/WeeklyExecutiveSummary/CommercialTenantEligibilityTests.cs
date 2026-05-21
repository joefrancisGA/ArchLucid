using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests.WeeklyExecutiveSummary;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class CommercialTenantEligibilityTests
{
    [Fact]
    public void Standard_tier_without_active_trial_is_eligible()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Tier = TenantTier.Standard,
            TrialStatus = null
        };

        CommercialTenantEligibility.IsEligibleForWeeklyExecutiveSummary(tenant).Should().BeTrue();
    }

    [Fact]
    public void Active_trial_is_not_eligible()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Tier = TenantTier.Standard,
            TrialStatus = TrialLifecycleStatus.Active
        };

        CommercialTenantEligibility.IsEligibleForWeeklyExecutiveSummary(tenant).Should().BeFalse();
    }

    [Fact]
    public void Free_tier_is_not_eligible()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Tier = TenantTier.Free
        };

        CommercialTenantEligibility.IsEligibleForWeeklyExecutiveSummary(tenant).Should().BeFalse();
    }
}
