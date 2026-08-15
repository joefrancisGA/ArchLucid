using ArchLucid.Application.AiUsage;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.AiUsage;
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
public sealed class SelfServiceTrialAiBudgetPolicyProvisionerTests
{
    private static readonly Guid TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [SkippableFact]
    public async Task EnsureDefaultTrialPolicyIfAbsentAsync_inserts_durable_trial_ceiling()
    {
        InMemoryTenantAiBudgetPolicyRepository policyRepository = new();
        DateTimeOffset expires = new(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);
        SelfServiceTrialAiBudgetPolicyProvisioner sut = CreateSut(policyRepository, defaultTrialBudgetUsd: 12m);

        bool inserted = await sut.EnsureDefaultTrialPolicyIfAbsentAsync(TenantId, expires, CancellationToken.None);

        inserted.Should().BeTrue();
        TenantAiBudgetPolicyRow? row = await policyRepository.GetByTenantIdAsync(TenantId, CancellationToken.None);
        row.Should().NotBeNull();
        row!.BudgetAmountUsd.Should().Be(12m);
        row.HardStopEnabled.Should().BeTrue();
        row.AllowCustomerAiProvider.Should().BeFalse();
        row.TrialExpirationUtc.Should().Be(expires);
    }

    [SkippableFact]
    public async Task EnsureDefaultTrialPolicyIfAbsentAsync_is_idempotent_when_row_exists()
    {
        InMemoryTenantAiBudgetPolicyRepository policyRepository = new();
        DateTimeOffset expires = new(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);
        SelfServiceTrialAiBudgetPolicyProvisioner sut = CreateSut(policyRepository, defaultTrialBudgetUsd: 12m);

        bool inserted = await sut.EnsureDefaultTrialPolicyIfAbsentAsync(TenantId, expires, CancellationToken.None);
        inserted.Should().BeTrue();

        bool insertedAgain = await sut.EnsureDefaultTrialPolicyIfAbsentAsync(
            TenantId,
            expires.AddDays(7),
            CancellationToken.None);

        insertedAgain.Should().BeFalse();
        TenantAiBudgetPolicyRow? row = await policyRepository.GetByTenantIdAsync(TenantId, CancellationToken.None);
        row!.BudgetAmountUsd.Should().Be(12m);
        row.TrialExpirationUtc.Should().Be(expires);
    }

    private static SelfServiceTrialAiBudgetPolicyProvisioner CreateSut(
        ITenantAiBudgetPolicyRepository policyRepository,
        decimal defaultTrialBudgetUsd)
    {
        Mock<IOptionsMonitor<AiUsageControlsOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue)
            .Returns(new AiUsageControlsOptions { DefaultTrialAiBudgetUsd = defaultTrialBudgetUsd });

        return new SelfServiceTrialAiBudgetPolicyProvisioner(policyRepository, optionsMonitor.Object);
    }
}

[Trait("Category", "Unit")]
public sealed class TenantAiBudgetPolicyResolverSelfServiceTrialTests
{
    private static readonly Guid TenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [SkippableFact]
    public async Task ResolveAsync_fresh_self_service_trial_has_hard_stop_and_no_wallet_overage()
    {
        InMemoryTenantRepository tenantRepository = new();
        InMemoryTenantAiBudgetPolicyRepository policyRepository = new();
        InMemoryLlmTenantBudgetRepository budgetRepository = new();
        DateTimeOffset expires = new(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);

        await SeedActiveTrialTenantAsync(tenantRepository, expires);
        await policyRepository.EnsureDefaultTrialPolicyIfAbsentAsync(TenantId, 10m, expires, CancellationToken.None);

        TenantAiBudgetPolicyResolver sut = CreateResolver(tenantRepository, policyRepository, budgetRepository);

        TenantAiBudgetPolicySnapshot snapshot = await sut.ResolveAsync(TenantId, CancellationToken.None);

        snapshot.WorkspaceKind.Should().Be(AiUsageWorkspaceKind.Trial);
        snapshot.BudgetAmountUsd.Should().Be(10m);
        snapshot.HardStopEnabled.Should().BeTrue();
        snapshot.WalletOverageAllowed.Should().BeFalse();
        snapshot.BlocksAdditionalLlmExecution.Should().BeFalse();
    }

    [SkippableFact]
    public async Task ResolveAsync_self_service_trial_blocks_when_monthly_spend_reaches_persisted_ceiling()
    {
        InMemoryTenantRepository tenantRepository = new();
        InMemoryTenantAiBudgetPolicyRepository policyRepository = new();
        InMemoryLlmTenantBudgetRepository budgetRepository = new();
        DateTimeOffset expires = new(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);
        FakeTimeProvider timeProvider = new(new DateTimeOffset(2026, 7, 15, 12, 0, 0, TimeSpan.Zero));

        await SeedActiveTrialTenantAsync(tenantRepository, expires);
        await policyRepository.EnsureDefaultTrialPolicyIfAbsentAsync(TenantId, 10m, expires, CancellationToken.None);

        string periodKey = "2026-07";
        LlmTenantBudgetStateReadModel state =
            await budgetRepository.GetOrCreateAsync(TenantId, LlmBudgetPeriod.Monthly, periodKey, CancellationToken.None);

        await budgetRepository.SettleAsync(
            new LlmTenantBudgetSettleRequest
            {
                TenantId = TenantId,
                Period = LlmBudgetPeriod.Monthly,
                PeriodKey = periodKey,
                ExpectedRowVersion = state.RowVersion,
                ActualUsd = 10m,
            },
            CancellationToken.None);

        TenantAiBudgetPolicyResolver sut = CreateResolver(
            tenantRepository,
            policyRepository,
            budgetRepository,
            timeProvider);

        TenantAiBudgetPolicySnapshot snapshot = await sut.ResolveAsync(TenantId, CancellationToken.None);

        snapshot.BlocksAdditionalLlmExecution.Should().BeTrue();
    }

    private static async Task SeedActiveTrialTenantAsync(InMemoryTenantRepository tenantRepository, DateTimeOffset expires)
    {
        await tenantRepository.InsertTenantAsync(
            TenantId,
            "Trial Co",
            "trial-co",
            TenantTier.Standard,
            null,
            "us",
            CancellationToken.None);

        await tenantRepository.CommitSelfServiceTrialAsync(
            TenantId,
            expires.AddDays(-14),
            expires,
            runsLimit: 10,
            seatsLimit: 3,
            sampleRunId: Guid.NewGuid(),
            baselineReviewCycleHours: null,
            baselineReviewCycleSource: null,
            baselineReviewCycleCapturedUtc: null,
            companySize: null,
            architectureTeamSize: null,
            industryVertical: null,
            industryVerticalOther: null,
            CancellationToken.None);
    }

    private static TenantAiBudgetPolicyResolver CreateResolver(
        ITenantRepository tenantRepository,
        ITenantAiBudgetPolicyRepository policyRepository,
        ILlmTenantBudgetRepository budgetRepository,
        TimeProvider? timeProvider = null)
    {
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
                    HardCutoffUsdPerUtcMonth = 75m,
                });

        IConfiguration configuration = new ConfigurationBuilder().Build();

        return new TenantAiBudgetPolicyResolver(
            tenantRepository,
            policyRepository,
            budgetRepository,
            new InMemoryTenantAzureOpenAiConnectionRepository(),
            aiUsageOptions.Object,
            monthlyOptions.Object,
            configuration,
            timeProvider ?? TimeProvider.System);
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
