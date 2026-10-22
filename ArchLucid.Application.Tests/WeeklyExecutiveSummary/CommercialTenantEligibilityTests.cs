using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests.WeeklySponsorReport;

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

        CommercialTenantEligibility.IsEligibleForWeeklySponsorReport(tenant).Should().BeTrue();
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

        CommercialTenantEligibility.IsEligibleForWeeklySponsorReport(tenant).Should().BeFalse();
    }

    [Fact]
    public void Free_tier_is_not_eligible()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Tier = TenantTier.Free
        };

        CommercialTenantEligibility.IsEligibleForWeeklySponsorReport(tenant).Should().BeFalse();
    }

    [Fact]
    public void Active_trial_does_not_meet_standard_commercial_gate()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Tier = TenantTier.Free,
            TrialStatus = TrialLifecycleStatus.Active
        };

        CommercialTenantEligibility.MeetsCommercialTenantTierGate(tenant, TenantTier.Standard).Should().BeFalse();
    }

    [Fact]
    public void Active_trial_with_standard_tier_still_blocked_from_standard_commercial_gate()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Tier = TenantTier.Standard,
            TrialStatus = TrialLifecycleStatus.Active
        };

        CommercialTenantEligibility.MeetsCommercialTenantTierGate(tenant, TenantTier.Standard).Should().BeFalse();
    }

    [Fact]
    public void Converted_standard_tier_meets_standard_commercial_gate()
    {
        TenantRecord tenant = new()
        {
            Id = Guid.NewGuid(),
            Tier = TenantTier.Standard,
            TrialStatus = TrialLifecycleStatus.Converted
        };

        CommercialTenantEligibility.MeetsCommercialTenantTierGate(tenant, TenantTier.Standard).Should().BeTrue();
    }
}
