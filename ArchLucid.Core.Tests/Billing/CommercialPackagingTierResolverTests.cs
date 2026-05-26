using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Billing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CommercialPackagingTierResolverTests
{
    [SkippableFact]
    public void ResolveCommercialTierLabel_returns_enterprise_for_enterprise_tier()
    {
        TenantRecord tenant = PaidTenant(TenantTier.Enterprise);

        string? label = CommercialPackagingTierResolver.ResolveCommercialTierLabel(tenant, null, 3, 10);

        label.Should().Be(CommercialPackagingTierLabels.Enterprise);
    }

    [SkippableFact]
    public void ResolveCommercialTierLabel_returns_null_for_active_trial()
    {
        TenantRecord tenant = PaidTenant(TenantTier.Free, TrialLifecycleStatus.Active);

        string? label = CommercialPackagingTierResolver.ResolveCommercialTierLabel(tenant, null, 1, 2);

        label.Should().BeNull();
    }

    [SkippableFact]
    public void ResolveCommercialTierLabel_returns_team_for_active_subscription_within_team_caps()
    {
        TenantRecord tenant = PaidTenant(TenantTier.Standard);
        BillingSubscriptionSnapshot subscription = new("stripe", nameof(TenantTier.Standard), 3, 1, "Active");

        string? label = CommercialPackagingTierResolver.ResolveCommercialTierLabel(tenant, subscription, 1, 3);

        label.Should().Be(CommercialPackagingTierLabels.Team);
    }

    [SkippableFact]
    public void ResolveCommercialTierLabel_returns_professional_when_subscription_exceeds_team_caps()
    {
        TenantRecord tenant = PaidTenant(TenantTier.Standard);
        BillingSubscriptionSnapshot subscription = new("stripe", nameof(TenantTier.Standard), 8, 2, "Active");

        string? label = CommercialPackagingTierResolver.ResolveCommercialTierLabel(tenant, subscription, 2, 8);

        label.Should().Be(CommercialPackagingTierLabels.Professional);
    }

    [SkippableFact]
    public void ResolveCommercialTierLabel_defaults_to_team_for_sales_led_standard_without_billing_row()
    {
        TenantRecord tenant = PaidTenant(TenantTier.Standard, TrialLifecycleStatus.Converted);

        string? label = CommercialPackagingTierResolver.ResolveCommercialTierLabel(tenant, null, 1, 4);

        label.Should().Be(CommercialPackagingTierLabels.Team);
    }

    private static TenantRecord PaidTenant(TenantTier tier, TrialLifecycleStatus trialStatus = TrialLifecycleStatus.None)
    {
        return new TenantRecord
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Name = "t",
            Slug = "t",
            Tier = tier,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = trialStatus
        };
    }
}
