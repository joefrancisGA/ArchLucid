using ArchLucid.Application.AiUsage;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.AiUsage;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.AiUsage;

[Trait("Category", "Unit")]
public sealed class TenantAiBudgetPolicyResolverByPlanTests
{
    private static readonly Guid TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [SkippableFact]
    public async Task ResolveAsync_paid_architect_subscription_uses_architect_hard_stop()
    {
        TenantAiBudgetPolicyResolver sut = await CreatePaidResolverAsync(
            new BillingSubscriptionSnapshot("stripe", nameof(TenantTier.Standard), 1, 1, "Active"));

        TenantAiBudgetPolicySnapshot snapshot = await sut.ResolveAsync(TenantId, CancellationToken.None);

        snapshot.WorkspaceKind.Should().Be(AiUsageWorkspaceKind.Paid);
        snapshot.BudgetAmountUsd.Should().Be(35m);
    }

    [SkippableFact]
    public async Task ResolveAsync_paid_team_add_on_seats_use_team_hard_stop()
    {
        TenantAiBudgetPolicyResolver sut = await CreatePaidResolverAsync(
            new BillingSubscriptionSnapshot("stripe", nameof(TenantTier.Standard), 8, 1, "Active"));

        TenantAiBudgetPolicySnapshot snapshot = await sut.ResolveAsync(TenantId, CancellationToken.None);

        snapshot.BudgetAmountUsd.Should().Be(75m);
    }

    [SkippableFact]
    public async Task ResolveAsync_paid_professional_subscription_uses_professional_hard_stop()
    {
        TenantAiBudgetPolicyResolver sut = await CreatePaidResolverAsync(
            new BillingSubscriptionSnapshot("stripe", nameof(TenantTier.Standard), 8, 2, "Active"));

        TenantAiBudgetPolicySnapshot snapshot = await sut.ResolveAsync(TenantId, CancellationToken.None);

        snapshot.BudgetAmountUsd.Should().Be(300m);
    }

    private static async Task<TenantAiBudgetPolicyResolver> CreatePaidResolverAsync(
        BillingSubscriptionSnapshot subscription)
    {
        InMemoryTenantRepository tenantRepository = new();
        InMemoryTenantAiBudgetPolicyRepository policyRepository = new();
        InMemoryLlmTenantBudgetRepository budgetRepository = new();

        await tenantRepository.InsertTenantAsync(
            TenantId,
            "Paid Co",
            "paid-co",
            TenantTier.Standard,
            null,
            "us",
            CancellationToken.None);

        Mock<IBillingLedger> billingLedger = new();
        billingLedger
            .Setup(l => l.TryGetSubscriptionAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(subscription);

        Mock<IOptionsMonitor<AiUsageControlsOptions>> aiUsageOptions = new();
        aiUsageOptions.Setup(o => o.CurrentValue)
            .Returns(
                new AiUsageControlsOptions
                {
                    TrialMode = true,
                    HardStopEnabled = true,
                    DefaultTrialAiBudgetUsd = 10m,
                });

        Mock<IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>> monthlyOptions = new();
        monthlyOptions.Setup(o => o.CurrentValue)
            .Returns(
                new LlmMonthlyTenantDollarBudgetOptions
                {
                    Enabled = true,
                    IncludedUsdPerUtcMonth = 50m,
                    HardCutoffUsdPerUtcMonth = 75m,
                    ByPlan =
                    {
                        [LlmMonthlySpendPlanId.Architect] = new LlmMonthlyTenantPlanBudgetOptions
                        {
                            IncludedUsdPerUtcMonth = 20m,
                            HardCutoffUsdPerUtcMonth = 35m,
                        },
                        [LlmMonthlySpendPlanId.Team] = new LlmMonthlyTenantPlanBudgetOptions
                        {
                            IncludedUsdPerUtcMonth = 50m,
                            HardCutoffUsdPerUtcMonth = 75m,
                        },
                        [LlmMonthlySpendPlanId.Professional] = new LlmMonthlyTenantPlanBudgetOptions
                        {
                            IncludedUsdPerUtcMonth = 200m,
                            HardCutoffUsdPerUtcMonth = 300m,
                        },
                    },
                });

        return new TenantAiBudgetPolicyResolver(
            tenantRepository,
            billingLedger.Object,
            policyRepository,
            budgetRepository,
            new InMemoryTenantAzureOpenAiConnectionRepository(),
            aiUsageOptions.Object,
            monthlyOptions.Object,
            new ConfigurationBuilder().Build(),
            TimeProvider.System);
    }
}
