using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Budgeting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmMonthlySpendPlanIdTests
{
    [Fact]
    public void FromCommercialPackaging_maps_one_seat_subscription_to_architect()
    {
        BillingSubscriptionSnapshot subscription = new("stripe", nameof(TenantTier.Standard), 1, 1, "Active");

        string? planId = LlmMonthlySpendPlanId.FromCommercialPackaging(
            CommercialPackagingTierLabels.Team,
            subscription);

        planId.Should().Be(LlmMonthlySpendPlanId.Architect);
    }

    [Fact]
    public void FromCommercialPackaging_maps_team_label_when_subscription_is_the_five_seat_bundle()
    {
        BillingSubscriptionSnapshot subscription = new("stripe", nameof(TenantTier.Standard), 5, 1, "Active");

        string? planId = LlmMonthlySpendPlanId.FromCommercialPackaging(
            CommercialPackagingTierLabels.Team,
            subscription);

        planId.Should().Be(LlmMonthlySpendPlanId.Team);
    }

    [Fact]
    public void FromCommercialPackaging_maps_professional_label()
    {
        string? planId = LlmMonthlySpendPlanId.FromCommercialPackaging(
            CommercialPackagingTierLabels.Professional,
            subscription: null);

        planId.Should().Be(LlmMonthlySpendPlanId.Professional);
    }

    [Fact]
    public void FromCommercialPackaging_returns_null_for_enterprise_and_unknown()
    {
        LlmMonthlySpendPlanId.FromCommercialPackaging(CommercialPackagingTierLabels.Enterprise, null)
            .Should()
            .BeNull();
        LlmMonthlySpendPlanId.FromCommercialPackaging(null, null).Should().BeNull();
    }

    [Fact]
    public void FromCommercialPackaging_returns_null_for_enterprise_one_seat_subscription()
    {
        BillingSubscriptionSnapshot subscription = new("stripe", nameof(TenantTier.Enterprise), 1, 1, "Active");

        string? planId = LlmMonthlySpendPlanId.FromCommercialPackaging(
            CommercialPackagingTierLabels.Enterprise,
            subscription);

        planId.Should().BeNull();
    }
}
