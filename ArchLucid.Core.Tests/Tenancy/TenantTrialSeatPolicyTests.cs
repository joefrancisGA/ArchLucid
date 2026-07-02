using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class TenantTrialSeatPolicyTests
{
    [Fact]
    public void RequiresSeatClaim_false_when_tenant_null()
    {
        TenantTrialSeatPolicy.RequiresSeatClaim(null).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData(TrialLifecycleStatus.Converted)]
    [InlineData(TrialLifecycleStatus.Expired)]
    public void RequiresSeatClaim_false_when_trial_not_active(string? trialStatus)
    {
        TenantRecord tenant = CreateTenant(trialStatus: trialStatus, trialSeatsLimit: 5);

        TenantTrialSeatPolicy.RequiresSeatClaim(tenant).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    public void RequiresSeatClaim_false_when_seat_limit_missing_or_zero(int? trialSeatsLimit)
    {
        TenantRecord tenant = CreateTenant(
            trialStatus: TrialLifecycleStatus.Active,
            trialSeatsLimit: trialSeatsLimit);

        TenantTrialSeatPolicy.RequiresSeatClaim(tenant).Should().BeFalse();
    }

    [Fact]
    public void RequiresSeatClaim_true_when_active_trial_with_positive_seat_cap()
    {
        TenantRecord tenant = CreateTenant(
            trialStatus: TrialLifecycleStatus.Active,
            trialSeatsLimit: 2);

        TenantTrialSeatPolicy.RequiresSeatClaim(tenant).Should().BeTrue();
    }

    private static TenantRecord CreateTenant(string? trialStatus, int? trialSeatsLimit)
    {
        return new TenantRecord
        {
            Id = Guid.NewGuid(),
            Name = "tenant",
            Slug = "tenant",
            TrialStatus = trialStatus,
            TrialSeatsLimit = trialSeatsLimit,
        };
    }
}
